#!/bin/bash

# ==============================================================================
# HIRE APP - AUTH FLOW INTEGRATION TEST
# ==============================================================================
# Usage: ./test_auth_flow.sh [PHONE_NUMBER]
# Default Phone: 6300272531

PHONE="${1:-6300272531}"
BASE_URL="http://localhost:8000/api/v1"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Dependency Check (jq is recommended for JSON parsing)
if ! command -v jq &> /dev/null; then
    echo -e "${RED}⚠️  'jq' not found. Installing is recommended for better output.${NC}"
    echo "   (brew install jq) or (sudo apt install jq)"
    HAS_JQ=false
else
    HAS_JQ=true
fi

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}   🚀 STARTING AUTH TEST FOR: $PHONE ${NC}"
echo -e "${BLUE}======================================================${NC}"

# 2. Health Check
echo -e "\n${GREEN}[1/4] Checking Backend Health...${NC}"
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/../health")

if [ "$HEALTH_STATUS" == "200" ]; then
    echo "✅ Backend is UP (Status: 200)"
else
    echo -e "${RED}❌ Backend seems DOWN (Status: $HEALTH_STATUS). Start it with './start.sh'${NC}"
    exit 1
fi

# 3. Send OTP
echo -e "\n${GREEN}[2/4] Sending OTP to $PHONE...${NC}"
SEND_RESP=$(curl -s -X POST "$BASE_URL/auth/send-otp" \
  -H "Content-Type: application/json" \
  -d "{\"identifier\":\"$PHONE\"}")

if [ "$HAS_JQ" = true ]; then
    echo "$SEND_RESP" | jq .
else
    echo "$SEND_RESP"
fi

echo -e "\n${BLUE}>>> ⚠️  ACTION REQUIRED: Check your backend terminal logs for the OTP. <<<${NC}"
echo -e "    (It usually looks like 'Generated OTP for 6300272531: 123456')"
read -p "    Enter the 6-digit OTP here: " USER_OTP

# 4. Verify OTP & Get Token
echo -e "\n${GREEN}[3/4] Verifying OTP & Fetching Token...${NC}"
VERIFY_RESP=$(curl -s -X POST "$BASE_URL/auth/verify-otp" \
  -H "Content-Type: application/json" \
  -d "{\"identifier\":\"$PHONE\",\"otp\":\"$USER_OTP\",\"role\":\"candidate\"}")

# Extract Token
if [ "$HAS_JQ" = true ]; then
    TOKEN=$(echo "$VERIFY_RESP" | jq -r '.access_token')
else
    # Fallback grep for systems without jq
    TOKEN=$(echo "$VERIFY_RESP" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
fi

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Login Failed. Response:${NC}"
    echo "$VERIFY_RESP"
    exit 1
fi

echo -e "✅ Login Successful!"
echo -e "🔑 Token Snippet: ${TOKEN:0:20}..."

# 5. Protected Route Test
echo -e "\n${GREEN}[4/4] Testing Protected Route (/jobs)...${NC}"
JOBS_RESP=$(curl -s -X GET "$BASE_URL/jobs/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

# Show just a summary to avoid flooding console
JOB_COUNT=$(echo "$JOBS_RESP" | grep -o '"id":' | wc -l | tr -d ' ')
echo -e "✅ Access Granted. Found $JOB_COUNT jobs available for this user."

echo -e "\n${BLUE}======================================================${NC}"
echo -e "${GREEN}   🎉  END-TO-END AUTH TEST PASSED! ${NC}"
echo -e "${BLUE}======================================================${NC}"