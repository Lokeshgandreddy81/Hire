import logging
import json
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from bson import ObjectId
from bson.errors import InvalidId

from app.db.mongo import get_db
from app.core.security import get_current_user
from app.core.redis_client import get_redis
from app.core.logging import increment_metric, measure_latency
from app.services.matching_algorithm import match_jobs_for_profile

# =============================================================================
# CONFIG
# =============================================================================
router = APIRouter()
logger = logging.getLogger("JobsRouter")

# =============================================================================
# SCHEMAS
# =============================================================================

class JobCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=100)
    company: str = Field(..., min_length=1)
    location: str
    minSalary: int = Field(..., ge=0)
    maxSalary: int = Field(..., ge=0)
    skills: List[str] = []
    experience_required: int = Field(0, ge=0)
    remote: bool = False
    description: str = Field(..., min_length=10)
    status: str = "active"

# =============================================================================
# UTILS
# =============================================================================

def safe_oid(val: str) -> ObjectId:
    try:
        return ObjectId(val)
    except InvalidId:
        raise HTTPException(400, "Invalid ID")

# =============================================================================
# JOB SEEKER FEED (MATCHED ONLY)
# =============================================================================

@router.get("/", response_model=List[dict])
async def get_jobs(
    profile_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    STRICT MATCHED JOB FEED
    - Returns ONLY matched jobs
    - match_percentage is FINAL
    - No frontend math allowed
    """
    db = get_db()
    user_id = current_user["id"]

    try:
        # 1. Resolve active profile
        if not profile_id:
            profile = await db["profiles"].find_one(
                {"user_id": user_id, "active": True},
                {"_id": 1},
                sort=[("created_at", -1)]
            )
            if not profile:
                return []
            profile_id = str(profile["_id"])

        # 2. Check Redis Cache (L1)
        redis = get_redis()
        cache_key = f"match:{user_id}:{profile_id}"
        
        try:
            cached_data = await redis.get(cache_key)
            if cached_data:
                increment_metric("match.cache.hit")
                logger.info(f"✅ Match Cache HIT for {cache_key}")
                return json.loads(cached_data)
        except Exception as e:
            logger.warning(f"Redis read failed: {e}. Falling back to compute.")

        # 3. Check Mongo Cache (L2 - Optional Persistence)
        cache = await db["job_matches"].find_one(
            {"user_id": user_id, "profile_id": profile_id}
        )
        if cache and cache.get("matches"):
            matches = cache["matches"]
            increment_metric("match.cache.hit.mongo")
            # Backfill Redis
            try:
                await redis.setex(cache_key, 600, json.dumps(matches))  # 10 min TTL
            except:
                pass
            return matches

        # 4. Compute matches (authoritative)
        increment_metric("match.cache.miss")
        logger.info(f"🔄 Match Cache MISS for {cache_key}. Computing...")
        
        async with measure_latency("match.compute_time"):
            matches = await match_jobs_for_profile(profile_id, user_id)

        # 🔒 HARD GUARANTEE: each match MUST contain
        # id, title, company, match_percentage
        for m in matches:
            m["id"] = str(m["id"])
            m["match_percentage"] = int(m.get("match_percentage", 0))

        # 5. Cache in Mongo (Persistence)
        await db["job_matches"].update_one(
            {"user_id": user_id, "profile_id": profile_id},
            {"$set": {
                "matches": matches,
                "updated_at": datetime.utcnow()
            }},
            upsert=True
        )
        
        # 6. Cache in Redis (Speed)
        try:
            await redis.setex(cache_key, 600, json.dumps(matches))  # 10 min TTL
        except Exception as e:
            logger.warning(f"Redis write failed: {e}")

        return matches

    except Exception as e:
        logger.error(f"JOB FEED ERROR: {e}")
        raise HTTPException(500, "Failed to load jobs")

# =============================================================================
# EMPLOYER JOBS
# =============================================================================

@router.get("/mine", response_model=List[dict])
async def get_my_jobs(current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        jobs = await db["jobs"].find(
            {"employer_id": current_user["id"]}
        ).sort("posted_at", -1).to_list(200)

        for j in jobs:
            j["id"] = str(j["_id"])
            j["_id"] = str(j["_id"])
            j["posted_at"] = j["posted_at"].isoformat()

        return jobs
    except Exception as e:
        logger.error(f"MY JOBS ERROR: {e}")
        raise HTTPException(500, "Failed")

# =============================================================================
# JOB DETAIL
# =============================================================================

@router.get("/{job_id}")
async def get_job_detail(
    job_id: str,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    oid = safe_oid(job_id)

    job = await db["jobs"].find_one({"_id": oid})
    if not job:
        raise HTTPException(404, "Job not found")

    job["id"] = str(job["_id"])
    job["_id"] = str(job["_id"])

    app = await db["applications"].find_one(
        {"job_id": job["id"], "user_id": current_user["id"]},
        {"status": 1}
    )

    job["application_status"] = app["status"] if app else None
    return job

# =============================================================================
# APPLY TO JOB (ATOMIC + CHAT)
# =============================================================================

@router.post("/{job_id}/apply")
async def apply_to_job(
    job_id: str,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    user_id = current_user["id"]
    oid = safe_oid(job_id)

    job = await db["jobs"].find_one({"_id": oid})
    if not job:
        raise HTTPException(404, "Job not found")

    existing = await db["applications"].find_one(
        {"job_id": job_id, "user_id": user_id}
    )
    if existing:
        return {
            "status": "already_applied",
            "application_id": str(existing["_id"]),
            "chat_id": existing.get("chat_id")
        }

    # 1. Create application
    app = {
        "job_id": job_id,
        "user_id": user_id,
        "employer_id": job["employer_id"],
        "status": "requested",
        "created_at": datetime.utcnow()
    }
    res = await db["applications"].insert_one(app)
    app_id = str(res.inserted_id)

    # 2. Chat Gating
    # We do NOT create a chat here.
    # Chat creation is deferred until the employer EXPECTS the application (in applications.py update_status).
    # This prevents spam and enforce "Match -> Request -> Accept -> Chat" flow.
    
    return {
        "status": "success",
        "application_id": app_id,
        "chat_id": None
    }

# =============================================================================
# CREATE JOB
# =============================================================================

@router.post("/", response_model=dict)
async def create_job(
    job: JobCreate,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    try:
        payload = job.dict()
        payload["employer_id"] = current_user["id"]
        payload["posted_at"] = datetime.utcnow()

        res = await db["jobs"].insert_one(payload)

        # Fix: PyMongo adds _id (ObjectId) to payload, which fails JSON serialization
        if "_id" in payload:
            del payload["_id"]

        return {
            "id": str(res.inserted_id),
            **payload,
            "posted_at": payload["posted_at"].isoformat()
        }
    except Exception as e:
        import traceback
        logger.error(f"CREATE JOB ERROR: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(500, f"DEBUG: {str(e)}")