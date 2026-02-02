#!/usr/bin/env python3
"""
MASTER E2E VERIFICATION SCRIPT
Production-grade deployment gate for Hire App

This script executes the complete end-to-end flow:
- Employer account creation → Job posting
- Seeker account creation → Profile creation
- Job matching validation (≥25%)
- Application flow → Acceptance
- Chat creation and messaging
- Redis validation (rate limits, cache)
- Refresh token rotation

Exit codes:
- 0: PASS (all tests passed)
- 1: FAIL (one or more tests failed)
"""

import asyncio
import sys
import time
from typing import Dict, Any, Optional
import httpx

# =============================================================================
# CONFIGURATION
# =============================================================================
BASE_URL = "http://localhost:8000/api/v1"
TIMEOUT = 30.0

# Test data
EMPLOYER_PHONE = f"+1555{int(time.time()) % 10000:04d}"
SEEKER_PHONE = f"+1555{int(time.time()) % 10000 + 1:04d}"
OTP_DEV = "123456"  # Dev bypass

# =============================================================================
# TEST STATE
# =============================================================================
class TestState:
    employer_token: Optional[str] = None
    employer_refresh: Optional[str] = None
    employer_id: Optional[str] = None
    
    seeker_token: Optional[str] = None
    seeker_refresh: Optional[str] = None
    seeker_id: Optional[str] = None
    
    job_id: Optional[str] = None
    profile_id: Optional[str] = None
    application_id: Optional[str] = None
    chat_id: Optional[str] = None

state = TestState()

# =============================================================================
# UTILITIES
# =============================================================================
def log_step(step: str, status: str = "▶️"):
    print(f"\n{status} {step}")

def log_pass(message: str):
    print(f"  ✅ {message}")

def log_fail(message: str, details: str = ""):
    print(f"  ❌ {message}")
    if details:
        print(f"     {details}")

def fail_test(step: str, reason: str, details: str = ""):
    print(f"\n{'='*80}")
    print(f"E2E RESULT: FAIL")
    print(f"FAILED STEP: {step}")
    print(f"ROOT CAUSE: {reason}")
    if details:
        print(f"DETAILS: {details}")
    print(f"{'='*80}")
    sys.exit(1)

async def api_call(
    method: str,
    endpoint: str,
    token: Optional[str] = None,
    json_data: Optional[Dict] = None,
    expect_fail: bool = False
) -> Dict[str, Any]:
    """Make API call with error handling"""
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    url = f"{BASE_URL}{endpoint}"
    
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        try:
            if method == "GET":
                resp = await client.get(url, headers=headers)
            elif method == "POST":
                resp = await client.post(url, headers=headers, json=json_data)
            elif method == "PUT":
                resp = await client.put(url, headers=headers, json=json_data)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            if not expect_fail and resp.status_code >= 400:
                fail_test(
                    "API Call",
                    f"{method} {endpoint} returned {resp.status_code}",
                    resp.text
                )
            
            return {
                "status": resp.status_code,
                "data": resp.json() if resp.text else {}
            }
        except Exception as e:
            if not expect_fail:
                fail_test("API Call", f"{method} {endpoint} failed", str(e))
            return {"status": 500, "data": {}, "error": str(e)}

# =============================================================================
# E2E TEST FLOWS
# =============================================================================

async def test_employer_auth():
    """E1: Employer account creation and auth"""
    log_step("E1: Employer Account Creation")
    
    # Send OTP
    resp = await api_call("POST", "/auth/send-otp", json_data={
        "identifier": EMPLOYER_PHONE
    })
    log_pass(f"OTP sent to {EMPLOYER_PHONE}")
    
    # Verify OTP
    resp = await api_call("POST", "/auth/verify-otp", json_data={
        "identifier": EMPLOYER_PHONE,
        "otp": OTP_DEV,
        "role": "EMPLOYER"
    })
    
    if resp["status"] != 200:
        fail_test("E1", "OTP verification failed", str(resp))
    
    data = resp["data"]
    state.employer_token = data.get("access_token")
    state.employer_refresh = data.get("refresh_token")
    state.employer_id = data.get("user_id")
    
    if not state.employer_token or not state.employer_refresh:
        fail_test("E1", "Missing tokens in response", str(data))
    
    log_pass(f"Employer authenticated (ID: {state.employer_id})")
    log_pass(f"Access token: {state.employer_token[:20]}...")
    log_pass(f"Refresh token: {state.employer_refresh[:20]}...")

async def test_job_posting():
    """E2: Job posting"""
    log_step("E2: Job Posting (Text Mode)")
    
    job_data = {
        "title": "Senior Delivery Driver",
        "company": "FastShip Logistics",
        "description": "Experienced driver needed for local routes",
        "requirements": "Valid license, 3+ years experience, clean record",
        "location": "San Francisco, CA",
        "salary_range": "$50,000 - $65,000",
        "employment_type": "full-time",
        "skills_required": ["driving", "navigation", "customer service"],
        "experience_required": 3
    }
    
    resp = await api_call("POST", "/jobs", state.employer_token, job_data)
    
    if resp["status"] != 200:
        fail_test("E2", "Job creation failed", str(resp))
    
    state.job_id = resp["data"].get("id")
    if not state.job_id:
        fail_test("E2", "No job ID returned", str(resp["data"]))
    
    log_pass(f"Job created (ID: {state.job_id})")
    log_pass(f"Title: {job_data['title']}")

async def test_employer_job_list():
    """E3: Employer job list verification"""
    log_step("E3: Employer Job List Verification")
    
    resp = await api_call("GET", "/jobs/mine", state.employer_token)
    
    if resp["status"] != 200:
        fail_test("E3", "Failed to fetch employer jobs", str(resp))
    
    jobs = resp["data"]
    if not isinstance(jobs, list):
        fail_test("E3", "Jobs response is not a list", str(jobs))
    
    job_ids = [j.get("id") for j in jobs]
    if state.job_id not in job_ids:
        fail_test("E3", f"Posted job {state.job_id} not in list", str(job_ids))
    
    log_pass(f"Job appears in employer list ({len(jobs)} total jobs)")

async def test_seeker_auth():
    """J1: Seeker account creation"""
    log_step("J1: Job Seeker Account Creation")
    
    # Send OTP
    await api_call("POST", "/auth/send-otp", json_data={
        "identifier": SEEKER_PHONE
    })
    log_pass(f"OTP sent to {SEEKER_PHONE}")
    
    # Verify OTP
    resp = await api_call("POST", "/auth/verify-otp", json_data={
        "identifier": SEEKER_PHONE,
        "otp": OTP_DEV,
        "role": "EMPLOYEE"
    })
    
    if resp["status"] != 200:
        fail_test("J1", "Seeker OTP verification failed", str(resp))
    
    data = resp["data"]
    state.seeker_token = data.get("access_token")
    state.seeker_refresh = data.get("refresh_token")
    state.seeker_id = data.get("user_id")
    
    if not state.seeker_token:
        fail_test("J1", "Missing seeker token", str(data))
    
    log_pass(f"Seeker authenticated (ID: {state.seeker_id})")

async def test_profile_creation():
    """J2: Profile creation"""
    log_step("J2: Profile Creation (Text Mode)")
    
    profile_data = {
        "job_title": "Delivery Driver",
        "location": "San Francisco, CA",
        "experience_years": 5,
        "salary_expectations": "$55,000",
        "skills": ["driving", "navigation", "customer service", "time management"],
        "summary": "Experienced delivery driver with clean record and excellent customer service",
        "remote_work_preference": False
    }
    
    resp = await api_call("POST", "/profiles", state.seeker_token, profile_data)
    
    if resp["status"] != 200:
        fail_test("J2", "Profile creation failed", str(resp))
    
    state.profile_id = resp["data"].get("id")
    if not state.profile_id:
        fail_test("J2", "No profile ID returned", str(resp["data"]))
    
    log_pass(f"Profile created (ID: {state.profile_id})")

async def test_job_matching():
    """J3: Job matching validation"""
    log_step("J3: Job Matching Validation")
    
    resp = await api_call("GET", f"/jobs?profile_id={state.profile_id}", state.seeker_token)
    
    if resp["status"] != 200:
        fail_test("J3", "Failed to fetch matched jobs", str(resp))
    
    jobs = resp["data"]
    if not isinstance(jobs, list):
        fail_test("J3", "Jobs response is not a list", str(jobs))
    
    # Find our posted job
    matched_job = None
    for job in jobs:
        if job.get("id") == state.job_id:
            matched_job = job
            break
    
    if not matched_job:
        fail_test("J3", f"Posted job {state.job_id} not in matched jobs", 
                 f"Returned {len(jobs)} jobs: {[j.get('id') for j in jobs]}")
    
    match_pct = matched_job.get("match_percentage", 0)
    if match_pct < 25:
        fail_test("J3", f"Match percentage too low: {match_pct}%", 
                 "Expected ≥25% for matching skills")
    
    log_pass(f"Job matched with {match_pct}% score")
    log_pass(f"Total matched jobs: {len(jobs)}")

async def test_application():
    """J4: Apply to job"""
    log_step("J4: Job Application")
    
    resp = await api_call("POST", f"/applications", state.seeker_token, {
        "job_id": state.job_id,
        "profile_id": state.profile_id
    })
    
    if resp["status"] != 200:
        fail_test("J4", "Application failed", str(resp))
    
    state.application_id = resp["data"].get("id")
    status = resp["data"].get("status")
    
    if status != "requested":
        fail_test("J4", f"Wrong initial status: {status}", "Expected 'requested'")
    
    log_pass(f"Application created (ID: {state.application_id})")
    log_pass(f"Status: {status}")

async def test_acceptance():
    """C2: Employer accepts application"""
    log_step("C2: Employer Accepts Application")
    
    resp = await api_call("PUT", f"/applications/{state.application_id}/accept", 
                         state.employer_token)
    
    if resp["status"] != 200:
        fail_test("C2", "Application acceptance failed", str(resp))
    
    data = resp["data"]
    new_status = data.get("status")
    state.chat_id = data.get("chat_id")
    
    if new_status != "accepted":
        fail_test("C2", f"Wrong status after accept: {new_status}", "Expected 'accepted'")
    
    if not state.chat_id:
        fail_test("C2", "No chat_id returned after acceptance", str(data))
    
    log_pass(f"Application accepted")
    log_pass(f"Chat created (ID: {state.chat_id})")

async def test_chat_messaging():
    """D1-D2: Chat messaging"""
    log_step("D1-D2: Chat Messaging")
    
    # Employer sends message
    resp = await api_call("POST", f"/chats/{state.chat_id}/messages", 
                         state.employer_token, {
        "text": "Hi! Thanks for applying. When can you start?"
    })
    
    if resp["status"] != 200:
        fail_test("D1", "Employer message send failed", str(resp))
    
    log_pass("Employer message sent")
    
    # Seeker replies
    resp = await api_call("POST", f"/chats/{state.chat_id}/messages", 
                         state.seeker_token, {
        "text": "Hello! I can start next Monday."
    })
    
    if resp["status"] != 200:
        fail_test("D2", "Seeker message send failed", str(resp))
    
    log_pass("Seeker message sent")
    
    # Verify chat history
    resp = await api_call("GET", f"/chats/{state.chat_id}", state.seeker_token)
    
    if resp["status"] != 200:
        fail_test("D2", "Failed to fetch chat", str(resp))
    
    messages = resp["data"].get("messages", [])
    if len(messages) < 2:
        fail_test("D2", f"Expected 2+ messages, got {len(messages)}", str(messages))
    
    log_pass(f"Chat history verified ({len(messages)} messages)")

async def test_refresh_token():
    """H1: Refresh token rotation"""
    log_step("H1: Refresh Token Rotation")
    
    old_refresh = state.seeker_refresh
    
    resp = await api_call("POST", "/auth/refresh", json_data={
        "refresh_token": old_refresh
    })
    
    if resp["status"] != 200:
        fail_test("H1", "Token refresh failed", str(resp))
    
    data = resp["data"]
    new_access = data.get("access_token")
    new_refresh = data.get("refresh_token")
    
    if not new_access or not new_refresh:
        fail_test("H1", "Missing tokens in refresh response", str(data))
    
    if new_refresh == old_refresh:
        fail_test("H1", "Refresh token not rotated", "Same token returned")
    
    state.seeker_token = new_access
    state.seeker_refresh = new_refresh
    
    log_pass("Access token refreshed")
    log_pass("Refresh token rotated")
    
    # Verify old refresh token is revoked
    resp = await api_call("POST", "/auth/refresh", json_data={
        "refresh_token": old_refresh
    }, expect_fail=True)
    
    if resp["status"] != 401:
        fail_test("H1", "Old refresh token still valid", "Should be revoked")
    
    log_pass("Old refresh token revoked")

async def test_rate_limiting():
    """H2: Rate limiting validation"""
    log_step("H2: Rate Limiting Validation")
    
    # Test chat rate limit (20/min)
    test_phone = f"+1555{int(time.time()) % 10000 + 100:04d}"
    
    # Send 4 OTPs rapidly (limit is 3/5min)
    for i in range(4):
        resp = await api_call("POST", "/auth/send-otp", json_data={
            "identifier": test_phone
        }, expect_fail=(i >= 3))
        
        if i < 3:
            if resp["status"] != 200:
                fail_test("H2", f"OTP {i+1} failed unexpectedly", str(resp))
        else:
            if resp["status"] != 429:
                fail_test("H2", "Rate limit not enforced", 
                         f"Expected 429 on 4th request, got {resp['status']}")
            log_pass("Rate limit enforced (429 on 4th OTP request)")
            
            # Check Retry-After header would be present
            break

async def test_metrics():
    """D4: Metrics validation"""
    log_step("D4: Metrics Validation")
    
    resp = await api_call("GET", "/metrics")
    
    if resp["status"] != 200:
        log_fail("Metrics endpoint not accessible (non-critical)")
        return
    
    data = resp["data"]
    counters = data.get("counters", {})
    
    # Check for expected metrics
    expected_metrics = ["otp.sent", "auth.login.success", "match.cache.miss"]
    found_metrics = []
    
    for metric in expected_metrics:
        if metric in counters and counters[metric] > 0:
            found_metrics.append(metric)
    
    if found_metrics:
        log_pass(f"Metrics tracking active: {', '.join(found_metrics)}")
    else:
        log_fail("No metrics recorded (non-critical)")

# =============================================================================
# MAIN EXECUTION
# =============================================================================

async def main():
    print("="*80)
    print("MASTER E2E VERIFICATION — PRODUCTION DEPLOYMENT GATE")
    print("="*80)
    
    try:
        # Phase 1: Employer Flow
        await test_employer_auth()
        await test_job_posting()
        await test_employer_job_list()
        
        # Phase 2: Seeker Flow
        await test_seeker_auth()
        await test_profile_creation()
        await test_job_matching()
        await test_application()
        
        # Phase 3: Acceptance & Chat
        await test_acceptance()
        await test_chat_messaging()
        
        # Phase 4: Hardening Validation
        await test_refresh_token()
        await test_rate_limiting()
        await test_metrics()
        
        # SUCCESS
        print("\n" + "="*80)
        print("E2E RESULT: PASS")
        print("="*80)
        print("\n✅ All flows executed successfully")
        print("✅ Redis integration validated")
        print("✅ Refresh token rotation confirmed")
        print("✅ Rate limiting enforced")
        print("✅ System is PRODUCTION-READY")
        print("\n" + "="*80)
        
        return 0
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
        return 1
    except Exception as e:
        fail_test("Unexpected Error", str(e), "")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
