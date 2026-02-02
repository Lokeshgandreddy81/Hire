import requests
import json
import sys
import os
import time

# Ensure backend directory is in path for internal db calls if needed (though we try to use API)
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

BASE_URL = "http://127.0.0.1:8000/api/v1"

# === 1. Setup & Helper Functions ===

def reset_db_internal():
    """Wipe DB using internal logic because we don't have a public WIPE endpoint"""
    print("⏳ Wiping DB internally...")
    # We must run this in a separate process or ensure async event loop handling
    # Simpler: Call the reset_db.py script
    import subprocess
    cmd = "source venv/bin/activate && python3 scripts/reset_db.py"
    # Adjust for running from root
    if os.path.exists("backend"):
        cmd = "cd backend && " + cmd
    
    # We assume we are in 'backend' dir based on 'Cwd' usually used
    # But usually we are in root.
    # Let's try running absolute path script
    script_path = os.path.abspath("scripts/reset_db.py")
    subprocess.run([sys.executable, script_path], check=True)
    print("✅ DB Wiped.")

def get_token(role, identifier="test@example.com"):
    # 1. Send OTP (Mock)
    requests.post(f"{BASE_URL}/auth/send-otp", json={"identifier": identifier, "role": role})
    # 2. Verify OTP (Hardcoded 123456)
    resp = requests.post(f"{BASE_URL}/auth/verify-otp", json={"identifier": identifier, "otp": "123456", "role": role})
    if resp.status_code != 200:
        print(f"❌ Auth Failed: {resp.text}")
        sys.exit(1)
    return resp.json()["access_token"]

# === 2. Configuration ===
ROLE_NAME = "Delivery Executive"
LOCATION = {"city": "Hyderabad", "lat": 17.385, "lon": 78.486}
COMMON_SKILLS = ["Driving", "Navigation", "Customer Service", "Time Management", "English"]

SEEKER_DATA = {
    "job_title": ROLE_NAME,
    "experience_years": 4,
    "skills": COMMON_SKILLS,
    "location": "Hyderabad", # API expects String
    "salary_expectations": "25000",
    "remote_work_preference": False,
    "summary": "Experienced delivery partner"
}

# === 3. Execution ===

def run_stress_test():
    print(f"🔍 Selected Test Role: {ROLE_NAME}")
    
    # A. Reset
    try:
        from app.db.mongo import get_db, mongo_db
        import asyncio
        async def wipe():
            print("⏳ Connecting to DB...")
            await mongo_db.connect()
            db = get_db()
            print("🔥 Wiping collections...")
            await db["users"].delete_many({})
            await db["profiles"].delete_many({})
            await db["jobs"].delete_many({})
            await db["applications"].delete_many({})
            await db["job_matches"].delete_many({})
            await db["chats"].delete_many({})
            
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(wipe())
        print("✅ DB Wiped (Direct Async).")
    except Exception as e:
        print(f"⚠️ Direct Wipe Failed: {e}")
        # Try to rely on the fact that if this failed, maybe connection is already open? 
        # But usually script starts fresh.
        sys.exit(1)

    # B. Create Seeker
    seeker_token = get_token("candidate", "seeker@test.com")
    headers_seeker = {"Authorization": f"Bearer {seeker_token}"}
    
    resp = requests.post(f"{BASE_URL}/profiles/create", json=SEEKER_DATA, headers=headers_seeker)
    if resp.status_code != 200:
        print(f"❌ Profile Creation Failed: {resp.text}")
        sys.exit(1)
    print("\n[TEST PROFILE CREATED]")
    print(f"Role: {ROLE_NAME}")
    print(f"Experience: {SEEKER_DATA['experience_years']}")
    print(f"Skills: {SEEKER_DATA['skills']}")
    print(f"Salary: {SEEKER_DATA['salary_expectations']}")
    
    # C. Create Employer & Jobs
    employer_token = get_token("employer", "employer@test.com")
    headers_emp = {"Authorization": f"Bearer {employer_token}"}
    
    jobs_config = [
        {"group": "A", "count": 3, "mod": "Ideal (30k)"},
        {"group": "B", "count": 4, "mod": "Good (24k)"},
        {"group": "C", "count": 3, "mod": "Borderline (18k)"},
        {"group": "D", "count": 2, "mod": "Bad (8k)"}
    ]
    
    created_jobs = []
    
    # =========================================================================
    # TEST SUITE: PRODUCTION CONFIDENCE
    # =========================================================================

    def create_job(payload):
         resp = requests.post(f"{BASE_URL}/jobs/", json=payload, headers=headers_emp)
         return resp.json()["id"] if resp.status_code == 200 else None

    # --- TEST 1: SALARY DOMINANCE (Extreme Spread) ---
         if resp.status_code == 200:
             return resp.json()["id"]
         print(f"❌ Job Creation Failed: {resp.text} | Payload: {payload}")
         return None

    scores = {}

    # --- TEST 1: SALARY ADVERSARIAL COLLAPSE (J1..J10) ---
    print("\n[TEST 1] SALARY ADVERSARIAL COLLAPSE...")
    t1_jobs = [50000, 40000, 30000, 25000, 22000, 18000, 15000, 10000, 8000, 5000]
    t1_ids = []
    
    for sal in t1_jobs:
        pid = create_job({
            "title": ROLE_NAME, "company": f"J-{sal}", "location": "Hyderabad",
            "salary": str(sal), "salary_range": {"min": 0, "max": sal},
            "required_skills": COMMON_SKILLS, "experience_required": 4, # Matching
            "description": f"Test 1 Job {sal}"
        })
        t1_ids.append(pid)

    # --- TEST 2: SKILL VS SALARY WAR ---
    print("\n[TEST 2] SKILL VS SALARY WAR...")
    # A: 50k, 100% Skills
    id_a = create_job({
        "title": "A", "company": "War-A", "location": "Hyderabad",
        "salary": "50000", "salary_range": {"max": 50000},
        "required_skills": COMMON_SKILLS, "experience_required": 4
    })
    # B: 50k, 50% Skills (Missing 3/5? No, 50% match. 2.5 skills? Let's give 2 skills overlap)
    # User has 5 skills. Job request overlap 2. 
    # Job Reqs: [Skill1, Skill2, Alien1, Alien2]. 4 Reqs. User has Skill1, Skill2. Match = 2/4 = 50%.
    id_b = create_job({
        "title": "B", "company": "War-B", "location": "Hyderabad",
        "salary": "50000", "salary_range": {"max": 50000},
        "required_skills": COMMON_SKILLS[:2] + ["Alien1", "Alien2"], "experience_required": 4
    })
    # C: 15k, 100% Skills
    id_c = create_job({
        "title": "C", "company": "War-C", "location": "Hyderabad",
        "salary": "15000", "salary_range": {"max": 15000},
        "required_skills": COMMON_SKILLS, "experience_required": 4
    })
    # D: 15k, 50% Skills
    id_d = create_job({
        "title": "D", "company": "War-D", "location": "Hyderabad",
        "salary": "15000", "salary_range": {"max": 15000},
        "required_skills": COMMON_SKILLS[:2] + ["Alien1", "Alien2"], "experience_required": 4
    })
    t2_ids = [id_a, id_b, id_c, id_d]

    # --- TEST 3: EXPERIENCE EDGE CASE ---
    print("\n[TEST 3] EXPERIENCE EDGE CASE...")
    # Profile has 4 years.
    # A: Req 2 (Overqualified? Good?)
    id_exp_a = create_job({
        "title": "Exp-A", "company": "Exp-A", "location": "Hyderabad",
        "salary": "30000", "salary_range": {"max": 30000},
        "required_skills": COMMON_SKILLS, "experience_required": 2
    })
    # B: Req 4 (Perfect)
    id_exp_b = create_job({
        "title": "Exp-B", "company": "Exp-B", "location": "Hyderabad",
        "salary": "30000", "salary_range": {"max": 30000},
        "required_skills": COMMON_SKILLS, "experience_required": 4
    })
    # C: Req 6 (Underqualified)
    id_exp_c = create_job({
        "title": "Exp-C", "company": "Exp-C", "location": "Hyderabad",
        "salary": "30000", "salary_range": {"max": 30000},
        "required_skills": COMMON_SKILLS, "experience_required": 6
    })
    t3_ids = [id_exp_a, id_exp_b, id_exp_c]

    # --- TEST 4: EXPLOIT DEFENSE ---
    print("\n[TEST 4] EXPLOIT DEFENSE...")
    # A: Null salary? (API might reject validation, so empty range)
    id_ex_a = create_job({
        "title": "Ex-A", "company": "Ex-A", "location": "Hyderabad",
        "salary": "", "salary_range": {}, # Empty
        "required_skills": COMMON_SKILLS, "experience_required": 4
    })
    # B: Negotiable
    id_ex_b = create_job({
        "title": "Ex-B", "company": "Ex-B", "location": "Hyderabad",
        "salary": "Negotiable", "salary_range": {}, # Empty
        "required_skills": COMMON_SKILLS, "experience_required": 4
    })
    # C: Range String 5k-8k (Parser test)
    id_ex_c = create_job({
        "title": "Ex-C", "company": "Ex-C", "location": "Hyderabad",
        "salary": "5k-8k", "salary_range": {"max": 0}, # Max 0 to force string parsing if any
        "salaryRange": "5000-8000", # Alternative field
        "required_skills": COMMON_SKILLS, "experience_required": 4
    })
    t4_ids = [id_ex_a, id_ex_b, id_ex_c]

    # --- TEST 7: MONOTONICITY (Micro) ---
    print("\n[TEST 7] MONOTONICITY (MICRO)...")
    t7_ids = []
    # 20k, 21k, 22k
    for s in [20000, 21000, 22000]:
        pid = create_job({
            "title": "Micro", "company": f"Micro-{s}", "location": "Hyderabad",
            "salary": str(s), "salary_range": {"max": s},
            "required_skills": COMMON_SKILLS, "experience_required": 4
        })
        t7_ids.append(pid)

    # TRIGGER MATCHING
    print("\n[CALCULATING MATCHES...]")
    resp = requests.get(f"{BASE_URL}/jobs/", headers=headers_seeker)
    matches = resp.json()
    match_map = {m["id"]: m.get("match_score", 0) for m in matches}
    
    # === VERIFICATION ===
    passed = True
    
    # Check T1 (Strict Descending)
    s1 = [match_map.get(jid, 0) for jid in t1_ids]
    print(f"T1 Scores (50k->5k): {s1}")
    if not all(s1[i] > s1[i+1] for i in range(len(s1)-1)):
        # Check for equality? "Any tie between jobs with different salaries is FAIL"
        # Check > condition
        if any(s1[i] == s1[i+1] for i in range(len(s1)-1)):
             print("❌ T1 FAIL: Tires detected")
             passed = False
        else:
             print("❌ T1 FAIL: Inversion detected")
             passed = False

    # Check T2 (A > B > C > D)
    s2 = [match_map.get(jid, 0) for jid in t2_ids] # A, B, C, D
    print(f"T2 Scores (A,B,C,D): {s2}")
    if not (s2[0] > s2[1] > s2[2] > s2[3]):
        print("❌ T2 FAIL: Order A > B > C > D violated")
        passed = False
        
    # Check T3 (A ~= B > C)
    s3 = [match_map.get(jid, 0) for jid in t3_ids] # A(2y), B(4y), C(6y)
    print(f"T3 Scores (2y, 4y, 6y): {s3}")
    if s3[2] >= s3[1]:
        print("❌ T3 FAIL: Underqualified (C) tied or beat Qualified (B)")
        passed = False
        
    # Check T4 (Exploit Defense)
    s4 = [match_map.get(jid, 0) for jid in t4_ids]
    print(f"T4 Scores (Null, Neg, Range): {s4}")
    # Requirement: Bottom of list, Score < valid jobs (e.g. < 0.5)
    if any(s >= 0.5 for s in s4):
        print("❌ T4 FAIL: Garbage salary scored >= 0.5")
        passed = False
        
    # Check T7 (20k < 21k < 22k)
    s7 = [match_map.get(jid, 0) for jid in t7_ids]
    print(f"T7 Scores (20k, 21k, 22k): {s7}")
    if not (s7[0] < s7[1] < s7[2]):
        print("❌ T7 FAIL: Monotonicity violation")
        passed = False

    print("\n" + ("="*30))
    if passed:
        print("PASS")
    else:
        print("FAIL")
    print("="*30)


if __name__ == "__main__":
    run_stress_test()
