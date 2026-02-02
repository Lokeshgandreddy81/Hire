import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "hire_app_db")

async def cleanup():
    """
    Cleans up the database by keeping only the most recent job posting
    and removing all older seed/test data.
    """
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print(f"🔌 Connecting to database: {DB_NAME}...")
    
    try:
        # Fetch all jobs, sorted by most recent first (_id contains timestamp)
        # Using a limit of 1000 to be safe, increase if you have massive seed data
        jobs = await db["jobs"].find({}).sort("_id", -1).to_list(1000)
        
        count = len(jobs)
        print(f"📊 Found {count} total jobs.")
        
        if count <= 1:
            print("✅ No cleanup needed (0 or 1 job found).")
            return

        # 1. Identify the Survivor (The most recent job)
        latest_job = jobs[0]
        print(f"🛡️  KEEPING: '{latest_job.get('title', 'Untitled')}'")
        print(f"    ID: {latest_job.get('_id')}")
        print(f"    Company: {latest_job.get('company', 'Unknown')}")
        
        # 2. Identify the Victims (Everything else)
        ids_to_delete = [j["_id"] for j in jobs[1:]]
        
        if not ids_to_delete:
            return

        # 3. Bulk Delete
        print(f"🗑️  Deleting {len(ids_to_delete)} old/seed jobs...")
        result = await db["jobs"].delete_many({"_id": {"$in": ids_to_delete}})
        
        print(f"✅ Successfully deleted {result.deleted_count} jobs.")
        
        # 4. Clear Cache
        # Job matches are now stale because we deleted the underlying jobs
        match_result = await db["job_matches"].delete_many({})
        print(f"🧹 Cleared {match_result.deleted_count} stale match records from cache.")

    except Exception as e:
        print(f"❌ Error during cleanup: {e}")
    finally:
        client.close()
        print("🔌 Connection closed.")

if __name__ == "__main__":
    asyncio.run(cleanup())