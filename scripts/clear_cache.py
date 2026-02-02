import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

# DB Config
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = "hire_app_db"

async def clear_cache():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("--- CLEARING JOB MATCH CACHE ---")
    res = await db.job_matches.delete_many({})
    print(f"Deleted {res.deleted_count} cached match records.")
    
    # Also clear REDIS if we had a client, but Mongo cache is usually the L2 persistence.
    # Redis is L1 and expires fast (10 mins).
    
    print("--- DONE ---")

if __name__ == "__main__":
    asyncio.run(clear_cache())
