from fastapi import APIRouter, Depends
from typing import List
from app.db.mongo import get_db
from pydantic import BaseModel

router = APIRouter()

class Job(BaseModel):
    title: str
    company: str
    location: str
    salary: str
    description: str

@router.get("/", response_model=List[dict])
async def get_jobs():
    db = get_db()
    # Return cursor as list
    jobs = await db["jobs"].find().to_list(100)
    # Convert _id to str
    for job in jobs:
        job["_id"] = str(job["_id"])
        job["id"] = job["_id"]
    return jobs

@router.post("/", response_model=dict)
async def create_job(job: Job):
    db = get_db()
    result = await db["jobs"].insert_one(job.dict())
    return {"id": str(result.inserted_id), **job.dict()}
