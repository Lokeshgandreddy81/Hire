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

def get_token(email, role):
    # 1. Send OTP
    requests.post(f"{BASE_URL}/auth/send-otp", json={"identifier": email, "role": role})
    # 2. Verify OTP
    r = requests.post(f"{BASE_URL}/auth/verify-otp", json={
        "identifier": email, 
        "otp": "123456", 
        "role": role
    })
    check(r.status_code == 200, f"Auth Success: {role}")
    return r.json()["access_token"]

def run_verification():
    s = get_session()
    
    # 0. SETUP
    step("SETUP: Creating Accounts & Job")
    emp_email = f"emp_chat_{int(time.time())}@test.com"
    seek_email = f"seek_chat_{int(time.time())}@test.com"
    
    emp_token = get_token(emp_email, "employer")
    seek_token = get_token(seek_email, "employee")
    
    emp_headers = {"Authorization": f"Bearer {emp_token}"}
    seek_headers = {"Authorization": f"Bearer {seek_token}"}
    
    # Post Job
    job_payload = {
        "title": "Chat Engineer",
        "companyName": "Talkative Corp",
        "location": "Remote",
        "minSalary": 100000,
        "maxSalary": 120000,
        "requirements": ["Chatting"],
        "experience_required": 1,
        "remote": True,
        "status": "active"
    }
    r = requests.post(f"{BASE_URL}/jobs/", json=job_payload, headers=emp_headers)
    job_id = r.json()["id"]
    print(f"   Job ID: {job_id}")

    # Create Profile
    profile_payload = {
        "job_title": "Chat Engineer",
        "location": "Remote",
        "experience_years": 2,
        "skills": ["Chatting"],
        "summary": "I chat.",
        "remote_work_preference": True
    }
    requests.post(f"{BASE_URL}/profiles/", json=profile_payload, headers=seek_headers)

    # Apply
    step("SETUP: Applying to Job")
    r = requests.post(f"{BASE_URL}/jobs/{job_id}/apply", headers=seek_headers)
    check(r.status_code == 200, "Applied successfully")
    # Get Application ID from response if available, or fetch list
    # The apply endpoint returns { "status": "success", "application_id": "...", "chat_id": "..." }
    app_data = r.json()
    app_id = app_data.get("application_id")
    
    if not app_id:
        # Fallback fetch
        r = requests.get(f"{BASE_URL}/applications/", headers=seek_headers)
        apps = r.json()
        my_app = next((a for a in apps if a["job_id"] == job_id), None)
        app_id = my_app["id"]
    
    print(f"   App ID: {app_id}")

    # =========================================================================
    # E7. ACCEPT/REJECT ACTION
    # =========================================================================
    step("E7: Employer Accepts Application")
    
    # Check initial status
    r = requests.get(f"{BASE_URL}/applications/", headers=emp_headers)
    emp_apps = r.json()
    target_app = next((a for a in emp_apps if a["id"] == app_id), None)
    check(target_app["status"] == "requested", "Initial status is 'requested'")

    # Employer Accepts
    # PATCH /applications/{id}/status
    r = requests.patch(f"{BASE_URL}/applications/{app_id}/status", 
                       json={"status": "accepted"}, 
                       headers=emp_headers)
    check(r.status_code == 200, "Status update request success")
    check(r.json()["new_status"] == "accepted", "Response confirms 'accepted'")
    
    # Verify Persistence
    r = requests.get(f"{BASE_URL}/applications/", headers=emp_headers)
    target_app = next((a for a in r.json() if a["id"] == app_id), None)
    check(target_app["status"] == "accepted", "Status persisted as 'accepted'")

    # =========================================================================
    # E8. CHAT INITIATION (Employer sends first message)
    # =========================================================================
    step("E8: Employer Initiates Chat")
    
    msg_payload = {"text": "Hello, when can we interview?"}
    r = requests.post(f"{BASE_URL}/applications/{app_id}/message", 
                      json=msg_payload, 
                      headers=emp_headers)
    check(r.status_code == 200, "Message sent successfully")
    msg_data = r.json()
    check(msg_data["text"] == "Hello, when can we interview?", "Message content verified")
    
    # =========================================================================
    # J7. CHAT RESPONSE (Seeker replies)
    # =========================================================================
    step("J7: Seeker Replies to Chat")
    
    # Seeker checks messages (Refetch Application)
    r = requests.get(f"{BASE_URL}/applications/", headers=seek_headers)
    my_app = next((a for a in r.json() if a["id"] == app_id), None)
    
    # Check if messages exist in app object
    messages = my_app.get("messages", [])
    check(len(messages) > 0, "Seeker sees messages")
    check(messages[-1]["text"] == "Hello, when can we interview?", "Seeker sees Employer's message")
    
    # Seeker Replies
    reply_payload = {"text": "How about tomorrow?"}
    r = requests.post(f"{BASE_URL}/applications/{app_id}/message", 
                      json=reply_payload, 
                      headers=seek_headers)
    check(r.status_code == 200, "Reply sent successfully")
    
    # =========================================================================
    # VERIFY CHAT HISTORY
    # =========================================================================
    step("FINAL: Verifying Chat History")
    
    r = requests.get(f"{BASE_URL}/applications/", headers=emp_headers)
    target_app = next((a for a in r.json() if a["id"] == app_id), None)
    msgs = target_app.get("messages", [])
    check(len(msgs) >= 2, "Conversation has 2+ messages")
    check(msgs[0]["sender_id"] != msgs[1]["sender_id"], "Senders are different (Ping Pong verified)")
    
    print(f"\n{GREEN}✨ HIRING & CHAT FLOW VERIFIED!{RESET}")

if __name__ == "__main__":
    try:
        run_verification()
    except Exception as e:
        print(f"{RED}❌ Script Error: {e}{RESET}")
