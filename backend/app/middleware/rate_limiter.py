import logging
import threading
from datetime import datetime, timedelta, timezone
from collections import defaultdict
from typing import Dict, Tuple, Optional

from fastapi import HTTPException, status

logger = logging.getLogger("RateLimiter")

# =============================================================================
# RATE LIMITER ENGINE
# =============================================================================

class RateLimiter:
    """
    Thread-safe, high-performance in-memory rate limiter.
    Uses 'Sliding Window' logic.
    """
    def __init__(self):
        self._requests: Dict[str, list] = defaultdict(list)
        self._blocked: Dict[str, datetime] = {}
        self._lock = threading.Lock() # Crucial for async/threaded workers
    
    def check_rate_limit(
        self, 
        identifier: str, 
        max_requests: int, 
        window_seconds: int,
        block_duration_seconds: int
    ) -> Tuple[bool, str]:
        """
        Atomic check. Returns (is_allowed, reason).
        """
        now = datetime.now(timezone.utc)
        
        with self._lock:
            # 1. Block Check (Fastest)
            if identifier in self._blocked:
                unblock_time = self._blocked[identifier]
                if now < unblock_time:
                    remaining = int((unblock_time - now).total_seconds())
                    return False, f"Too many requests. Try again in {remaining}s."
                else:
                    # Block expired, clean up
                    del self._blocked[identifier]

            # 2. Lazy Cleanup (Only for THIS user, O(1) mostly)
            # Filter out requests older than the window
            window_start = now - timedelta(seconds=window_seconds)
            
            # Optimization: If list is empty or all items are old, reset immediately
            user_history = self._requests[identifier]
            
            # Fast slice: keep only requests inside window
            # (Assumes requests are appended in chronological order)
            new_history = [t for t in user_history if t > window_start]
            self._requests[identifier] = new_history
            
            # 3. Limit Check
            if len(new_history) >= max_requests:
                # Trigger Block
                self._blocked[identifier] = now + timedelta(seconds=block_duration_seconds)
                logger.warning(f"Rate Limit Hit: {identifier} blocked for {block_duration_seconds}s")
                return False, f"Rate limit exceeded. Blocked for {block_duration_seconds}s."
            
            # 4. Record Request
            self._requests[identifier].append(now)
            return True, "OK"

    def prune_stale_data(self, max_age_hours: int = 1):
        """
        Maintenance task to clean completely inactive users from RAM.
        Call this from a background task (e.g., every 10 mins), NOT the request path.
        """
        now = datetime.now(timezone.utc)
        cutoff = now - timedelta(hours=max_age_hours)
        
        with self._lock:
            # Snapshot keys to allow modification during iteration
            initial_count = len(self._requests)
            for ident in list(self._requests.keys()):
                # If latest request is older than cutoff, delete entire key
                if not self._requests[ident] or self._requests[ident][-1] < cutoff:
                    del self._requests[ident]
            
            # Cleanup expired blocks
            for ident in list(self._blocked.keys()):
                if now >= self._blocked[ident]:
                    del self._blocked[ident]
            
            final_count = len(self._requests)
            if initial_count - final_count > 0:
                logger.info(f"RateLimiter Pruned: Removed {initial_count - final_count} stale users.")

# =============================================================================
# INSTANCES & DEPENDENCIES
# =============================================================================

# Global Instances (Singleton pattern via module import)
otp_limiter = RateLimiter()
api_limiter = RateLimiter()

def check_otp_rate_limit(identifier: str):
    """
    Strict Limit: 3 OTPs per 5 minutes.
    Prevents SMS flooding / Cost attacks.
    """
    allowed, msg = otp_limiter.check_rate_limit(
        identifier, 
        max_requests=3, 
        window_seconds=300,     # 5 minutes
        block_duration_seconds=900 # 15 minutes block
    )
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=msg
        )

def check_api_rate_limit(identifier: str):
    """
    General Limit: 100 requests per minute.
    Protects against basic DDoS/Scraping.
    """
    allowed, msg = api_limiter.check_rate_limit(
        identifier,
        max_requests=100,
        window_seconds=60,
        block_duration_seconds=60
    )
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=msg
        )