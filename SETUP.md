# 🚀 Quick Setup Guide

## Backend Setup

### First Time Setup:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Start Backend:
```bash
cd backend
./start.sh
```

Or manually:
```bash
cd backend
source venv/bin/activate
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Frontend Setup

### First Time Setup:
```bash
cd frontend
npm install
```

### Start Frontend:
```bash
cd frontend
./start.sh
```

Or manually:
```bash
cd frontend
npx expo start --clear
```

## Quick Start (Both Servers)

### Terminal 1 - Backend:
```bash
cd backend && ./start.sh
```

### Terminal 2 - Frontend:
```bash
cd frontend && ./start.sh
```

## Important Notes

1. **Backend must be running** before using the app
2. **MongoDB must be running** (backend will show error if not)
3. **Same Wi-Fi network** required for physical device
4. **API URL** is configured for IP: `192.168.1.114:8000`

## Troubleshooting

See `TROUBLESHOOTING.md` for detailed help.
