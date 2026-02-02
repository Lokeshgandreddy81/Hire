import asyncio
import os
import sys
from pprint import pprint

sys.path.append(os.getcwd())
from app.db.mongo import mongo_db

async def debug():
    await mongo_db.connect()
    db = mongo_db.db
    
    print("\n=== JOBS ===")
    jobs = await db["jobs"].find().to_list(100)
    for j in jobs:
        print(f"Job: {j.get('title')} | Skills: {j.get('required_skills')} | ID: {j.get('_id')}")

    print("\n=== PROFILES ===")
    profiles = await db["profiles"].find().to_list(100)
    for p in profiles:
        print(f"Profile: {p.get('job_title')} | Skills: {p.get('skills')} | ID: {p.get('_id')} | User: {p.get('user_id')}")

    print("\n=== MATCHES ===")
    matches = await db["job_matches"].find().to_list(100)
    for m in matches:
        count = len(m.get('matches', []))
        print(f"User: {m.get('user_id')} | Profile: {m.get('profile_id')} | Match Count: {count}")
        if count > 0:
            top = m['matches'][0]
            print(f"  Top Match: {top.get('title')} ({top.get('match_percentage')}%)")

    print("\n=== MANUAL MATCH TEST ===")
    # IDs from previous run
    test_pid = "697f27fb99acfbb4cf556d32" 
    test_uid = "697f27e099acfbb4cf556d31"
    
    from app.services.matching_algorithm import match_jobs_for_profile
    matches = await match_jobs_for_profile(test_pid, test_uid)
    print(f"Manual Match Result: {len(matches)}")
    for m in matches:
        print(f" - {m.get('title')} (Score: {m.get('match_percentage')}%)")
        
    # SAVE TO DB!!!!
    if matches:
         from datetime import datetime
         await db["job_matches"].update_one(
            {"user_id": test_uid, "profile_id": test_pid},
            {"$set": {"matches": matches, "updated_at": datetime.utcnow().isoformat()}},
            upsert=True
         )
         print("Matches SAVED to DB.")

    mongo_db.close()

if __name__ == "__main__":
    asyncio.run(debug())
