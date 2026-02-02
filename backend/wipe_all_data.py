import asyncio
import os
import sys

sys.path.append(os.getcwd())
from app.db.mongo import mongo_db

async def wipe():
    print("Connecting...")
    await mongo_db.connect()
    db = mongo_db.db

    print("Wiping Collections...")
    
    # Jobs
    r1 = await db["jobs"].delete_many({})
    print(f"Deleted {r1.deleted_count} Jobs.")
    
    # Matches
    r2 = await db["job_matches"].delete_many({})
    print(f"Deleted {r2.deleted_count} Matches.")
    
    # Applications
    r3 = await db["applications"].delete_many({})
    print(f"Deleted {r3.deleted_count} Applications.")
    
    # Chats
    r4 = await db["chats"].delete_many({})
    print(f"Deleted {r4.deleted_count} Chats.")
    
    # Profiles (Candidates)
    r5 = await db["profiles"].delete_many({})
    print(f"Deleted {r5.deleted_count} Profiles.")
    
    print("\nSUCCESS: System is clean. Users/Login data preserved.")
    mongo_db.close()

if __name__ == "__main__":
    asyncio.run(wipe())
