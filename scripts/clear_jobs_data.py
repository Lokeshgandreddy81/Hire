import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

# DB Config
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = "hire_app_db"

async def clear_jobs_data():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print(f"🔥 CONNECTING to {DB_NAME}...")
    
    # CLEAR ALL DATA (Including Users/Profiles for full reset)
    collections = ["jobs", "applications", "chats", "job_matches", "users", "profiles"]
    
    print("🧹 CLEARING JOB DATA ONLY...")
    for col_name in collections:
        res = await db[col_name].delete_many({})
        print(f"   - Deleted {res.deleted_count} docs from '{col_name}'")
            
    print("✅ JOB DATA CLEARED. Profiles/Users preserved.")

if __name__ == "__main__":
    asyncio.run(clear_jobs_data())
