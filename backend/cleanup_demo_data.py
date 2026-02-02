import asyncio
import os
import sys

sys.path.append(os.getcwd())
from app.db.mongo import mongo_db
from app.services.matching_algorithm import match_jobs_for_profile
from datetime import datetime

async def cleanup():
    print("Connecting...")
    await mongo_db.connect()
    db = mongo_db.db

    print("Deleting persistent demo jobs...")
    result3 = await db["jobs"].delete_many({"title": "Senior Backend Engineer"})
    print(f"Deleted {result3.deleted_count} 'Senior Backend Engineer' jobs.")

    # Re-calculate matches for ALL profiles
    print("Refreshing matches...")
    profiles = await db["profiles"].find({}).to_list(1000)
    for p in profiles:
        pid = str(p["_id"])
        uid = p["user_id"]
        matches = await match_jobs_for_profile(pid, uid)
        
        # Save matches (even if empty to clear old ones)
        await db["job_matches"].update_one(
            {"user_id": uid, "profile_id": pid},
            {"$set": {"matches": matches, "updated_at": datetime.utcnow().isoformat()}},
            upsert=True
        )
        print(f"Profile {pid}: Updated matches ({len(matches)} found).")

    print("Cleanup Complete.")
    mongo_db.close()

if __name__ == "__main__":
    asyncio.run(cleanup())
