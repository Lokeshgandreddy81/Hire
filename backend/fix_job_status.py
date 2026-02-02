import asyncio
import os
import sys

sys.path.append(os.getcwd())
from app.db.mongo import mongo_db

async def migrate():
    await mongo_db.connect()
    db = mongo_db.db
    
    # Set status='active' for ALL jobs missing it
    result = await db["jobs"].update_many(
        {"status": {"$exists": False}},
        {"$set": {"status": "active"}}
    )
    print(f"Updated {result.modified_count} jobs to active status.")
    
    mongo_db.close()

if __name__ == "__main__":
    asyncio.run(migrate())
