# Hire App - Clean Architecture

## Tech Stack
- **Frontend**: React Native (Expo) - JavaScript
- **Backend**: Python (FastAPI) - MongoDB
- **Database**: MongoDB (Local)

## Folder Structure
- `/frontend`: React Native App
- `/backend`: FastAPI Server

## Quick Start

### 1. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
*Note: The backend runs on 0.0.0.0 to be accessible by Expo Go on your phone/emulator.*

### 2. Frontend Setup
```bash
cd frontend
npm install
npx expo start --clear
```

### 3. Usage
- Open app
- Enter email (e.g. `test@example.com`)
- Check Backend Console for the OTP code (Simulation Mode)
- Enter OTP
- Select Role -> Browse Jobs

## Key Features
- **Real Auth Flow**: OTP -> JWT -> Secure Store
- **Clean Architecture**: Separation of concerns
- **No TypeScript**: Pure JS as requested
