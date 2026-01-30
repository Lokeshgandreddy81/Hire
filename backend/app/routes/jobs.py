from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from app.db.mongo import get_db
from app.core.security import get_current_user
from app.services.matching_algorithm import match_jobs_for_profile
from pydantic import BaseModel
from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId

router = APIRouter()

class Job(BaseModel):
    title: str
    company: str
    location: str
    salary: str
    description: str

@router.get("/", response_model=List[dict])
async def get_jobs(
    profile_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get matched jobs for user's active profile"""
    db = get_db()
    user_id = current_user.get("id")
    
    # If profile_id provided, get matches for that profile
    if profile_id:
        match_doc = await db["job_matches"].find_one({
            "user_id": user_id,
            "profile_id": profile_id
        })
        if match_doc:
            return match_doc.get("matches", [])
    
    # Otherwise, get user's active profile and its matches
    active_profile = await db["profiles"].find_one({
        "user_id": user_id,
        "active": True
    })
    
    if active_profile:
        profile_id = str(active_profile["_id"])
        match_doc = await db["job_matches"].find_one({
            "user_id": user_id,
            "profile_id": profile_id
        })
        if match_doc:
            return match_doc.get("matches", [])
    
    # No matches found, return empty
    return []

@router.get("/{job_id}")
async def get_job_detail(job_id: str, current_user: dict = Depends(get_current_user)):
    """Get detailed job information"""
    db = get_db()
    
    try:
        job = await db["jobs"].find_one({"_id": ObjectId(job_id)})
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid job ID format")
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job["_id"] = str(job["_id"])
    job["id"] = job["_id"]
    return job

@router.post("/{job_id}/apply")
async def apply_to_job(job_id: str, current_user: dict = Depends(get_current_user)):
    """Apply to a job - creates application and auto-chat"""
    db = get_db()
    user_id = current_user.get("id")
    
    # Validate job_id
    try:
        job_object_id = ObjectId(job_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid job ID format")
    
    # Check if already applied
    existing = await db["applications"].find_one({
        "user_id": user_id,
        "job_id": job_id
    })
    
    if existing:
        return {
            "status": "already_applied",
            "application_id": str(existing["_id"]),
            "chat_id": existing.get("chat_id")
        }
    
    # Get job details
    job = await db["jobs"].find_one({"_id": job_object_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Create application
    application = {
        "user_id": user_id,
        "job_id": job_id,
        "status": "applied",
        "applied_at": datetime.utcnow().isoformat(),
        "created_at": datetime.utcnow().isoformat()
    }
    
    result = await db["applications"].insert_one(application)
    application_id = str(result.inserted_id)
    
    # Create auto-chat
    chat = {
        "application_id": application_id,
        "user_id": user_id,
        "employer_id": job.get("employer_id", "system"),
        "job_id": job_id,
        "messages": [
            {
                "sender": "employer",
                "text": f"Thank you for applying to {job.get('title', 'this position')} at {job.get('company', 'our company')}. We'll review your application and get back to you soon!",
                "timestamp": datetime.utcnow().isoformat()
            }
        ],
        "created_at": datetime.utcnow().isoformat()
    }
    
    chat_result = await db["chats"].insert_one(chat)
    chat_id = str(chat_result.inserted_id)
    
    # Update application with chat_id
    await db["applications"].update_one(
        {"_id": result.inserted_id},
        {"$set": {"chat_id": chat_id}}
    )
    
    return {
        "status": "success",
        "application_id": application_id,
        "chat_id": chat_id
    }

@router.post("/", response_model=dict)
async def create_job(job: Job):
    db = get_db()
    result = await db["jobs"].insert_one(job.dict())
    return {"id": str(result.inserted_id), **job.dict()}
