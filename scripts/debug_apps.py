import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

# DB Config
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = "hire_app_db"

async def fix_applications():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("--- CHECKING APPLICATIONS ---")
    apps = await db.applications.find({}).to_list(None)
    
    fixed_count = 0
    
    for app in apps:
        app_id = app["_id"]
        job_id = app.get("job_id")
        employer_id = app.get("employer_id")
        
        print(f"App {app_id}: Job={job_id}, Employer={employer_id}")
        
        if not employer_id:
            # Look up job
            try:
                job = await db.jobs.find_one({"_id": ObjectId(job_id)})
                if job:
                    actual_owner = job.get("employer_id")
                    if actual_owner:
                        print(f"  -> Fixing App {app_id}: Set employer_id={actual_owner}")
                        await db.applications.update_one(
                            {"_id": app_id},
                            {"$set": {"employer_id": actual_owner}}
                        )
                        fixed_count += 1
                    else:
                        print("  -> Job found but has no employer_id!")
                else:
                    print("  -> Job NOT found!")
            except Exception as e:
                print(f"  -> Error looking up job: {e}")
        else:
            print("  -> OK")

    print(f"--- FINISHED. Fixed {fixed_count} applications. ---")

if __name__ == "__main__":
    asyncio.run(fix_applications())
