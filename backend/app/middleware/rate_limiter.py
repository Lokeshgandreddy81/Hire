from datetime import datetime, timedelta
from fastapi import HTTPException, status
from collections import defaultdict
from typing import Dict, Tuple

class RateLimiter:
    def __init__(self):
        self.requests: Dict[str, list] = defaultdict(list)
        self.blocked: Dict[str, datetime] = {}
    
    def check_rate_limit(
        self, 
        identifier: str, 
        max_requests: int = 5, 
        window_seconds: int = 300,
        block_duration_seconds: int = 900
    ) -> Tuple[bool, str]:
        """
        Check if request should be rate limited.
        Returns (is_allowed, message)
        """
        now = datetime.utcnow()
        
        # Check if currently blocked
        if identifier in self.blocked:
            block_until = self.blocked[identifier]
            if now < block_until:
                remaining = (block_until - now).total_seconds()
                return False, f"Too many requests. Blocked for {int(remaining)} more seconds."
            else:
                del self.blocked[identifier]
        
        # Clean old requests outside window
        cutoff = now - timedelta(seconds=window_seconds)
        self.requests[identifier] = [
            req_time for req_time in self.requests[identifier] 
            if req_time > cutoff
        ]
        
        # Check if limit exceeded
        if len(self.requests[identifier]) >= max_requests:
            # Block for block_duration_seconds
            self.blocked[identifier] = now + timedelta(seconds=block_duration_seconds)
            return False, f"Rate limit exceeded. Blocked for {block_duration_seconds} seconds."
        
        # Record this request
        self.requests[identifier].append(now)
        return True, "OK"

# Global rate limiter instances
otp_rate_limiter = RateLimiter()
api_rate_limiter = RateLimiter()

def check_otp_rate_limit(identifier: str):
    """Check OTP rate limit: 3 requests per 5 minutes"""
    allowed, message = otp_rate_limiter.check_rate_limit(
        identifier, 
        max_requests=3, 
        window_seconds=300,
        block_duration_seconds=900
    )
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=message
        )

def check_api_rate_limit(identifier: str):
    """Check API rate limit: 100 requests per minute"""
    allowed, message = api_rate_limiter.check_rate_limit(
        identifier,
        max_requests=100,
        window_seconds=60,
        block_duration_seconds=60
    )
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=message
        )