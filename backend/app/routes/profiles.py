from fastapi import APIRouter, HTTPException, Depends, status, Request
from typing import Dict, List, Optional
from app.db.mongo import get_db
from app.services.ai_extraction import extract_profile_from_interview
from app.core.security import get_current_user
from app.core.logging import log_event
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
    request: Request,
    data: InterviewData,
    current_user: Dict = Depends(get_current_user)
):
    """Process interview transcript and extract profile data"""
    request_id = getattr(request.state, "request_id", None)
    log_event("interview_processed", request_id=request_id, user_id=current_user.get("id"))
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
    request: Request,
    profile: ProfileCreate,
    current_user: Dict = Depends(get_current_user)
):
    """Save user profile and trigger matching algorithm"""
    request_id = getattr(request.state, "request_id", None)
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
    log_event("profile_saved", request_id=request_id, profile_id=profile_id, user_id=user_id)
    log_event("matching_started", request_id=request_id, profile_id=profile_id, user_id=user_id)

    asyncio.create_task(trigger_matching_algorithm(user_id, profile_id, request_id))

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

async def trigger_matching_algorithm(user_id: str, profile_id: str, request_id: Optional[str] = None):
    """Trigger job matching algorithm in background"""
    from app.core.logging import log_event
    try:
        results = await match_jobs_for_profile(profile_id, user_id)
        db = get_db()
        await db["job_matches"].update_one(
            {"user_id": user_id, "profile_id": profile_id},
            {"$set": {"matches": results, "updated_at": datetime.utcnow().isoformat()}},
            upsert=True
        )
        log_event("matching_completed", request_id=request_id, profile_id=profile_id, match_count=len(results))
    except Exception as e:
        log_event("matching_error", request_id=request_id, profile_id=profile_id, level="error", error=str(e)[:100])
