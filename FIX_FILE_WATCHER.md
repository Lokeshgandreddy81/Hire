# 🔧 Fix "EMFILE: too many open files" Error

## Quick Fix (Recommended)

### Option 1: Install Watchman (Best Solution)
```bash
brew install watchman
```

Then restart Expo:
```bash
cd frontend
./start.sh
```

### Option 2: Increase File Descriptor Limit
Add to your `~/.zshrc` or `~/.bash_profile`:
```bash
# Increase file descriptor limit
ulimit -n 4096
```

Then reload:
```bash
source ~/.zshrc  # or source ~/.bash_profile
```

### Option 3: Use Polling Mode (Temporary)
The start script now automatically handles this, but you can also run:
```bash
cd frontend
npx expo start --clear --no-dev --minify
```

## Permanent Fix

1. **Install Watchman** (recommended):
   ```bash
   brew install watchman
   ```

2. **Increase system limits** (if needed):
   ```bash
   # Check current limit
   ulimit -n
   
   # Increase for current session
   ulimit -n 4096
   
   # Make permanent (add to ~/.zshrc)
   echo "ulimit -n 4096" >> ~/.zshrc
   source ~/.zshrc
   ```

3. **Clean Metro cache**:
   ```bash
   cd frontend
   npx expo start --clear
   ```

## Why This Happens

macOS has a default limit on the number of files that can be watched simultaneously. Metro bundler watches many files in `node_modules`, which can exceed this limit.

**Watchman** is Facebook's file watching service that handles this more efficiently.

## Verify Fix

After installing watchman:
```bash
watchman version
```

Should show: `4.9.0` or higher
