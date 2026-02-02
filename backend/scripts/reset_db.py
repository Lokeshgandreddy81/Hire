import asyncio
from app.db.mongo import get_db, close_mongo_connection
import os

async def reset_db():
    print("⏳ Connecting to DB...")
    db = get_db()
    
    collections = ["jobs", "profiles", "applications", "chats", "job_matches", "users"]
    
    print("🔥 Wiping collections...")
    for col in collections:
        await db[col].delete_many({})
        print(f"   - {col}: Cleared")
        
    print("✅ Database Reset Complete.")

if __name__ == "__main__":
    import sys
    sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
    import asyncio
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(reset_db())
