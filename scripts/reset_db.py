import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

# Connect to local Mongo or use env var
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = "hire_app_db"

async def reset_db():
    print(f"🔥 CONNECTING to {MONGO_URL}...")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    collections = ["jobs", "profiles", "applications", "chats", "job_matches"]
    
    print("🧹 CLEARING COLLECTIONS...")
    for col_name in collections:
        count = await db[col_name].count_documents({})
        if count > 0:
            await db[col_name].delete_many({})
            print(f"   - Cleared {count} docs from '{col_name}'")
        else:
            print(f"   - '{col_name}' was already empty")
            
    print("✅ DATABASE RESET COMPLETE. Ready for E1.")

if __name__ == "__main__":
    asyncio.run(reset_db())
