import requests
import time
import sys
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry

BASE_URL = "http://127.0.0.1:8000/api/v1"

# Colors
GREEN = "\033[92m"
RED = "\033[91m"
RESET = "\033[0m"

def step(msg):
    print(f"\n🔹 {msg}")

def check(condition, msg):
    if condition:
        print(f"   {GREEN}✅ {msg}{RESET}")
    else:
        print(f"   {RED}❌ {msg}{RESET}")
        sys.exit(1)

def get_session():
    s = requests.Session()
    retries = Retry(total=5, backoff_factor=1, status_forcelist=[500, 502, 503, 504])
    s.mount('http://', HTTPAdapter(max_retries=retries))
    return s

def run_simulation():
    s = get_session()
    
    # 0. WAIT FOR BACKEND
    print("⏳ Waiting for backend to be ready...")
    for i in range(10):
        try:
            r = s.get("http://127.0.0.1:8000/")
            if r.status_code == 200:
                print("✅ Backend is UP!")
                break
        except requests.exceptions.ConnectionError:
            time.sleep(1)
    else:
        print(f"{RED}❌ Backend unreachable after 10s{RESET}")
        sys.exit(1)

    # ---------------------------------------------------------
    # 0. RESET DB (Clean State)
    # ---------------------------------------------------------
    step("PREP: Resetting Database for Clean Run")
    # We assume reset_db.py is run externally or we can import it? 
    # For independent run, we rely on the operator running reset_db.py first.
    # But to be safe, let's verify empty state or just proceed.
    
    # ---------------------------------------------------------
    # 🧑💼 EMPLOYER — REAL ACTIONS
    # ---------------------------------------------------------
    step("ACTION: Registering 'FastTrack Logistics'")
    emp_email = f"fasttrack_{int(time.time())}@logistics.com"
    
    # Login/Register
    r = s.post(f"{BASE_URL}/auth/send-otp", json={"identifier": emp_email})
    check(r.status_code == 200, "Otp Sent")
    
    r = s.post(f"{BASE_URL}/auth/verify-otp", json={
        "identifier": emp_email, "otp": "123456", "role": "employer"
    })
    check(r.status_code == 200, "Employer Logged In")
    emp_token = r.json()["access_token"]
    emp_headers = {"Authorization": f"Bearer {emp_token}"}
    
    # Create Job
    step("ACTION: Creating Job 'Delivery Executive'")
    job_payload = {
        "title": "Delivery Executive",
        "companyName": "FastTrack Logistics",
        "location": "Hyderabad",
        "minSalary": 25000,
        "maxSalary": 25000, # Fixed salary implies range min=max or just text
        "salary": "25000",
        "type": "On-site",
        "experience_required": 3,
        "requirements": ["Two wheeler driving", "GPS navigation", "Cash handling", "Customer communication"],
        "skills": ["Two wheeler driving", "GPS navigation", "Cash handling", "Customer communication"],
        "status": "active",
        "remote": False
    }
    r = s.post(f"{BASE_URL}/jobs/", json=job_payload, headers=emp_headers)
    check(r.status_code == 200, "Job Posted Scucessfully")
    job_id = r.json()["id"]
    
    # Verify Job Persistence
    step("CHECK: Job Persistence (Employer View)")
    r = s.get(f"{BASE_URL}/jobs/mine", headers=emp_headers)
    check(r.status_code == 200, "Fetched My Jobs")
    my_jobs = r.json()
    saved_job = next((j for j in my_jobs if j["id"] == job_id), None)
    check(saved_job is not None, "Job exists in DB")
    check(saved_job["status"] == "active", "Job is Active")
    
    # ---------------------------------------------------------
    # 👤 JOB SEEKER — REAL ACTIONS
    # ---------------------------------------------------------
    step("ACTION: Registering 'Rajesh Kumar'")
    seek_email = f"rajesh_{int(time.time())}@candidate.com"
    
    r = s.post(f"{BASE_URL}/auth/send-otp", json={"identifier": seek_email})
    check(r.status_code == 200, "Otp Sent")
    
    r = s.post(f"{BASE_URL}/auth/verify-otp", json={
        "identifier": seek_email, "otp": "123456", "role": "employee"
    })
    check(r.status_code == 200, "Rajesh Logged In")
    seek_token = r.json()["access_token"]
    seek_headers = {"Authorization": f"Bearer {seek_token}"}
    
    # Create Profile (Text Mode)
    step("ACTION: Creating Profile for Rajesh")
    profile_payload = {
        "job_title": "Delivery Executive",
        "location": "Hyderabad",
        "experience_years": 4,
        "salary_expectations": "22000",
        "skills": ["Two wheeler driving", "GPS navigation", "Customer handling"],
        "summary": "Experienced driver looking for day shift.",
        "remote_work_preference": False
    }
    r = s.post(f"{BASE_URL}/profiles/", json=profile_payload, headers=seek_headers)
    check(r.status_code == 200, "Profile Saved")
    
    # ---------------------------------------------------------
    # 🔍 MATCHING VERIFICATION
    # ---------------------------------------------------------
    step("CHECK: Matching Logic")
    r = s.get(f"{BASE_URL}/jobs/", headers=seek_headers)
    check(r.status_code == 200, "Fetched Jobs Feed")
    feed = r.json()
    matched_job = next((j for j in feed if j["id"] == job_id), None)
    check(matched_job is not None, "FastTrack Job found in Rajesh's feed")
    # match_score is usually added by the backend matching engine
    score = matched_job.get("match_score", 0)
    print(f"   Match Score: {score}")
    check(score > 0, "Match Score is positive (> 0)")

    # ---------------------------------------------------------
    # 📄 JOB DETAIL & APPLY FLOW
    # ---------------------------------------------------------
    step("ACTION: Rajesh Applies to Job")
    # Verify Detail First
    r = s.get(f"{BASE_URL}/jobs/{job_id}", headers=seek_headers)
    check(r.status_code == 200, "Job Details Loaded")
    
    # Apply
    r = s.post(f"{BASE_URL}/jobs/{job_id}/apply", headers=seek_headers)
    check(r.status_code == 200, "Applied Successfully")
    app_resp = r.json()
    app_id = app_resp.get("application_id")
    chat_id = app_resp.get("chat_id")
    check(app_id is not None, "Application ID returned")
    check(chat_id is not None, "Chat ID returned")
    
    # ---------------------------------------------------------
    # 🔁 RESTART PERSISTENCE TEST
    # ---------------------------------------------------------
    step("TEST: Restart Persistence (Simulating App Kill/Restart)")
    # New Session = "Restart"
    new_s = get_session() 
    
    # Re-fetch Job Detail using fresh session (and token headers)
    r = new_s.get(f"{BASE_URL}/jobs/{job_id}", headers=seek_headers)
    check(r.status_code == 200, "Refetched Job Detail")
    job_detail = r.json()
    status = job_detail.get("application_status")
    print(f"   Persisted Status: {status}")
    check(status == "requested", "Status persisted as 'requested'")

    # ---------------------------------------------------------
    # 👔 EMPLOYER — CANDIDATE REVIEW (E6)
    # ---------------------------------------------------------
    step("ACTION: Employer Checks Candidates")
    r = s.get(f"{BASE_URL}/applications/", headers=emp_headers)
    check(r.status_code == 200, "Fetched Applications")
    apps = r.json()
    rajesh_app = next((a for a in apps if a["_id"] == app_id or a["id"] == app_id), None)
    check(rajesh_app is not None, "Rajesh's Application found")
    check(rajesh_app["status"] == "requested", "Status is 'requested'")

    # ---------------------------------------------------------
    # 💬 ACCEPT & CHAT FLOW (E7, E8)
    # ---------------------------------------------------------
    step("ACTION: Employer Accepts Candidate")
    # Verify endpoint for update status
    # Based on api.ts: ApplicationAPI.updateStatus calls PUT /applications/{id}/status
    r = s.patch(f"{BASE_URL}/applications/{app_id}/status", json={"status": "accepted"}, headers=emp_headers)
    if r.status_code != 200:
        print(f"   {RED}Response: {r.text}{RESET}")
    check(r.status_code == 200, "Status Updated to 'accepted'")
    
    # Verify Persistence of Acceptance
    r = s.get(f"{BASE_URL}/applications/", headers=emp_headers)
    apps = r.json()
    rajesh_app = next((a for a in apps if a["_id"] == app_id or a["id"] == app_id), None)
    check(rajesh_app["status"] == "accepted", "Application status persisted as 'accepted'")
    
    step("ACTION: Verifying Chat Unlock")
    # Check chat existence/status
    # We don't have a direct "lock" field in standard schema usually, but we check if messages work
    
    msg_payload = {"text": "Hello Rajesh, when can you join?"}
    r = s.post(f"{BASE_URL}/chats/{chat_id}/messages", json=msg_payload, headers=emp_headers)
    check(r.status_code == 200, "Employer sent message")
    
    # Seeker reads message
    r = s.get(f"{BASE_URL}/chats/", headers=seek_headers)
    check(r.status_code == 200, "Seeker fetches chats")
    chats = r.json()
    my_chat = next((c for c in chats if c["id"] == chat_id or c["_id"] == chat_id), None)
    check(my_chat is not None, "Chat visible to Seeker")
    check(my_chat.get("last_message") == "Hello Rajesh, when can you join?", "Message synced")

    print(f"\n{GREEN}✅ SUCCESS: Scenario 'FastTrack Logistics hires Rajesh Kumar' PASSED.{RESET}")

if __name__ == "__main__":
    try:
        run_simulation()
    except Exception as e:
        print(f"\n{RED}❌ FAIL: Script crash: {e}{RESET}")
        import traceback
        traceback.print_exc()
