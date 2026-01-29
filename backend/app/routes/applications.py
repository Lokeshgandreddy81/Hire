from fastapi import APIRouter, Depends
from typing import List
from app.db.mongo import get_db
from app.core.security import get_current_user

router = APIRouter()

@router.get("/")
async def get_applications(current_user: dict = Depends(get_current_user)):
    """Get all applications for current user"""
    db = get_db()
    user_id = current_user.get("id")
    
    applications = await db["applications"].find({"user_id": user_id}).to_list(100)
    
    # Enrich with job details
    for app in applications:
        app["_id"] = str(app["_id"])
        app["id"] = app["_id"]
        
        # Get job details
        from bson import ObjectId
        job = await db["jobs"].find_one({"_id": ObjectId(app["job_id"])})
        if job:
            app["job_title"] = job.get("title", "Unknown")
            app["company_name"] = job.get("company", "Unknown")
    
    return applications
