from fastapi import APIRouter, HTTPException, Depends, status
from typing import Dict, List, Optional
from app.db.mongo import get_db
from app.services.ai_extraction import extract_profile_from_interview
from app.core.security import get_current_user
from app.services.matching_algorithm import match_jobs_for_profile
from pydantic import BaseModel
from datetime import datetime
import asyncio

router = APIRouter()

class InterviewData(BaseModel):
    transcript: str
    video_url: Optional[str] = None

class ProfileCreate(BaseModel):
    job_title: str
    summary: str
    skills: List[str]
    experience_years: int
    location: str
    salary_expectations: str
    licenses_certifications: List[str] = []
    remote_work_preference: bool = False

@router.post("/process-interview")
async def process_interview(
    data: InterviewData,
    current_user: Dict = Depends(get_current_user)
):
    """Process interview transcript and extract profile data"""
    try:
        profile_data = extract_profile_from_interview(data.transcript)
        return {
            "status": "success",
            "profile": profile_data
        }
    except Exception as e:
        # Fallback to rule-based extraction if AI fails
        try:
            from app.services.ai_extraction import _extract_rule_based
            profile_data = _extract_rule_based(data.transcript)
            return {
                "status": "success",
                "profile": profile_data
            }
        except Exception as e2:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to process interview: {str(e2)}"
            )

@router.post("/create")
async def create_profile(
    profile: ProfileCreate,
    current_user: Dict = Depends(get_current_user)
):
    """Save user profile and trigger matching algorithm"""
    db = get_db()
    user_id = current_user.get("id")
    
    profile_doc = {
        "user_id": user_id,
        **profile.dict(),
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
        "active": True
    }
    
    result = await db["profiles"].insert_one(profile_doc)
    profile_id = str(result.inserted_id)
    
    # Trigger matching algorithm asynchronously
    asyncio.create_task(trigger_matching_algorithm(user_id, profile_id))
    
    return {
        "status": "success",
        "message": "Profile created successfully",
        "profile_id": profile_id
    }

@router.get("/")
async def get_profiles(current_user: Dict = Depends(get_current_user)):
    """Get all profiles for current user"""
    db = get_db()
    user_id = current_user.get("id")
    
    profiles = await db["profiles"].find({"user_id": user_id}).to_list(100)
    for profile in profiles:
        profile["_id"] = str(profile["_id"])
        profile["id"] = profile["_id"]
    
    return {"profiles": profiles}

async def trigger_matching_algorithm(user_id: str, profile_id: str):
    """Trigger job matching algorithm in background"""
    try:
        results = await match_jobs_for_profile(profile_id, user_id)
        # Store results in cache/database
        db = get_db()
        await db["job_matches"].update_one(
            {"user_id": user_id, "profile_id": profile_id},
            {"$set": {"matches": results, "updated_at": datetime.utcnow().isoformat()}},
            upsert=True
        )
    except Exception as e:
        print(f"Error in matching algorithm: {e}")
