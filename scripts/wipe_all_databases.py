import asyncio
import os
import redis.asyncio as redis
from motor.motor_asyncio import AsyncIOMotorClient

# Config Match
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = "hire_app_db"
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

async def wipe_all():
    print("🧨 STARTING TOTAL SYSTEM WIPE")

    # 1. WIPE MONGO
    try:
        mongo_client = AsyncIOMotorClient(MONGO_URL)
        print(f"   - Dropping MongoDB Database: {DB_NAME}...")
        await mongo_client.drop_database(DB_NAME)
        print("   ✅ MongoDB Dropped.")
    except Exception as e:
        print(f"   ❌ Mongo Wipe Failed: {e}")

    # 2. WIPE REDIS
    try:
        r = redis.from_url(REDIS_URL)
        print("   - Flushing Redis...")
        await r.flushall()
        print("   ✅ Redis Flushed.")
    except Exception as e:
        print(f"   ❌ Redis Wipe Failed: {e}")
    
    print("✨ SYSTEM CLEAN. All data destroyed.")

if __name__ == "__main__":
    asyncio.run(wipe_all())
