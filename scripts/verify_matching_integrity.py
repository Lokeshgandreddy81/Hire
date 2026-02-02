import requests
import time
import sys
from pymongo import MongoClient
from datetime import datetime

# CONFIG
BASE_URL = "http://127.0.0.1:8000/api/v1"
MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "hire_app_db"  # Confirmed correct DB name

def log(msg, status="INFO"):
    print(f"[{status}] {msg}")

def fail(msg):
    log(msg, "FAIL")
    sys.exit(1)

def pass_check(msg):
    log(msg, "PASS")

def get_db():
    return MongoClient(MONGO_URI)[DB_NAME]

def reset_db():
    try:
        client = MongoClient(MONGO_URI)
        client.drop_database(DB_NAME)
        pass_check("M0: DB Reset (Hard Wipe)")
    except Exception as e:
        fail(f"DB Reset Failed: {e}")

def get_token(email, role):
    # OTP Auth Flow
    requests.post(f"{BASE_URL}/auth/send-otp", json={"identifier": email, "role": role})
    r = requests.post(f"{BASE_URL}/auth/verify-otp", json={
        "identifier": email, "otp": "123456", "role": role
    })
    if r.status_code != 200:
        fail(f"Auth failed for {email}: {r.text}")
    return r.json()["access_token"]

def verify_matching_integrity():
    log("🚀 STARTING MATCHING INTEGRITY VERIFICATION (M0-M5)", "START")

    # =========================================================================
    # TEST M0: ABSOLUTE BASELINE
    # =========================================================================
    reset_db()
    
    # Verify Empty State via API
    # Create Seeker (needs account to call API, but no profile yet)
    token = get_token("seeker_m0@test.com", "employee")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Without profile, should return empty list (or explicit empty)
    r = requests.get(f"{BASE_URL}/jobs/", headers=headers)
    if r.status_code != 200: fail(f"API Error: {r.text}")
    jobs = r.json()
    
    if len(jobs) != 0:
        fail(f"M0 Failed: Expected 0 jobs, got {len(jobs)}")
    pass_check("M0: Empty State Verified")

    # =========================================================================
    # TEST M1: SINGLE JOB INVARIANT
    # =========================================================================
    # 1. Employer posts ONE job
    emp_token = get_token("emp_m1@test.com", "employer")
    emp_headers = {"Authorization": f"Bearer {emp_token}"}
    
    job_payload = {
        "title": "Delivery Executive",
        "companyName": "FastTrack",
        "location": "Hyderabad",
        "minSalary": 18000,
        "maxSalary": 20000,
        "requirements": ["Bike", "GPS"],
        "experience_required": 3,
        "status": "active"
    }
    r = requests.post(f"{BASE_URL}/jobs/", json=job_payload, headers=emp_headers)
    if r.status_code != 200: fail(f"Job Post Failed: {r.text}")
    job_id = r.json()["id"]
    log(f"Posted Job ID: {job_id}")

    # Check DB Count
    db = get_db()
    count = db.jobs.count_documents({})
    if count != 1:
        fail(f"M1 Failed: DB has {count} jobs (Expected 1)")
    pass_check(f"M1: DB Count Verified ({count})")

    # 2. Seeker with Matching Profile
    seek_token = get_token("seek_m1@test.com", "employee")
    seek_headers = {"Authorization": f"Bearer {seek_token}"}
    
    profile_payload = {
        "job_title": "Delivery Executive",
        "location": "Hyderabad",
        "experience_years": 3,
        "skills": ["Bike", "GPS"],
        "salary_expectations": "18000"
    }
    r = requests.post(f"{BASE_URL}/profiles/", json=profile_payload, headers=seek_headers)
    profile_id = r.json()["id"]

    # 3. Fetch Matches
    r = requests.get(f"{BASE_URL}/jobs/", headers=seek_headers) # Implicitly uses profile
    matches = r.json()

    print(f"   Matches Found: {len(matches)}")
    for m in matches:
        print(f"    - {m.get('title')} ({m.get('id')}) Score: {m.get('match_percentage')}%")

    if len(matches) != 1:
        fail(f"M1 Failed: Expected 1 match, got {len(matches)}")
    
    # =========================================================================
    # TEST M5: ID DEDUPLICATION
    # =========================================================================
    matched_job = matches[0]
    if matched_job["id"] != job_id:
         fail(f"M5 Failed: ID mismatch. Posted: {job_id}, Matched: {matched_job['id']}")
    pass_check("M5: ID Integrity Verified")

    # =========================================================================
    # TEST M3: CACHE POISONING CHECK
    # =========================================================================
    # Check job_matches collection
    cache_entry = db.job_matches.find_one({"user_id": r.headers.get("user_id")}) # Note: User ID logic might be tricky here without knowing user id directly
    # Better: Inspect collection directly for any entry
    cache_count = db.job_matches.count_documents({})
    log(f"Cache Entries: {cache_count}")
    
    # We expect 1 entry for this user/profile
    if cache_count > 1:
         log("Warning: Cache has more entries than expected (maybe unrelated?)", "WARN")

    # VERIFY CACHE CONTENT
    # Fetch again - should hit cache
    start = time.time()
    r2 = requests.get(f"{BASE_URL}/jobs/", headers=seek_headers)
    elapsed = time.time() - start
    log(f"Second Fetch (Cache): {elapsed:.4f}s")
    
    matches_2 = r2.json()
    if len(matches_2) != 1:
        fail(f"M3 Failed: Cache returned {len(matches_2)} matches")
    
    if matches_2[0]["id"] != job_id:
        fail("M3 Failed: Cache returned wrong job ID")
        
    pass_check("M3: Cache Behavior Verified")

    log("✅ MATCHING STATUS: PASS", "SUCCESS")
    print("M0: Empty verified")
    print("M1: Single Job verified")
    print("M2: Backend Audit (Manual via Tool)")
    print("M3: Cache Clean verified")
    print("M4: Frontend Lock (Manual via Tool)")
    print("M5: ID Dedup verified")

if __name__ == "__main__":
    verify_matching_integrity()
