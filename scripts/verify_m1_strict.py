import requests
import time
import sys
from pymongo import MongoClient

BASE_URL = "http://127.0.0.1:8000/api/v1"
MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "hire_app_db"

def reset_db():
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
        client.drop_database(DB_NAME)
        print("✅ DB Reset Complete")
    except Exception as e:
        print(f"❌ DB Reset Failed: {e}")
        sys.exit(1)

def get_token(email, role):
    requests.post(f"{BASE_URL}/auth/send-otp", json={"identifier": email, "role": role})
    r = requests.post(f"{BASE_URL}/auth/verify-otp", json={
        "identifier": email, "otp": "123456", "role": role
    })
    if r.status_code != 200:
        print(f"❌ Auth Failed for {email}: {r.text}")
        sys.exit(1)
    return r.json()["access_token"]

def verify_m1():
    print("🛡️ STARTING M1.2 CONTROLLED MATCHING PROOF")
    
    # S0.1 HARD RESET
    reset_db()
    time.sleep(1) # Let backend settle

    # 1. Create Employer & ONE Job
    emp_token = get_token("emp_m1@test.com", "employer")
    emp_headers = {"Authorization": f"Bearer {emp_token}"}
    
    job_payload = {
        "title": "Delivery Executive",
        "companyName": "FastTrack Logistics",
        "location": "New York", # Matching logic uses string match/inclusion
        "minSalary": 18000,
        "maxSalary": 20000,
        "requirements": ["Bike", "GPS", "Cash handling"],
        "experience_required": 3,
        "remote": False,
        "status": "active"
    }
    r = requests.post(f"{BASE_URL}/jobs/", json=job_payload, headers=emp_headers)
    if r.status_code != 200: print(f"❌ Job Post Failed: {r.text}"); sys.exit(1)
    print("✅ Job Posted: Delivery Executive")

    # 2. Create Seeker & Application
    seek_token = get_token("seek_m1@test.com", "employee")
    seek_headers = {"Authorization": f"Bearer {seek_token}"}
    
    profile_payload = {
        "job_title": "Delivery Executive",
        "location": "New York",
        "experience_years": 3,
        "skills": ["Bike", "GPS", "Cash handling"],
        "salary_expectations": "18000",
        "remote_work_preference": False
    }
    r = requests.post(f"{BASE_URL}/profiles/", json=profile_payload, headers=seek_headers)
    if r.status_code != 200: print(f"❌ Profile Failed: {r.text}"); sys.exit(1)
    profile_id = r.json()["id"]
    print(f"✅ Profile Created: {profile_id}")

    # 3. Call Match
    # Note: Triggering match via GET /jobs which calls match_jobs_for_profile internally
    print("🔍 Fetching Matches...")
    r = requests.get(f"{BASE_URL}/jobs/?profile_id={profile_id}", headers=seek_headers)
    matches = r.json()
    
    # REQUIRED RESULT
    # • Exactly 1 job
    print(f"   Found {len(matches)} matches:")
    for m in matches:
        print(f"    - {m.get('title')} ({m.get('companyName')}) Score: {m.get('match_percentage')}% ID: {m.get('id')}")

    if len(matches) != 1:
        print(f"❌ FAIL: Expected 1 match, got {len(matches)}")
        sys.exit(1)
    
    target = matches[0]
    
    # • Match % ≥ 70%
    score = target.get("match_percentage", 0)
    print(f"   Match Score: {score}%")
    if score < 70:
        print(f"❌ FAIL: Score {score}% is < 70%")
        sys.exit(1)
        
    # • No duplicates (Checked by len=1)
    # • No extra jobs (Checked by len=1)

    print("\n✅ STATUS: PASS")
    print("Matching verified ✔")
    print("Jobs feed locked ✔ (Implicit by strictly 1 match)")

if __name__ == "__main__":
    verify_m1()
