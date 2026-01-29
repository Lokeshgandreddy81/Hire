# 🚀 HireCircle - Production-Ready Job Matching Application

A complete, production-ready job matching platform with AI-powered profile extraction, intelligent job matching, and real-time chat communication.

## ⚡ Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- MongoDB (running locally or remote)
- Expo Go app on your phone (for testing)

### 1. Backend Setup (First Time)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Frontend Setup (First Time)
```bash
cd frontend
npm install
```

### 3. Start Backend
```bash
cd backend
./start.sh
```
Wait for: `✅ Connected to MongoDB at mongodb://localhost:27017`

### 4. Start Frontend
```bash
cd frontend
./start.sh
```

### 5. Scan QR Code
- Open **Expo Go** app on your phone
- Scan the QR code from terminal or browser
- App will load!

## 📱 Features

- ✅ **OTP Authentication** with rate limiting
- ✅ **Smart Interview** - AI-powered profile extraction
- ✅ **Job Matching Algorithm** - Hard gates + composite scoring
- ✅ **Real-time Chat** - WebSocket-based messaging
- ✅ **Application Tracking** - Track job applications
- ✅ **Profile Management** - Multiple profiles support
- ✅ **Match Percentage** - See how well you match jobs

## 🏗️ Architecture

### Backend (FastAPI + MongoDB)
- FastAPI REST API
- MongoDB for data storage
- WebSocket for real-time chat
- AI extraction with Gemini API fallback
- Rate limiting middleware
- JWT authentication

### Frontend (React Native + Expo)
- React Navigation (Stack + Tabs)
- Expo Go compatible
- Secure token storage
- Real-time updates
- Modern UI/UX

## 📁 Project Structure

```
Hire/
├── backend/
│   ├── app/
│   │   ├── core/          # Config, security
│   │   ├── db/            # MongoDB connection
│   │   ├── middleware/     # Rate limiting
│   │   ├── models/         # Pydantic models
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   └── websocket/      # WebSocket server
│   ├── start.sh            # Backend startup script
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── context/        # Auth context
│   │   ├── screens/        # All app screens
│   │   └── services/       # API client
│   ├── start.sh            # Frontend startup script
│   └── package.json
└── README.md
```

## 🔧 Troubleshooting

### "Too many open files" Error
```bash
brew install watchman
```
See `FIX_FILE_WATCHER.md` for details.

### Backend Connection Issues
- Ensure MongoDB is running
- Check API URL in `frontend/src/services/api.js`
- Verify both devices on same Wi-Fi network

### Expo Go Errors
- Clear cache: `npx expo start --clear`
- Check backend is running
- See `TROUBLESHOOTING.md` for more

## 📚 Documentation

- `QUICK_START.md` - 2-minute setup guide
- `SETUP.md` - Detailed setup instructions
- `TROUBLESHOOTING.md` - Common issues and fixes
- `FIX_FILE_WATCHER.md` - File watcher issues
- `IMPLEMENTATION_SUMMARY.md` - Technical details

## 🔐 Environment Variables

Create `backend/.env`:
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=hire_app_db
SECRET_KEY=your_secret_key_here
GEMINI_API_KEY=your_gemini_key_optional
```

## 🚀 Production Deployment

1. Set environment variables
2. Use production MongoDB
3. Configure CORS properly
4. Set up Redis for caching
5. Use proper secrets management
6. Enable HTTPS

## 📝 API Endpoints

- `POST /api/v1/auth/send-otp` - Send OTP
- `POST /api/v1/auth/verify-otp` - Verify OTP
- `POST /api/v1/profiles/process-interview` - Process interview
- `POST /api/v1/profiles/create` - Create profile
- `GET /api/v1/jobs` - Get matched jobs
- `POST /api/v1/jobs/{id}/apply` - Apply to job
- `GET /api/v1/chats/{id}` - Get chat messages
- `WS /ws/{room_id}` - WebSocket connection

## 🎯 Matching Algorithm

1. **Hard Gates**: License, distance (100km), shift compatibility
2. **Composite Scoring**: Salary (15%), Skills (35%), Experience (30%), Location (10%), Education (10%)
3. **Threshold**: 0.62 (62% match required)
4. **Results**: Top 20 matches, sorted by score

## 📄 License

Private project - All rights reserved

## 👥 Contributors

Built with ❤️ for efficient job matching

---

**Status**: ✅ Production-ready | **Version**: 1.0.0
