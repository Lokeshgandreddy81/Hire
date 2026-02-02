import asyncio
import os
import sys
import httpx
from datetime import datetime

sys.path.append(os.getcwd())
# We will use direct DB access to verify results, but API to perform actions to test the Routes.
from app.db.mongo import mongo_db
from app.core.security import create_access_token

BASE_URL = "http://127.0.0.1:8000/api/v1"

async def verify():
    # 1. Setup Data directly (users) or via API? 
    # Let's use direct DB for User creation to save time, then API for Job/Profile
    
    print("Connecting to DB...")
    await mongo_db.connect()
    db = mongo_db.db
    
    # Clean previous test users if any 
    # (Actually we acted on clean wipe, so just create new ones)
    
    # --- EMPLOYER ---
    emp_email = "employer@test.com"
    emp_user = await db["users"].find_one({"email": emp_email})
    if not emp_user:
        await db["users"].insert_one({
            "email": emp_email,
            "role": "employer",
            "identifier": "9999999999"    
        })
        emp_user = await db["users"].find_one({"email": emp_email})
    
    emp_token = create_access_token({"sub": "9999999999", "id": str(emp_user["_id"]), "role": "employer"})
    
    # --- SEEKER ---
    skr_email = "seeker@test.com"
    skr_user = await db["users"].find_one({"email": skr_email})
    if not skr_user:
        await db["users"].insert_one({
            "email": skr_email,
            "role": "candidate",
            "identifier": "8888888888"
        })
        skr_user = await db["users"].find_one({"email": skr_email})
        
    skr_token = create_access_token({"sub": "8888888888", "id": str(skr_user["_id"]), "role": "candidate"})

    headers_emp = {"Authorization": f"Bearer {emp_token}"}
    headers_skr = {"Authorization": f"Bearer {skr_token}"}

    
    # 2. POST JOB (Employer) - Direct DB
    print("Posting Job (Direct DB)...")
    job_payload = {
        "title": "Senior Python Developer",
        "company": "Tech Verify Corp",
        "location": "Remote",
        "salary": "$120k",
        "description": "Looking for Python expert.",
        "required_skills": ["Python", "FastAPI", "MongoDB"],
        "type": "Full-time",
        "employer_id": str(emp_user["_id"]),
        "posted_at": datetime.utcnow().isoformat(),
        "status": "active"
    }
    res_job = await db["jobs"].insert_one(job_payload)
    job_id = str(res_job.inserted_id)
    print("Job Posted Successfully.")

    # 3. CREATE PROFILE (Seeker) - Direct DB
    print("Creating Profile (Direct DB)...")
    profile_doc = {
        "user_id": str(skr_user["_id"]),
        "job_title": "Python Developer",
        "skills": ["Python", "FastAPI", "React"],
        "active": True,
        "created_at": datetime.utcnow().isoformat()
    }
    res_prof = await db["profiles"].insert_one(profile_doc)
    profile_id = str(res_prof.inserted_id)
    
    # 4. TRIGGER MATCHING
    print("Triggering Match Algorithm...")
    from app.services.matching_algorithm import match_jobs_for_profile
    matches = await match_jobs_for_profile(profile_id, str(skr_user["_id"]))
    
    # 5. VERIFY
    print(f"Matches Found: {len(matches)}")
    for m in matches:
        print(f" - {m['title']} (Score: {m['match_percentage']}%)")
        if m['title'] == "Senior Python Developer" and m['match_percentage'] > 60:
            print("SUCCESS: Target Job Matched!")
        else:
             print("WARNING: Job found but score low/wrong?")

    # Save match to DB
    if matches:
         await db["job_matches"].update_one(
            {"user_id": str(skr_user["_id"]), "profile_id": profile_id},
            {"$set": {"matches": matches, "updated_at": datetime.utcnow().isoformat()}},
            upsert=True
         )
         print("Matches saved to DB.")

    mongo_db.close()

if __name__ == "__main__":
    asyncio.run(verify())
