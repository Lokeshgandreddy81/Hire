# End-to-end app flow checklist

Use phone **6300272531** for OTP. You’ll get the OTP in the **backend terminal** (it’s printed there; no SMS in this setup).

---

## Task 1: Push to GitHub

Run in your terminal (from project root):

```bash
cd /Users/chshesheer/Desktop/Hireapp/Hire
git push origin main
```

---

## Task 2: Full app flow (tabs + API)

### A. Start backend and frontend

**Terminal 1 – Backend**
```bash
cd backend
./start.sh
```
Wait for: `✅ Connected to MongoDB` and `✅ OTP cleanup task started`.

**Terminal 2 – Frontend**
```bash
cd frontend
npx expo start --clear
```
Open the app in Expo Go (scan QR or simulator).

---

### B. In-app flow (check each step)

| Step | Screen | What to do | Expected |
|------|--------|------------|----------|
| 1 | **RoleSelect** | App opens | See “HireCircle”, “Job Seeker” / “Employer”. |
| 2 | **Login** | Tap “Job Seeker” | See “Email or Phone” field. |
| 3 | **Login** | Enter `6300272531`, tap “Get OTP” | Success; navigate to OTP screen. |
| 4 | **Backend terminal** | Look at logs | Line like: `📧 OTP for 6300272531: 123456` |
| 5 | **OTPVerify** | Enter the 6-digit OTP, tap “Verify” | Login success; go to Dashboard. |
| 6 | **Dashboard** | — | 5 tabs: Applications, Jobs, Profiles, Connect, Settings. |
| 7 | **Profiles** | Tap “Create Profile” | Smart Interview screen. |
| 8 | **Smart Interview** | Answer 4 questions, complete | Processing screen, then Profile Review. |
| 9 | **Profile Review** | Tap “Save Profile” | “Profile Created! Matching now…” then back to Dashboard. |
| 10 | **Jobs** | Open Jobs tab | “Finding matches…” then job list (or empty). |
| 11 | **Jobs** | Pull down to refresh | No crash; list refreshes. |
| 12 | **Job detail** | Tap a job (if any) | Job detail screen. |
| 13 | **Apply** | Tap “Apply Now” | Application created; chat created. |
| 14 | **Applications** | Open Applications tab | See your application; “View Chat”. |
| 15 | **Chat** | Tap “View Chat” | Chat screen; send a message. |
| 16 | **Settings** | Open Settings | See Logout. |
| 17 | **Logout** | Tap Logout | Back to RoleSelect. |

---

### C. API-only test (OTP with 6300272531)

Backend must be running. From project root:

```bash
bash scripts/e2e-auth-flow.sh
# Or: chmod +x scripts/e2e-auth-flow.sh && ./scripts/e2e-auth-flow.sh
```

- Script sends OTP to **6300272531**.
- Check **backend terminal** for the 6-digit OTP.
- When the script asks, **enter that OTP**.
- Script verifies and calls a protected endpoint; you should see “Auth flow OK.”

---

### D. Manual curl (if you prefer)

**1. Send OTP**
```bash
curl -X POST http://localhost:8000/api/v1/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"identifier":"6300272531"}'
```
Get the OTP from backend logs.

**2. Verify OTP** (replace `YOUR_OTP` with the code you see)
```bash
curl -X POST http://localhost:8000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"identifier":"6300272531","otp":"YOUR_OTP","role":"candidate"}'
```
You should get `access_token` in the response.

---

## OTP for 6300272531

- OTP is **not** sent by SMS in this project; it’s only printed in the **backend terminal**.
- When the agent (or script) asks for the OTP, copy the 6 digits from that backend log line and provide them.
