import asyncio
import os
import sys

sys.path.append(os.getcwd())
from app.db.mongo import mongo_db

async def inspect():
    await mongo_db.connect()
    db = mongo_db.db
    
    print("\n=== ALL JOBS ===")
    jobs = await db["jobs"].find().to_list(1000)
    for j in jobs:
        print(f"Title: '{j.get('title')}' | Employer: '{j.get('employer_id')}' | ID: {j.get('_id')}")

    mongo_db.close()

if __name__ == "__main__":
    asyncio.run(inspect())
