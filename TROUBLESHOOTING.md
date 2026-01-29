# 🔧 Troubleshooting Expo Go Error

## Issue: "Something went wrong" in Expo Go

### Quick Fix Steps:

1. **Start the Backend Server** (REQUIRED):
   ```bash
   cd backend
   python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```
   You should see: `✅ Connected to MongoDB at mongodb://localhost:27017`

2. **Verify Backend is Running**:
   - Open browser: `http://192.168.1.114:8000/`
   - Should show: `{"status":"ok","message":"Hire App Backend Running"}`

3. **Check API URL in App**:
   - File: `frontend/src/services/api.js`
   - For Android physical device: `http://192.168.1.114:8000/api/v1`
   - For Android emulator: Change to `http://10.0.2.2:8000/api/v1`
   - Make sure your phone and computer are on the **same Wi-Fi network**

4. **Restart Expo**:
   ```bash
   cd frontend
   npx expo start --clear
   ```

5. **In Expo Go App**:
   - Tap "Reload" button (circular arrow icon)
   - Or shake device → "Reload"

### Common Issues:

**Issue 1: Backend not running**
- **Symptom**: Network error, connection refused
- **Fix**: Start backend server (step 1 above)

**Issue 2: Wrong IP address**
- **Symptom**: Can't connect to backend
- **Fix**: 
  - For physical device: Use your computer's IP (192.168.1.114)
  - For emulator: Use 10.0.2.2
  - Update `frontend/src/services/api.js`

**Issue 3: Different Wi-Fi networks**
- **Symptom**: Connection timeout
- **Fix**: Ensure phone and computer are on same Wi-Fi

**Issue 4: MongoDB not running**
- **Symptom**: Backend crashes on startup
- **Fix**: Start MongoDB:
  ```bash
  # macOS with Homebrew
  brew services start mongodb-community
  
  # Or run manually
  mongod
  ```

### Testing Backend:

```bash
# Test backend health
curl http://192.168.1.114:8000/

# Test OTP endpoint
curl -X POST http://192.168.1.114:8000/api/v1/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"identifier":"test@example.com"}'
```

### View Error Logs:

In Expo Go app, tap "View error log" to see detailed error messages.

### Still Not Working?

1. Check Expo terminal for error messages
2. Check backend terminal for error messages
3. Verify MongoDB is running
4. Check firewall isn't blocking port 8000
5. Try restarting both backend and Expo
