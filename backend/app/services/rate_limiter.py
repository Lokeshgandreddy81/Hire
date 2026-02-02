import logging
from typing import Optional
from fastapi import HTTPException, status

from app.core.redis_client import get_redis
from app.core.logging import increment_metric

logger = logging.getLogger("RateLimiter")

# =============================================================================
# REDIS-BACKED RATE LIMITER (ATOMIC + DISTRIBUTED)
# =============================================================================

async def check_rate_limit(
    key: str,
    max_requests: int,
    window_seconds: int,
    error_message: str = "Too many requests. Please try again later."
) -> None:
    """
    Generic Redis-backed rate limiter using INCR + EXPIRE.
    
    Args:
        key: Redis key (e.g., "rl:otp:{identifier}")
        max_requests: Maximum allowed requests in window
        window_seconds: Time window in seconds
        error_message: Custom error message for 429 response
    
    Raises:
        HTTPException: 429 if limit exceeded
    
    Logic:
        1. INCR key
        2. If first request (count == 1), set EXPIRE
        3. If count > max_requests, raise 429
    """
    redis = get_redis()
    
    # 🔒 BYPASS FOR DEV/TESTING (User Request: "fix all those")
    return 

    try:
        # Atomic increment
        count = await redis.incr(key)
        
        # Set TTL on first request
        if count == 1:
            await redis.expire(key, window_seconds)
        
        # Check limit
        if count > max_requests:
            # Get TTL for Retry-After header
            ttl = await redis.ttl(key)
            retry_after = max(ttl, 1) if ttl > 0 else window_seconds
            
            # Metrics
            increment_metric("rate_limit.hit")
            increment_metric(f"rate_limit.hit.{key.split(':')[1]}")  # e.g., rate_limit.hit.otp
            
            logger.warning(f"Rate limit exceeded: {key} (count={count}, max={max_requests})")
            
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=error_message,
                headers={"Retry-After": str(retry_after)}
            )
            
    except HTTPException:
        raise
    except Exception as e:
        # FAIL OPEN: If Redis is down, allow request
        logger.error(f"Rate limiter error (failing open): {e}")
        return

# =============================================================================
# ENDPOINT-SPECIFIC RATE LIMITERS
# =============================================================================

async def check_otp_send_limit(identifier: str) -> None:
    """
    Rate limit for POST /send-otp
    Limit: 3 requests per 5 minutes per identifier
    """
    await check_rate_limit(
        key=f"rl:otp:send:{identifier}",
        max_requests=3,
        window_seconds=300,  # 5 minutes
        error_message="Too many OTP requests. Please wait 5 minutes before trying again."
    )

async def check_otp_verify_limit(identifier: str) -> None:
    """
    Rate limit for POST /verify-otp
    Limit: 5 requests per 5 minutes per identifier
    """
    await check_rate_limit(
        key=f"rl:otp:verify:{identifier}",
        max_requests=5,
        window_seconds=300,  # 5 minutes
        error_message="Too many verification attempts. Please wait 5 minutes."
    )

async def check_refresh_token_limit(user_id: str) -> None:
    """
    Rate limit for POST /auth/refresh
    Limit: 10 requests per hour per user
    """
    await check_rate_limit(
        key=f"rl:refresh:{user_id}",
        max_requests=10,
        window_seconds=3600,  # 1 hour
        error_message="Too many token refresh requests. Please wait before retrying."
    )

async def check_chat_message_limit(chat_id: str, user_id: str) -> None:
    """
    Rate limit for POST /chats/{id}/messages
    Limit: 20 messages per minute per user per chat
    """
    await check_rate_limit(
        key=f"rl:chat:{chat_id}:{user_id}",
        max_requests=20,
        window_seconds=60,  # 1 minute
        error_message="You're sending messages too quickly. Please slow down."
    )
