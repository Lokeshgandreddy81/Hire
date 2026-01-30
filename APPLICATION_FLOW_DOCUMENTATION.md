# Application Flow Documentation (Verified)

This document reflects the **actual** end-to-end flow as implemented in the codebase. Verified against `App.js` and all screens in `frontend/src/screens/`.

---

## 1. Authentication & Onboarding Flow

**Shared by both Candidate and Employer.** There is no separate "Register" screen; sign-up happens via Login → OTP Verify.

| Step | Screen | Registered in App.js | Notes |
|------|--------|------------------------|-------|
| 1 | App Launch | — | ErrorBoundary → AuthProvider → NavigationContainer |
| 2 | Role Selection | ✅ `RoleSelect` | "Job Seeker" or "Employer"; passes `role` to Login |
| 3 | Login | ✅ `Login` | Email or phone; calls `POST /auth/send-otp` |
| 4 | OTP Verify | ✅ `OTPVerify` | Verification step (no separate "Verification Required" screen); calls `POST /auth/verify-otp` |
| 5 | Save token | — | AuthContext stores token; SecureStore persists it |
| 6 | Main Tab Navigator | ✅ `Dashboard` | Same tabs for both roles (see below) |

**Flow:** `RoleSelect` → `Login` → `OTPVerify` → (on success) `Dashboard` (tabs).

---

## 2. Main Tab Navigator (Post-Login)

**One set of tabs for both Candidate and Employer.** There is no separate "Employer Dashboard" or role-specific tab set.

| Tab | Screen | Registered | Purpose |
|-----|--------|------------|---------|
| Applications | `ApplicationsScreen` | ✅ | List applications; "View Chat" → Chat |
| Jobs | `JobsScreen` | ✅ | Job list; tap job → JobDetail |
| Profiles | `ProfilesScreen` | ✅ | User profiles; "+ New Profile" → SmartInterview |
| Connect | `ConnectScreen` | ✅ | Placeholder / "Coming Soon" |
| Settings | `SettingsScreen` | ✅ | Logout, etc. |

All are registered in `App.js` under `DashboardTabs`.

---

## 3. Candidate (Job Seeker) Flow — Implemented

| From | Trigger | To | Registered | Status |
|------|---------|-----|------------|--------|
| Jobs | Tap job card | JobDetail | ✅ | Working |
| JobDetail | "Apply Now" | API `POST /jobs/:id/apply` | — | Working |
| JobDetail | After apply → "View Chat" in alert | Chat | ✅ | Working |
| Applications | "View Chat" (when `chat_id` exists) | Chat | ✅ | Working |
| Profiles | "+ New Profile" / "Create Profile" | SmartInterview | ✅ | Working |
| SmartInterview | Complete interview | ProfileProcessing | ✅ | Working |
| ProfileProcessing | — | ProfileReview | ✅ | Working |
| ProfileReview | "Save Profile" | Back to Dashboard | — | Working |

**No Video Record step:** Apply is a single tap ("Apply Now"); no pitch/video screen in the app.

---

## 4. Employer Workflow — Partially Implemented / Not Present

The following are **not** in the current codebase:

| Screen / Flow | In codebase? | Notes |
|---------------|--------------|-------|
| Employer Dashboard (separate from main tabs) | ❌ | Same tabs for all users |
| Video Record Screen | ❌ | No `VideoRecord` screen or route |
| Post Job Screen | ❌ | No `PostJob` screen or route |
| FAB on dashboard to post job | ❌ | No such FAB |
| Job Details (employer view matches) | ❌ | No employer-specific Job Details; JobDetail is candidate apply flow |
| Candidate Profile (employer view) | ❌ | Profiles screen is "My Profiles" (own profiles), not candidate list |

**What exists for employer:** Same login and same tabs. Employer can use Connect, Settings, and theoretically Jobs/Applications/Profiles, but there is no employer-specific "My Jobs", "Post Job", or "View Candidates" flow implemented.

---

## 5. Gap Analysis (Corrected)

| From Screen | Trigger | Target Screen | Status | Notes |
|-------------|--------|--------------|--------|-------|
| RoleSelect | Tap Job Seeker / Employer | Login | ✅ Working | |
| Login | Get OTP success | OTPVerify | ✅ Working | |
| OTPVerify | Verify success | Dashboard (tabs) | ✅ Working | |
| Dashboard | Tab press | Applications / Jobs / Profiles / Connect / Settings | ✅ Working | Same for both roles |
| Jobs | Tap job | JobDetail | ✅ Working | |
| JobDetail | "Apply Now" → then "View Chat" | Chat | ✅ Working | Route registered; navigation used after API success |
| Applications | "View Chat" | Chat | ✅ Working | `navigation.navigate('Chat', { chatId })` |
| Profiles | "+ New Profile" | SmartInterview | ✅ Working | |
| SmartInterview | Finish | ProfileProcessing | ✅ Working | |
| ProfileProcessing | — | ProfileReview | ✅ Working | |
| ProfileReview | Save Profile | Dashboard | ✅ Working | |
| EmployerDashboard | FAB → VideoRecord | — | ❌ N/A | No EmployerDashboard / VideoRecord in app |
| VideoRecord | Next / Save | PostJob | ❌ N/A | Screens do not exist |
| MainTab (employer) | Tab → Employer Dashboard | — | ❌ N/A | No separate employer tabs |

---

## 6. Summary

- **Auth:** RoleSelect → Login → OTPVerify → Dashboard. No separate Register or "Verification Required" screen; OTPVerify is the verification step.
- **Tabs:** One shared tab bar (Applications, Jobs, Profiles, Connect, Settings) for both roles.
- **Candidate flow:** Jobs → JobDetail → Apply Now → Chat; Applications → View Chat → Chat; Profiles → SmartInterview → ProfileProcessing → ProfileReview → Save. All these routes are registered and used.
- **Employer flow:** No dedicated employer dashboard, post job, or video record flow in the app; those items in the original doc refer to unimplemented/planned features.
- **JobDetails → Chat:** Implemented and working (via "Apply Now" then "View Chat" in the alert), not broken.

If you add Employer Dashboard, VideoRecord, or PostJob later, register them in `App.js` and update this document.
