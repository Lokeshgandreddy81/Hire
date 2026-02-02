#!/bin/bash

# ==============================================================================
# HIRE APP - DEVELOPER START SCRIPT
# ==============================================================================
# Usage: ./start.sh [mode]
# Modes: tunnel (default), lan, local

cd "$(dirname "$0")"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

MODE="${1:-tunnel}"

echo -e "${GREEN}🚀 Initializing Hire App Development Environment...${NC}"

# Check for Dependencies
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 node_modules not found. Installing dependencies...${NC}"
    npm install --legacy-peer-deps
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ npm install failed.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Dependencies installed.${NC}"
fi

# Optimize System Limits (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    ulimit -n 10240 2>/dev/null || true
fi

# Check Watchman
if command -v watchman &> /dev/null; then
    echo -e "${GREEN}✅ Watchman detected.${NC}"
else
    echo -e "${YELLOW}⚠️  Watchman not found. Install with: brew install watchman${NC}"
fi

echo -e "${GREEN}🧹 Cleaning Metro cache...${NC}"

# Start Expo based on mode
echo -e "${GREEN}📱 Starting Expo Go in ${MODE} mode...${NC}"

case "$MODE" in
    tunnel)
        npx expo start --tunnel --clear
        ;;
    lan)
        npx expo start --lan --clear
        ;;
    local)
        npx expo start --localhost --clear
        ;;
    *)
        npx expo start --tunnel --clear
        ;;
esac