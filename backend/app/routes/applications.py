import logging
from datetime import datetime
from typing import List
from enum import Enum

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from bson import ObjectId
from bson.errors import InvalidId

from app.db.mongo import get_db
from app.core.security import get_current_user

# =============================================================================
# CONFIG
# =============================================================================

router = APIRouter()
logger = logging.getLogger("ApplicationsRouter")

# =============================================================================
# SCHEMAS
# =============================================================================

class ApplicationStatus(str, Enum):
    REQUESTED = "requested"
    ACCEPTED = "accepted"
    REJECTED = "rejected"

class AppStatusUpdate(BaseModel):
    status: ApplicationStatus

class MessageCreate(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)

# =============================================================================
# HELPERS
# =============================================================================

def safe_oid(val: str) -> ObjectId:
    try:
        return ObjectId(val)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid ID format")

# =============================================================================
# GET APPLICATIONS (SEEKER + EMPLOYER)
# =============================================================================

@router.get("/")
async def get_applications(current_user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = current_user["id"]

    try:
        apps = await db["applications"].find(
            {
                "$or": [
                    {"user_id": user_id},
                    {"employer_id": user_id}
                ]
            }
        ).sort("updated_at", -1).to_list(100)

        results = []

        for app in apps:
            app_id = str(app["_id"])

            job = None
            try:
                job = await db["jobs"].find_one(
                    {"_id": safe_oid(app["job_id"])},
                    {"title": 1, "company": 1, "companyName": 1}
                )
            except Exception:
                pass

            chat = await db["chats"].find_one(
                {"application_id": app_id},
                {"_id": 1}
            )

            results.append({
                "id": app_id,
                "job_id": app.get("job_id"),   # Correct key for ProfilesTab grouping
                "candidateId": app.get("user_id"), # Needed for ProfilesTab logic
                "status": app.get("status"),
                "jobTitle": job.get("title") if job else "Deleted Job",
                "companyName": (
                    job.get("companyName") or job.get("company")
                    if job else "Unknown Company"
                ),
                "chatId": str(chat["_id"]) if chat else None,
                "updatedAt": app.get("updated_at")
            })

        return results

    except Exception as e:
        logger.error(f"GET APPLICATIONS ERROR: {e}")
        return []

# =============================================================================
# UPDATE STATUS (EMPLOYER ONLY)
# =============================================================================

@router.patch("/{app_id}/status")
async def update_status(
    app_id: str,
    payload: AppStatusUpdate,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    user_id = current_user["id"]

    oid = safe_oid(app_id)

    app = await db["applications"].find_one({"_id": oid})
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    if app["employer_id"] != user_id:
        raise HTTPException(status_code=403, detail="Only employer can update status")

    # 1. Update application status
    await db["applications"].update_one(
        {"_id": oid},
        {"$set": {
            "status": payload.status,
            "updated_at": datetime.utcnow().isoformat()
        }}
    )

    chat_id = None

    # 2. ACCEPT → ENSURE CHAT EXISTS (ATOMIC / IDEMPOTENT)
    if payload.status == ApplicationStatus.ACCEPTED:
        chat = await db["chats"].find_one({"application_id": app_id})

        if not chat:
            chat_doc = {
                "application_id": app_id,
                "job_id": app["job_id"],
                "user_id": app["user_id"],
                "employer_id": app["employer_id"],
                "messages": [],
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }

            res = await db["chats"].insert_one(chat_doc)
            chat_id = str(res.inserted_id)

            # back-link (self-healing)
            await db["applications"].update_one(
                {"_id": oid},
                {"$set": {"chat_id": chat_id}}
            )
        else:
            chat_id = str(chat["_id"])

    return {
        "status": "success",
        "application_status": payload.status,
        "chat_id": chat_id
    }