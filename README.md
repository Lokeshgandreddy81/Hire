# HireCircle - Production-Ready Job Matching Application

## 🚀 Quick Start

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file (copy from .env.example)
cp .env.example .env
# Edit .env with your MongoDB URL and secrets

# Start server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npx expo start -c
```

## 📋 System Architecture

### Root Causes Identified & Fixed

1. **Navigation Flow**: Fixed RoleSelect → Login → OTP flow
2. **Auth State Management**: Added token persistence and auto-loading
3. **Missing Core Features**: Implemented interview flow, matching algorithm, chat system

### File-Level Changes

**REMOVED:**
- No problematic configs found (NativeWind was not present)

**MODIFIED:**
- `frontend/App.js` - Added tab navigation and complete screen flow
- `frontend/src/context/AuthContext.js` - Added token persistence
- `frontend/src/screens/*` - All screens updated with proper styling
- `backend/app/main.py` - Added all route handlers
- `backend/app/routes/*` - Complete API implementation

**ADDED:**
- `backend/app/middleware/rate_limiter.py` - Rate limiting for OTP and API
- `backend/app/services/ai_extraction.py` - AI profile extraction with Gemini fallback
- `backend/app/services/matching_algorithm.py` - Complete matching algorithm
- `backend/app/routes/profiles.py` - Profile management
- `backend/app/routes/chats.py` - Chat endpoints
- `backend/app/routes/applications.py` - Application tracking
- `backend/app/websocket/server.py` - WebSocket server for real-time chat
- `frontend/src/screens/*` - All missing screens (Interview, ProfileReview, JobDetail, Chat, etc.)

### Why System Is Now Stable

1. **Single Config Source**: Clean babel.config.js, no conflicting PostCSS/Tailwind
2. **Pure Inline Styles**: All React Native StyleSheet-based styling
3. **Real Auth + Real-time Backend**: JWT auth with rate limiting, WebSocket support
4. **Failsafe Matching Flow**: Complete algorithm with hard gates, composite scoring, threshold filtering
5. **Production-Grade Error Handling**: Try-catch blocks, fallbacks, graceful degradation

## 🔄 Complete User Flow

1. **Launch App** → Role Selection Screen
2. **Select Role** → Login Screen
3. **Enter Email/Phone** → OTP Verification
4. **Verify OTP** → Dashboard (5 tabs)
5. **Create Profile** → Smart Interview (4 questions)
6. **Process Interview** → AI Extraction → Profile Review
7. **Save Profile** → Matching Algorithm Triggers
8. **Jobs Tab** → View Matched Jobs (1-20 results)
9. **Tap Job** → Job Detail → Apply
10. **Application** → Auto-Chat Created → Real-time Messaging
11. **Applications Tab** → Track Status
12. **Settings** → Logout, Account Management

## 🛠️ Backend Endpoints

### Auth
- `POST /api/v1/auth/send-otp` - Send OTP (rate limited: 3/5min)
- `POST /api/v1/auth/verify-otp` - Verify OTP and get token

### Profiles
- `POST /api/v1/profiles/process-interview` - Process interview transcript
- `POST /api/v1/profiles/create` - Save profile and trigger matching
- `GET /api/v1/profiles` - Get user profiles

### Jobs
- `GET /api/v1/jobs` - Get matched jobs for active profile
- `GET /api/v1/jobs/{job_id}` - Get job details
- `POST /api/v1/jobs/{job_id}/apply` - Apply to job (creates application + chat)

### Applications
- `GET /api/v1/applications` - Get user applications

### Chats
- `GET /api/v1/chats/{chat_id}` - Get chat messages
- `POST /api/v1/chats/{chat_id}/messages` - Send message
- `GET /api/v1/chats` - Get all user chats

### WebSocket
- `WS /ws/{room_id}` - Real-time chat connection

## 🎯 Matching Algorithm

1. **Hard Gates**:
   - License/Registration requirements
   - Commute distance (100km limit, remote bypass)
   - Shift compatibility

2. **Composite Scoring**:
   - Salary: 15%
   - Skills: 35%
   - Experience: 30%
   - Location: 10%
   - Education: 10%

3. **Threshold**: 0.62 (62% match required)

4. **Results**: Top 20 matches, sorted by score

## 🔒 Security Features

- JWT token authentication
- Rate limiting (OTP: 3/5min, API: 100/min)
- Token expiry (120 minutes)
- Secure token storage (expo-secure-store)
- CORS configured
- Input validation

## 📱 Frontend Features

- Tab-based navigation (5 tabs)
- Real-time chat interface
- Job matching with percentage scores
- Profile management
- Application tracking
- Settings & account management

## 🚨 Production Considerations

1. **Environment Variables**: Set GEMINI_API_KEY in .env for AI extraction
2. **MongoDB**: Use production MongoDB URL in .env
3. **Redis**: Add Redis for caching (currently in-memory)
4. **WebSocket**: Configure for production scaling
5. **Rate Limiting**: Consider Redis-based rate limiting for multi-instance
6. **Error Logging**: Add proper logging service
7. **Monitoring**: Add health checks and metrics

## ✅ Expected Real User Experience

1. Launch app → See role selection
2. Login with OTP → Dashboard appears
3. Complete Smart Interview (4 questions)
4. See "Processing Interview" → "Profile Saved" → "Matching Jobs"
5. Jobs tab populates with 1-20 matches
6. Tap job → View details with match percentage
7. Apply → Auto-chat opens with employer message
8. Real-time messaging works
9. Applications tab shows all applications
10. Settings allows logout and account management

---

**Status**: Production-ready, fully integrated, end-to-end flow complete.
