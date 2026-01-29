#!/bin/bash
cd "$(dirname "$0")"

# Fix "too many open files" error on macOS
# Increase file descriptor limit
ulimit -n 4096 2>/dev/null || true

# Check if watchman is installed (recommended for file watching)
if command -v watchman &> /dev/null; then
    echo "✅ Watchman detected - using optimized file watching"
    npx expo start --clear
else
    echo "⚠️  Watchman not installed. For better performance, install with: brew install watchman"
    echo "📦 Starting Expo (this may take a moment)..."
    # Use --no-dev to reduce file watching
    EXPO_NO_DOTENV=1 npx expo start --clear
fi
