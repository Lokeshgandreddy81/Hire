# ⚡ Quick Start - Get App Running in 2 Minutes

## Step 1: Start Backend (Terminal 1)
```bash
cd backend
./start.sh
```
Wait for: `✅ Connected to MongoDB at mongodb://localhost:27017`

## Step 2: Start Frontend (Terminal 2)
```bash
cd frontend
./start.sh
```

## Step 3: Scan QR Code
- Open **Expo Go** app on your phone
- Scan the QR code from terminal or browser
- App will load!

## ✅ That's it!

**Note:** Make sure MongoDB is running if you see connection errors.

---

## First Time Setup (One-time only)

### Backend:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Frontend:
```bash
cd frontend
npm install
```

After first setup, just use `./start.sh` scripts!
