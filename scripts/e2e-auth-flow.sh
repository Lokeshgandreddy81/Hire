#!/bin/bash
# End-to-end auth flow test using phone 6300272531
# Prerequisite: Backend running (cd backend && ./start.sh)

set -e
BASE="http://localhost:8000/api/v1"

echo "=== 1. Health check ==="
curl -s "$BASE/../health" | head -1
echo ""

echo "=== 2. Send OTP to 6300272531 ==="
curl -s -X POST "$BASE/auth/send-otp" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"6300272531"}' | head -1
echo ""
echo ">>> Check backend terminal for the 6-digit OTP. <<<"
echo ""
read -p "Enter the OTP you see in backend logs: " OTP

echo "=== 3. Verify OTP (role: candidate) ==="
RESP=$(curl -s -X POST "$BASE/auth/verify-otp" \
  -H "Content-Type: application/json" \
  -d "{\"identifier\":\"6300272531\",\"otp\":\"$OTP\",\"role\":\"candidate\"}")
echo "$RESP"

TOKEN=$(echo "$RESP" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
if [ -n "$TOKEN" ]; then
  echo ""
  echo "=== 4. Test protected route (jobs list) ==="
  curl -s "$BASE/jobs/" -H "Authorization: Bearer $TOKEN" | head -c 200
  echo ""
  echo ""
  echo "Auth flow OK. Token received."
else
  echo "Verify failed or invalid OTP."
  exit 1
fi
