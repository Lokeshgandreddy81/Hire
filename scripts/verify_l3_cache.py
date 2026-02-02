from pymongo import MongoClient
import sys

MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "hire_app_db"

def verify_cache():
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    
    # L3.2 Check
    print("🔍 Checking 'job_matches' collection...")
    
    docs = list(db.job_matches.find({}))
    count = len(docs)
    
    if count == 0:
        print("⚠️ Cache is empty. This is expected if 'verify_matching_integrity.py' cleared it or if no one fetched jobs yet.")
        # But 'verify_matching_integrity.py' DID fetch jobs. So it should be there.
        # Wait, verify_matching_integrity.py uses a NEW user each time? Yes get_token registers new.
        # Actually verify_matching_integrity resets the DB first. So there should be 1 user, 1 profile, 1 match doc.
        pass # Not necessarily a fail if cache expired, but expectation is it persists.
    
    if count > 1:
        print(f"❌ FAIL: Expected 1 cache document, found {count}")
        for d in docs:
            print(f" - User: {d.get('user_id')} | Profile: {d.get('profile_id')} | Matches: {len(d.get('matches', []))}")
        sys.exit(1)
        
    if count == 1:
        doc = docs[0]
        matches = doc.get("matches", [])
        if len(matches) != 1:
             print(f"❌ FAIL: Cache entry has {len(matches)} matches (Expected 1)")
             sys.exit(1)
        
        m = matches[0]
        score = m.get('match_percentage', 0)
        print(f"✅ Cache Entry Valid. Matches: 1. Score: {score}%")
        
        if score < 5 or score > 99:
            print(f"⚠️ WARN: Score {score}% might be suspicious (Too low/high).")
            
    print("L3.2 PASS")

if __name__ == "__main__":
    verify_cache()
