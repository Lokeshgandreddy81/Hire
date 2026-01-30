# FINAL GO-LIVE CHECKLIST — HIRE APP

**Lead rule:** Tick only when verified. No theory. No “almost”.

---

## 1. SYSTEM STABILITY (CRASH-PROOF)

| # | Requirement | Verified |
|---|-------------|----------|
| 1.1 | App launches in Expo Go every time | ☐ |
| 1.2 | No white screen | ☐ |
| 1.3 | No silent crash (ErrorBoundary in place) | ☐ |
| 1.4 | Every async flow has loading state | ☐ |
| 1.5 | Every async flow has error state | ☐ |
| 1.6 | Every async flow has retry or exit (e.g. ProfileProcessing: Retry + Exit) | ☐ |

**Lead decision:** If any user can get stuck → BLOCK RELEASE.

---

## 2. FRONTEND–BACKEND CONTRACT (TRUST)

| # | Requirement | Verified |
|---|-------------|----------|
| 2.1 | Every API call has timeout (10s) | ☐ |
| 2.2 | 401/403 handled (interceptor → clear token, re-login) | ☐ |
| 2.3 | 5xx handled (error state + retry/exit where implemented) | ☐ |
| 2.4 | Token expiry → forced re-login on 401 | ☐ |
| 2.5 | No hardcoded IDs | ☐ |
| 2.6 | No assumptions about data shape (defensive where critical) | ☐ |

**Lead decision:** If frontend trusts backend blindly → BLOCK RELEASE.

---

## 3. AUTHENTICATION & IDENTITY (SECURITY BASELINE)

| # | Requirement | Verified |
|---|-------------|----------|
| 3.1 | SECRET_KEY from env only in production (runtime check) | ☐ |
| 3.2 | OTP flow rate limited | ☐ |
| 3.3 | OTP logged safely — NO PII (no identifier/OTP in logs) | ☐ |
| 3.4 | JWT validated everywhere (protected routes use get_current_user) | ☐ |
| 3.5 | Expired tokens rejected (401) | ☐ |
| 3.6 | WebSocket auth enforced on connect (?token=JWT + room access check) | ☐ |

**Absolute rule:** If auth can be bypassed, the app does not exist.

---

## 4. MATCHING LOGIC (CORE BUSINESS)

| # | Requirement | Verified |
|---|-------------|----------|
| 4.1 | Profile → Interview → Save → Match runs automatically | ☐ |
| 4.2 | IDs type-correct (ObjectId vs string) in matching | ☐ |
| 4.3 | Matching re-runnable (upsert job_matches) | ☐ |
| 4.4 | Empty results handled gracefully (Jobs tab shows empty, no crash) | ☐ |

**Lead decision:** If Jobs tab can be empty due to a bug → BLOCK RELEASE.

---

## 5. REAL-TIME (CHAT)

| # | Requirement | Verified |
|---|-------------|----------|
| 5.1 | WebSocket auth (token in query, room isolation) | ☐ |
| 5.2 | Room isolation (user can only access own chats) | ☐ |
| 5.3 | REST chat used by frontend; WebSocket optional (if used, pass ?token=) | ☐ |

---

## 6. DATABASE & DATA SAFETY

| # | Requirement | Verified |
|---|-------------|----------|
| 6.1 | Single source of configuration (app.core.config) | ☐ |
| 6.2 | Deterministic DB paths (MONGO_URL, DB_NAME) | ☐ |
| 6.3 | No split config (.env.example aligned with config.py) | ☐ |
| 6.4 | No accidental prod/local crossover (ENVIRONMENT=production requires SECRET_KEY) | ☐ |

**Lead rule:** If data location is ambiguous → BLOCK RELEASE.

---

## 7. OBSERVABILITY

| # | Requirement | Verified |
|---|-------------|----------|
| 7.1 | Structured logs (JSON-style events, no PII) | ☐ |
| 7.2 | Request / correlation IDs (X-Request-ID middleware) | ☐ |
| 7.3 | Lifecycle logs: interview_processed, profile_saved, matching_started, matching_completed | ☐ |
| 7.4 | Error logs without PII | ☐ |

**Lead rule:** Blind systems die.

---

## 8. PEAK LOAD & FAILURE THINKING

| # | Requirement | Verified |
|---|-------------|----------|
| 8.1 | Rate limits on OTP | ☐ |
| 8.2 | Background matching: retry-safe (upsert), cancel-safe (task runs once) | ☐ |
| 8.3 | External AI (Gemini): timeout / fallback to rule-based | ☐ |
| 8.4 | UI degrades gracefully (error state + retry/exit) | ☐ |

**Lead mindset:** The system must bend, not break.

---

## 9. SETTINGS & ACCOUNT CONTROL

| # | Requirement | Verified |
|---|-------------|----------|
| 9.1 | Logout everywhere (Settings) | ☐ |
| 9.2 | Token “revocation” via client clear + 401 forces re-login | ☐ |
| 9.3 | Account deletion (DELETE /auth/account) with confirmation in UI | ☐ |
| 9.4 | Session invalidation (logout clears token; 401 clears token) | ☐ |

**Lead rule:** If users can’t control their account → no trust.

---

## 10. END-TO-END FLOW (MUST PASS)

| # | Step | Verified |
|---|------|----------|
| 10.1 | Login (OTP flow) | ☐ |
| 10.2 | Interview (SmartInterview → ProfileProcessing → ProfileReview) | ☐ |
| 10.3 | Match (Jobs tab populates after profile save) | ☐ |
| 10.4 | Apply (JobDetail → Apply Now → Chat created) | ☐ |
| 10.5 | Chat (View Chat, send message via REST) | ☐ |
| 10.6 | Logout / Delete account (optional path) | ☐ |

**Lead rule:** One full re-audit passes with no critical blockers.

---

## WHEN LEAD SAYS “YES, IT’S READY”

- [ ] All security blockers closed  
- [ ] Expo Go runs cleanly  
- [ ] End-to-end flow works: Login → Interview → Match → Apply → Chat  
- [ ] No hardcoded secrets or IDs in production path  
- [ ] Logs prove behavior (lifecycle events, request IDs)  
- [ ] This checklist completed with all critical items ticked  

---

## RELEASE MANAGER SIGN-OFF (OPTIONAL)

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Engineering Lead | | | |
| Release Manager | | | |

---

*This checklist reflects the FINAL LEAD CALL requirements. No features added; only security, frontend resilience, and observability closed.*
