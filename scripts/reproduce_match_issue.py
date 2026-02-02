
import requests
import time
import sys
from pymongo import MongoClient

# Config
BASE_URL = "http://127.0.0.1:8000/api/v1"
MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "hire_db"

def reset_db():
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
        client.drop_database(DB_NAME)
        print("✅ DB Reset Complete")
    except Exception as e:
        print(f"⚠️ DB Reset Warning: {e}")

def register_user(email, role):
    # 1. Send OTP
    try:
        otp_resp = requests.post(f"{BASE_URL}/auth/send-otp", json={
            "identifier": email,
            "role": role
        })
        if otp_resp.status_code != 200:
            print(f"❌ Send OTP Failed: {otp_resp.text}")
            sys.exit(1)
            
        # 2. Verify OTP (Magic Code 123456)
        verify_resp = requests.post(f"{BASE_URL}/auth/verify-otp", json={
            "identifier": email,
            "otp": "123456",
            "role": role
        })
        
        if verify_resp.status_code != 200:
            print(f"❌ Login Failed for {email}: {verify_resp.text}")
            sys.exit(1)
            
        return verify_resp.json()["access_token"]
        
    except requests.exceptions.ConnectionError:
        print(f"❌ Connection Refused: Is Backend Running at {BASE_URL}?")
        sys.exit(1)

def create_profile(token):
    headers = {"Authorization": f"Bearer {token}"}
    profile_data = {
        "job_title": "React Developer",
        "location": "San Francisco",
        "experience_years": 5,
        "skills": ["React", "TypeScript", "Node.js"],
        "min_salary": 120000,
        "remote_work_preference": True,
        "summary": "Experienced React Dev"
    }
    resp = requests.post(f"{BASE_URL}/profiles/", json=profile_data, headers=headers)
    if resp.status_code != 200:
        # Check if already exists (400)
        if resp.status_code == 400 and "already exists" in resp.text:
             # Try to fetch it
             get_resp = requests.get(f"{BASE_URL}/profiles/", headers=headers)
             if get_resp.status_code == 200:
                 data = get_resp.json()
                 # Handle list vs object
                 if isinstance(data, list): return data[0]['id']
                 if 'profiles' in data: return data['profiles'][0]['id']
                 return data['id']

        print(f"❌ Profile Creation Failed: {resp.text}")
        sys.exit(1)
    return resp.json()["id"]

def post_job(token, title, skills, location="New York"):
    headers = {"Authorization": f"Bearer {token}"}
    job_data = {
        "title": title,
        "companyName": "Test Corp",
        "location": location,
        "minSalary": 100000,
        "maxSalary": 150000,
        "requirements": skills,
        "experience_required": 3,
        "remote": False,
        "status": "active"
    }
    resp = requests.post(f"{BASE_URL}/jobs/", json=job_data, headers=headers)
    if resp.status_code != 200:
        print(f"❌ Post Job Failed: {resp.text}")
        # Return dummy ID to allow script to verify others? No, fail hard.
        return None
    return resp.json()["id"]

def run_test():
    print("🚀 Starting Match Logic Reproduction...")
    reset_db()
    
    # Wait for server/DB to settle
    time.sleep(1)

    # 1. Setup Employer & Jobs
    print("👤 Creating Employer...")
    emp_token = register_user("employer@test.com", "employer")
    
    print("📝 Posting Jobs...")
    # Job 1: PERFECT MATCH
    post_job(emp_token, "React Developer", ["React", "TypeScript", "Node.js"], "San Francisco")
    
    # Job 2: PARTIAL MATCH (Different loc, same skills)
    post_job(emp_token, "React Developer", ["React", "TypeScript"], "New York")
    
    # Job 3: NO MATCH (Chef)
    post_job(emp_token, "Head Chef", ["Cooking", "Knife Skills"], "Chicago")
    
    # Job 4: NO MATCH (Driver)
    post_job(emp_token, "Truck Driver", ["Driving", "License"], "Austin")
    
    print("✅ Posted 4 Jobs")

    # 2. Setup Seeker
    print("👤 Creating Job Seeker...")
    seeker_token = register_user("seeker@test.com", "employee")
    profile_id = create_profile(seeker_token)
    print(f"✅ Created Seeker Profile (React Developer)")

    # 3. Get Matches
    print("🔍 Fetching Matches...")
    headers = {"Authorization": f"Bearer {seeker_token}"}
    
    # Ensure cache invalidation or freshness
    # Calling get_jobs
    resp = requests.get(f"{BASE_URL}/jobs/?profile_id={profile_id}", headers=headers)
    if resp.status_code != 200:
         print(f"❌ Get Jobs Failed: {resp.text}")
         sys.exit(1)
         
    matches = resp.json()

    print(f"\n📊 Results: Found {len(matches)} jobs")
    for m in matches:
        print(f" - [{m.get('match_percentage', 0)}%] {m['title']} ({m['location']})")

    # 4. ASSERT
    # Expect 1 or 2 matches (React dev), definitively NOT Chef or Driver.
    irrelevant_count = sum(1 for m in matches if m['title'] in ["Head Chef", "Truck Driver"])
    relevant_count = sum(1 for m in matches if m['title'] == "React Developer")

    if irrelevant_count > 0:
        print(f"\n❌ FAIL: Found {irrelevant_count} irrelevant jobs!")
        print("MATCHING LOGIC IS BROKEN (Too generous)")
        sys.exit(1)
    
    if relevant_count == 0:
        print(f"\n❌ FAIL: Found 0 relevant jobs! (Too strict?)")
        sys.exit(1)

    print("\n✅ PASS: Only relevant jobs returned.")

if __name__ == "__main__":
    run_test()
