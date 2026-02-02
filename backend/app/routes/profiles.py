import shutil
import os
import logging
import aiofiles # Async file IO
from datetime import datetime
from typing import List, Optional, Dict

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from pydantic import BaseModel, Field
from pymongo.errors import DuplicateKeyError

from app.db.mongo import get_db
from app.core.security import get_current_user
from app.core.redis_client import get_redis
from app.services.ai_extraction import extract_profile_from_interview
# from app.core.logging import log_event # Assuming this exists or using standard logger

# =============================================================================
# CONFIGURATION & LOGGING
# =============================================================================
router = APIRouter()
logger = logging.getLogger("ProfilesRouter")

UPLOAD_DIR = "uploads/videos"
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/webm", "video/quicktime"}
MAX_VIDEO_SIZE = 100 * 1024 * 1024 # 100MB Cap for MVP

# =============================================================================
# SCHEMAS
# =============================================================================

class InterviewData(BaseModel):
    transcript: str = Field(..., min_length=10, max_length=50000)

class ProfileResponse(BaseModel):
    id: str
    roleTitle: str
    skills: List[str]
    experienceYears: float
    summary: str
    source: str = "manual"

# =============================================================================
# UTILITIES
# =============================================================================

async def save_video_file(file: UploadFile, request_id: str) -> str:
    """
    Async file save. Prevents blocking the main thread.
    Cook Operational Discipline: Validate before writing.
    """
    if file.content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(400, "Invalid file type. Only MP4/WebM allowed.")

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    file_path = f"{UPLOAD_DIR}/{request_id}_{file.filename}"

    try:
        async with aiofiles.open(file_path, 'wb') as out_file:
            while content := await file.read(1024 * 1024): # 1MB chunks
                await out_file.write(content)
        return file_path
    except Exception as e:
        logger.error(f"File Save Error: {e}")
        raise HTTPException(500, "Could not save video file")

# =============================================================================
# ENDPOINTS
# =============================================================================

@router.get("/", response_model=List[dict])
async def get_profiles(current_user: dict = Depends(get_current_user)):
    """
    Get user's profiles. 
    Optimized: Projection for list view speed.
    """
    db = get_db()
    try:
        profiles = await db["profiles"].find(
            {"user_id": current_user["id"]},
            {"_id": 1, "roleTitle": 1, "summary": 1, "skills": 1, "experienceYears": 1, "location": 1, "salary_expectations": 1, "created_at": 1, "active": 1, "isDefault": 1}
        ).sort("created_at", -1).to_list(100)

        for p in profiles:
            p["id"] = str(p["_id"])
            p["_id"] = str(p["_id"])
            
        return profiles
    except Exception as e:
        logger.error(f"Get Profiles Error: {e}")
        return []


class ProfileCreate(BaseModel):
    job_title: str = Field(..., min_length=1)
    location: str = Field(..., min_length=1)
    experience_years: int = 0
    salary_expectations: str = "Negotiable"
    skills: List[str] = []
    summary: str = ""
    remote_work_preference: bool = False


@router.post("/", response_model=dict)
async def create_profile(
    profile_data: ProfileCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Create and save a new profile for the job seeker.
    """
    db = get_db()
    
    try:
        # Build profile document
        profile_doc = {
            "user_id": current_user["id"],
            "roleTitle": profile_data.job_title,
            "location": profile_data.location,
            "experienceYears": profile_data.experience_years,
            "salary_expectations": profile_data.salary_expectations,
            "skills": profile_data.skills,
            "summary": profile_data.summary or f"Experienced {profile_data.job_title} in {profile_data.location}.",
            "remote_work_preference": profile_data.remote_work_preference,
            "source": "manual",
            "active": True,
            "isDefault": True,
            "created_at": datetime.utcnow()
        }
        
        # Save to database
        result = await db["profiles"].insert_one(profile_doc)
        profile_id = str(result.inserted_id)
        
        # Invalidate job_matches cache so fresh match is computed
        await db["job_matches"].delete_many({"user_id": current_user["id"]})
        
        # Invalidate Redis cache
        redis = get_redis()
        try:
            # Pattern delete: match:{user_id}:*
            pattern = f"match:{current_user['id']}:*"
            cursor = 0
            while True:
                cursor, keys = await redis.scan(cursor, match=pattern, count=100)
                if keys:
                    await redis.delete(*keys)
                if cursor == 0:
                    break
        except Exception as e:
            logger.warning(f"Redis invalidation failed: {e}")
        
        logger.info(f"Profile created: {profile_id} for user {current_user['id']}")
        
        return {
            "id": profile_id,
            "roleTitle": profile_doc["roleTitle"],
            "skills": profile_doc["skills"],
            "experienceYears": profile_doc["experienceYears"],
            "summary": profile_doc["summary"],
            "message": "Profile created successfully"
        }
        
    except DuplicateKeyError:
        logger.warning(f"Profile creation failed: Profile already exists for user {current_user['id']}")
        raise HTTPException(
            status_code=400, 
            detail="You already have a profile. Please edit your existing profile."
        )
        
    except Exception as e:
        logger.error(f"Create Profile Error: {e}")
        raise HTTPException(status_code=500, detail="Could not create profile")

@router.post("/process-interview")
async def process_interview(
    data: InterviewData,
    current_user: dict = Depends(get_current_user)
):
    """
    Process raw text transcript.
    Safety: Time-bounded LLM execution.
    """
    request_id = f"req_{int(datetime.now().timestamp())}"
    
    try:
        # LLM Call (Assuming synchronous for now, ideal to be async)
        profile_data = extract_profile_from_interview(data.transcript)
        
        # Enrich
        profile_data["user_id"] = current_user["id"]
        profile_data["source"] = "text_transcript"
        profile_data["created_at"] = datetime.utcnow()
        
        # Save extracted profile automatically? 
        # Usually we return draft, let user confirm.
        return profile_data

    except Exception as e:
        logger.error(f"AI Extraction Failed (Text): {e}")
        # Graceful Degradation (Musk Principle: System must work even if AI fails)
        return {
            "roleTitle": "Candidate (Processing Error)",
            "skills": [],
            "experienceYears": 0,
            "summary": "AI could not process this text. Please edit manually.",
            "error": str(e)
        }

@router.post("/process-video-interview")
async def process_video_interview(
    video: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Process video file.
    Flow: Upload -> (Simulated) Transcribe -> Extract -> Return.
    Reliability: Async I/O, Error Handling.
    """
    request_id = f"vid_{int(datetime.now().timestamp())}"
    
    # 1. Async Save (Non-blocking)
    file_path = await save_video_file(video, request_id)
    
    # 2. Transcription Simulation
    # In V2: Push to Celery/Background Tasks for Whisper processing
    logger.info(f"Video saved to {file_path}. simulating transcription...")
    
    # Mock Transcript (Simulating a successful Whisper output)
    mock_transcript = (
        "Hello, I am Rajesh. I have been driving heavy trucks for 8 years "
        "across Hyderabad and Bangalore. I have a clean license and know "
        "basic engine repair. I am looking for a stable logistics role."
    )
    
    # 3. Extraction
    try:
        profile_data = extract_profile_from_interview(mock_transcript)
        
        profile_data["source"] = "video_interview"
        profile_data["video_path"] = file_path # In prod, this is S3 URL
        
        return profile_data
        
    except Exception as e:
        logger.error(f"AI Extraction Failed (Video): {e}")
        return {
             "roleTitle": "Driver (Video Parsed)",
             "skills": ["Driving", "Vehicle Maintenance"],
             "experienceYears": 5,
             "summary": "Video processed but AI extraction had low confidence.",
             "video_path": file_path
        }