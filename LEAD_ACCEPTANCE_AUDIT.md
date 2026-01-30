# 🧭 LEAD ACCEPTANCE AUDIT — HIRE APP

**Verdict:** App is **NOT** done. Concrete gaps below. No assumptions.

**Fix applied in code:** Matching bug (profile_id string vs ObjectId) fixed in `matching_algorithm.py` — profile lookup now uses `ObjectId(profile_id)`. Remaining blockers (security, observability, WebSocket auth, frontend retry/401) still must be addressed before sign-off.

---

## 1️⃣ BACKEND – IS IT ACTUALLY CORRECT?

### 1. Startup & Stability

| Question | Answer |
|----------|--------|
| Does backend start cleanly with one command? | **Yes.** `./start.sh` (or `source venv/bin/activate && python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000`). Requires MongoDB running and venv. |
| Any warnings ignored? | **Yes.** OTP printed to stdout: `print(f"\n📧 OTP for {identifier}: {otp}\n")`. Mongo URL printed on connect. No structured logging. |
| Can it restart without corrupting state? | **Yes.** No in-memory state that must survive restart except OTP store (in-memory); OTPs are ephemeral. DB is source of truth. |

### 2. Single Source of Configuration

| Question | Answer |
|----------|--------|
| Is there exactly one settings/config system? | **Yes.** `app.core.config.Settings` (pydantic_settings), single `settings` instance. |
| Does main.py, DB, background jobs all read from the same config? | **Yes.** All use `from app.core.config import settings` (main, mongo, security, routes). OTP service has no DB; rate limiter is in-memory. |
| If I change DATABASE_URL, does everything follow? | **No.** App uses **MONGO_URL** and **DB_NAME**, not DATABASE_URL. Changing DATABASE_URL has no effect. **Correct question:** change MONGO_URL → yes, everything that touches DB follows. |

### 3. Database Integrity

| Question | Answer |
|----------|--------|
| What DB is used in Local dev / Staging / Production? | **MongoDB only.** Same driver (Motor) everywhere. No separate staging/production DB config in code; only MONGO_URL + DB_NAME (e.g. from .env). |
| Are migrations reproducible from scratch? | **No.** There is **no migration system** (no Alembic, no MongoDB migrations). Collections are created on first write. Schema is implicit in code. |
| Can I delete DB and rebuild without errors? | **Yes.** Drop DB; restart app; first requests create collections. No migration to run. |

### 4. API Contracts

| Question | Answer |
|----------|--------|
| Are request/response shapes consistent? | **Mostly.** Pydantic models for auth (OTPRequest, OTPVerify, Token). Jobs/profiles/chats use dicts; some endpoints return different shapes (e.g. applications returns list, profiles returns `{"profiles": [...]}`). |
| Are error responses structured? | **Partially.** FastAPI/HTTPException return `{"detail": "string"}`. Some routes return raw exception message (`detail=str(e)`). No shared error schema (code, type, trace_id). |
| Are HTTP status codes meaningful? | **Yes.** 400 invalid ID, 401 invalid OTP/credentials, 404 not found, 429 rate limit, 500 server error. |

### 5. Auth Enforcement

| Question | Answer |
|----------|--------|
| Which endpoints are public? | **Only:** `POST /api/v1/auth/send-otp`, `POST /api/v1/auth/verify-otp`. Plus `GET /`, `GET /health` (no auth). |
| Which endpoints are protected? | **All other API routes:** jobs (get list, get detail, apply), profiles (process-interview, create, get list), chats (get, send message, list), applications (get list). All use `Depends(get_current_user)`. |
| Can any user access another user's data? | **No.** Chats filtered by `user_id` (get_chat, send_message, get_user_chats). Applications and profiles filtered by `current_user.get("id")`. Jobs list returns only matches for current user's profile. Job detail is by job_id (jobs are not per-user; apply is per-user). |
| Is there any auth bypass? | **Yes.** **WebSocket `/ws/{room_id}` has no auth.** Any client can connect to any room_id and send/receive messages. REST chat is protected; WebSocket is not. |

---

## 2️⃣ FRONTEND – DOES IT SURVIVE REALITY?

### 1. Cold Start Reality

| Question | Answer |
|----------|--------|
| Does the app open on low-end Android / poor network / first install (no cache)? | **Not verified by code.** Token load has 3s timeout (Promise.race) so no infinite loading; first screen can show after timeout. No device/network-specific tests in repo. |
| Any white screen ever? | **Mitigated.** ErrorBoundary wraps app; uncaught errors show "Something went wrong" + Try Again. If SecureStore or navigation fails before first paint, white screen still possible. |

### 2. Boot Path

| Question | Answer |
|----------|--------|
| What runs before first screen? | AuthProvider mounts → `loadToken()` (SecureStore.getItemAsync) with 3s timeout → then AppStack renders. If token exists, setAuthToken(token). |
| Any async code blocking render? | **Yes.** `isLoading` is true until loadToken() settles; AppStack shows loading spinner until then. First meaningful screen (RoleSelect or Dashboard) is after async. |
| Any dependency that can crash silently? | **Possible.** SecureStore, axios, navigation. ErrorBoundary catches render errors; API failures surface as Alert or console. No global unhandled rejection handler. |

### 3. Network Failure Handling

| Question | Answer |
|----------|--------|
| Backend down → what does user see? | **Per-call.** Login: Alert "Could not send OTP" (from catch). Other screens: failed requests reject; many show no error UI (e.g. Jobs list just empty, ProfileProcessing "Something went wrong" with no retry). |
| Timeout → spinner forever or error? | **Timeout 10s** (axios). After timeout, promise rejects. ProfileProcessing stays on "Something went wrong" with **no retry button**. Spinner forever in practice if user doesn't leave. |
| Retry → possible or not? | **Not in UI.** No retry on ProfileProcessing, Login, or OTP verify. User must navigate back or restart. |

### 4. State Safety

| Question | Answer |
|----------|--------|
| If app is backgrounded during interview → data safe? | **No.** Interview responses and transcript live only in SmartInterview state. Background/kill loses them. No persistence of partial interview. |
| If killed mid-flow → recoverable? | **No.** No draft save. User must redo interview. |
| If token expires → graceful re-auth? | **No.** No 401 interceptor. API returns 401; caller gets error. No automatic redirect to login or token refresh. User may see generic error until they logout and log in again. |

---

## 3️⃣ INTERVIEW → PROFILE → MATCHING (THE CORE)

### 1. Interview

| Question | Answer |
|----------|--------|
| Is interview completion atomic? | **No.** Transcript is passed via navigation params to ProfileProcessing → API. If API fails after navigation, user is on Processing screen with error; no atomic "interview + profile" transaction. |
| Partial interview → saved or discarded? | **Discarded.** No save of partial responses. Leaving mid-interview loses all. |
| Multi-language input → supported or blocked clearly? | **Not defined.** Extraction (Gemini or rule-based) is English-oriented. No explicit "language not supported" or validation. |

### 2. Profile Creation

| Question | Answer |
|----------|--------|
| Is profile versioned? | **No.** No version field. New profile = new document. No overwrite of same "profile slot"; multiple profiles per user are separate docs. |
| Can bad data overwrite good data? | **No overwrite.** Create is insert only. Bad data would be a bad insert (no edit flow in audit). |
| Is profile validated before matching? | **Partial.** Pydantic ProfileCreate on create. Matching reads from DB; no extra validation step before trigger_matching_algorithm. |

### 3. Matching Trigger

| Question | Answer |
|----------|--------|
| What exactly triggers matching? | **POST /profiles/create** (create_profile). On success, `asyncio.create_task(trigger_matching_algorithm(user_id, profile_id))`. |
| Can it trigger twice? | **Yes.** Double-tap Save or two create requests → two tasks. No idempotency key. Both run and both write to job_matches (last write wins for that user_id+profile_id). |
| Can two concurrent requests cause double matching? | **Yes.** Same as above; concurrent creates → concurrent tasks. |

### 4. Matching Output

| Question | Answer |
|----------|--------|
| Is match % explainable? | **Partially.** Score = composite (salary 15%, skills 35%, experience 30%, location 10%, education 10%). No per-job explanation returned to client. |
| Is threshold deterministic? | **Yes.** Hardcoded 0.62 in matching_algorithm. |
| Same input always same result? | **Yes.** Algorithm is deterministic. **But:** **Critical bug (FIXED in code):** `match_jobs_for_profile` previously used `find_one({"_id": profile_id})` with `profile_id` as string; MongoDB `_id` is ObjectId, so profile was never found and matching returned []. **Fix applied:** profile lookup now uses `ObjectId(profile_id)` with InvalidId handling. Jobs tab should now populate after profile create. |

---

## 4️⃣ REAL-TIME FEATURES (IF PRESENT)

### Chat

| Question | Answer |
|----------|--------|
| Is chat authenticated? | **REST:** Yes (Bearer, user_id filter). **WebSocket:** **No.** `/ws/{room_id}` accepts anyone; no token, no user check. |
| Can users join rooms they shouldn't? | **Yes.** Any client can connect to any room_id and read/send. |
| Do messages persist? | **REST:** Yes (MongoDB chats). **WebSocket:** In-memory broadcast only; not persisted in websocket path. |
| Reconnect works? | **REST:** N/A. **WebSocket:** Client can reconnect to same room_id; no auth so "works" but insecure. |

### Calls

| Question | Answer |
|----------|--------|
| Calls (if any) | **None.** No voice/video call feature in codebase. |

---

## 5️⃣ PERFORMANCE & PEAK LOAD

| Question | Answer |
|----------|--------|
| What happens at 10k users online? | **Not designed for.** Single process, in-memory OTP store and rate limiter. No horizontal scaling, no Redis. Would need redesign. |
| OTP spam → blocked or backend dies? | **Blocked.** Rate limit: 3 OTP requests per 5 min per identifier, then 15 min block. So backend does not "die" from OTP spam for same identifier. |
| Matching spike → queued or crashes? | **Not queued.** Each profile create fires async task. Many creates = many concurrent tasks; all hit DB. No queue, no backpressure. Could overload DB. |
| External API down → app freezes or degrades? | **Degrades.** Gemini failure in extraction falls back to rule-based. No circuit breaker; no "degraded" flag to user. |

---

## 6️⃣ SECURITY CHECK (NON-NEGOTIABLE)

| Check | Status |
|-------|--------|
| No secrets in code | **FAIL.** `config.py`: `SECRET_KEY: str = "YOUR_SUPER_SECRET_KEY_CHANGE_ME_IN_PROD_998877"`. If .env does not set SECRET_KEY, this is used. **One leak = NO SHIP.** |
| No hardcoded IDs | **OK.** No hardcoded user/job IDs in routes. |
| Tokens expire | **OK.** ACCESS_TOKEN_EXPIRE_MINUTES = 120; JWT exp set in create_access_token. |
| Sessions revocable | **No.** No token blacklist or revoke endpoint. Logout only clears client token; server does not invalidate. |
| Account deletion works | **No.** No account deletion or data-deletion endpoint. |
| Logs don't leak PII | **FAIL.** OTP log: `print(f"\n📧 OTP for {identifier}: {otp}\n")` — identifier (email/phone) and OTP in stdout. **One leak = NO SHIP.** |

---

## 7️⃣ OBSERVABILITY & OPERATIONS

| Question | Answer |
|----------|--------|
| How do we know the app is broken? | **Only** `GET /health` (DB ping). No metrics, no alerts, no uptime check. |
| What metrics exist? | **None.** No Prometheus, no request counts, no latency percentiles. |
| What logs exist? | **Print statements only:** connect, OTP, cleanup, errors in matching. No levels, no request IDs, no structured logging. |
| How fast can we rollback? | **Deploy/process rollback only.** No feature flags. Rollback = redeploy previous version. |

**"No monitoring yet" = NOT done.**

---

## 8️⃣ FINAL ACCEPTANCE QUESTION

**Can a real user: install → sign up → interview → get matched → apply → chat, without help, without retrying, without refreshing, without guessing?**

| Step | Blockers |
|------|-----------|
| Install | — |
| Sign up | OTP in logs only (no SMS); user must have backend log access or use script. For "real" user without log access, sign up is broken. |
| Interview | Works if backend up. Partial interview lost if app killed. |
| Get matched | **Broken.** Matching uses string profile_id vs ObjectId in DB; profile not found → matches always []. Jobs tab stays empty. |
| Apply | Can only apply if there are jobs (e.g. seeded). With empty matches, user has nothing to apply to. |
| Chat | Works after apply (REST). WebSocket is unauthenticated. |

**Answer: NO.** Matching bug is fixed in code; remaining blockers: SECRET_KEY default and PII in logs = NO SHIP. Plus WebSocket auth, observability, and frontend retry/401 handling.

---

## 🟥 LEAD VERDICT

| Criterion | Result |
|-----------|--------|
| Every section has clear, factual answers | **Yes.** |
| No "should", "probably", "later" | **Yes.** |
| App is done | **NO.** |

**Blockers before sign-off:**

1. **Critical (DONE):** Fix matching: use `ObjectId(profile_id)` in `match_jobs_for_profile` — **fixed in matching_algorithm.py**.
2. **Security:** Remove default SECRET_KEY; require SECRET_KEY from env in production. Stop logging OTP and identifier (or use secure logging with redaction).
3. **WebSocket:** Add auth to `/ws/{room_id}` (e.g. token in query or first message) and validate user can access room.
4. **Observability:** Add structured logging and at least health + readiness; define "how we know the app is broken" and one rollback path.
5. **Frontend:** Add retry on ProfileProcessing (and similar) on failure; add 401 handling (e.g. redirect to login or clear token).
6. **Optional but recommended:** Account deletion or data export; session revocation (blacklist or short-lived tokens); no double matching (idempotency or guard).

---

**Next steps (pick one):**

- Turn this into a formal acceptance sign-off (with checklist and owner).
- Convert into a QA test matrix (steps, expected result, pass/fail).
- Fix the critical matching bug and security items above, then re-audit.
