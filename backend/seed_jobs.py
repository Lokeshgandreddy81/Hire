import asyncio
import os
import sys
from datetime import datetime

# Add current dir to path
sys.path.append(os.getcwd())

from app.db.mongo import mongo_db
from app.services.matching_algorithm import match_jobs_for_profile

async def seed():
    print("Connecting to DB...")
    await mongo_db.connect()
    db = mongo_db.db
    
    # Define Demo Jobs
    jobs = [
         {
            "employer_id": "seed_employer",
            "title": "Delivery Partner",
            "company": "FastDelivery",
            "location": {"city": "Bangalore", "lat": 12.9716, "lon": 77.5946},
            "salary_range": {"min": 20000, "max": 30000},
            "description": "Deliver packages on bike. License required.",
            "required_skills": ["Bike Riding", "Navigation", "Hindi"],
            "experience_required": 0,
            "license_required": True,
            "shift_type": "day",
            "remote": False,
            "status": "active",
            "posted_at": datetime.utcnow().isoformat()
        },
        {
            "employer_id": "seed_employer",
            "title": "Software Engineer",
            "company": "TechCorp",
            "location": {"city": "Remote", "lat": 0, "lon": 0},
            "salary_range": {"min": 80000, "max": 150000},
            "description": "Python and React developer needed.",
            "required_skills": ["Python", "React", "JavaScript", "SQL"],
            "experience_required": 2,
            "license_required": False,
            "shift_type": "day",
            "remote": True,
            "status": "active",
            "posted_at": datetime.utcnow().isoformat()
        },
        {
            "employer_id": "seed_employer",
            "title": "Sales Associate",
            "company": "MarketKing",
            "location": {"city": "Hyderabad", "lat": 17.3850, "lon": 78.4867},
            "salary_range": {"min": 25000, "max": 40000},
            "description": "Sales and customer facing role.",
            "required_skills": ["Communication", "Sales", "English", "Local Language"],
            "experience_required": 1,
            "license_required": False,
            "shift_type": "day",
            "remote": False,
            "status": "active",
            "posted_at": datetime.utcnow().isoformat()
        }
    ]

    print("Inserting/Updating Jobs...")
    for job in jobs:
        # Check duplicate by title
        dataset = await db["jobs"].find_one({"title": job["title"], "company": job["company"]})
        if not dataset:
            await db["jobs"].insert_one(job)
            print(f"Inserted: {job['title']}")
        else:
            print(f"Skipped (Exists): {job['title']}")

    # Trigger Matching for All Profiles
    print("Re-calculating matches for all profiles...")
    profiles = await db["profiles"].find({}).to_list(100)
    for p in profiles:
        pid = str(p["_id"])
        uid = p["user_id"]
        matches = await match_jobs_for_profile(pid, uid)
        
        # Save matches
        if matches:
            await db["job_matches"].update_one(
                {"user_id": uid, "profile_id": pid},
                {"$set": {"matches": matches, "updated_at": datetime.utcnow().isoformat()}},
                upsert=True
            )
            print(f"Profile {pid}: Found {len(matches)} matches.")
        else:
            print(f"Profile {pid}: No matches found.")

    print("Success! Jobs seeded and matches updated.")
    mongo_db.close()

if __name__ == "__main__":
    asyncio.run(seed())
