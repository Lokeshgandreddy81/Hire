import logging
import asyncio
from datetime import datetime, timedelta, timezone

from app.db.mongo import get_db
from app.core.logging import log_event, increment_metric

logger = logging.getLogger("CleanupService")

# =============================================================================
# CLEANUP TASKS
# =============================================================================

async def cleanup_expired_refresh_tokens():
    """
    Remove expired refresh tokens from MongoDB.
    Runs periodically to prevent DB bloat.
    """
    try:
        db = get_db()
        now = datetime.now(timezone.utc)
        
        # Delete tokens past their expiration date
        result = await db["refresh_tokens"].delete_many({
            "expires_at_date": {"$lt": now},
            "revoked": False
        })
        
        if result.deleted_count > 0:
            increment_metric("cleanup.refresh_tokens.deleted")
            log_event(
                "cleanup_refresh_tokens",
                deleted_count=result.deleted_count
            )
            logger.info(f"🧹 Cleaned {result.deleted_count} expired refresh tokens")
            
    except Exception as e:
        logger.error(f"Refresh token cleanup failed: {e}")

async def cleanup_stale_match_cache():
    """
    Remove old match cache entries from MongoDB.
    Redis handles its own TTL, but Mongo L2 cache needs manual cleanup.
    """
    try:
        db = get_db()
        # Delete cache entries older than 7 days
        cutoff = datetime.utcnow() - timedelta(days=7)
        
        result = await db["job_matches"].delete_many({
            "updated_at": {"$lt": cutoff}
        })
        
        if result.deleted_count > 0:
            increment_metric("cleanup.match_cache.deleted")
            log_event(
                "cleanup_match_cache",
                deleted_count=result.deleted_count
            )
            logger.info(f"🧹 Cleaned {result.deleted_count} stale match cache entries")
            
    except Exception as e:
        logger.error(f"Match cache cleanup failed: {e}")

async def cleanup_revoked_refresh_tokens():
    """
    Remove revoked refresh tokens older than 30 days.
    Keep recent ones for audit/security analysis.
    """
    try:
        db = get_db()
        cutoff = datetime.now(timezone.utc) - timedelta(days=30)
        
        result = await db["refresh_tokens"].delete_many({
            "created_at": {"$lt": cutoff},
            "revoked": True
        })
        
        if result.deleted_count > 0:
            increment_metric("cleanup.revoked_tokens.deleted")
            log_event(
                "cleanup_revoked_tokens",
                deleted_count=result.deleted_count
            )
            logger.info(f"🧹 Cleaned {result.deleted_count} old revoked tokens")
            
    except Exception as e:
        logger.error(f"Revoked token cleanup failed: {e}")

# =============================================================================
# BACKGROUND TASK RUNNER
# =============================================================================

_cleanup_task_handle = None

async def _run_cleanup_loop():
    """
    Main cleanup loop. Runs every 6 hours.
    """
    while True:
        try:
            # Wait 6 hours between runs
            await asyncio.sleep(6 * 3600)
            
            logger.info("🧹 Starting periodic cleanup...")
            
            # Run all cleanup tasks
            await cleanup_expired_refresh_tokens()
            await cleanup_stale_match_cache()
            await cleanup_revoked_refresh_tokens()
            
            log_event("cleanup_cycle_complete")
            logger.info("✅ Cleanup cycle complete")
            
        except Exception as e:
            logger.error(f"Cleanup loop error: {e}")
            # Wait 1 hour before retry on error
            await asyncio.sleep(3600)

def start_cleanup_tasks():
    """
    Start the background cleanup task.
    Called from FastAPI lifespan.
    """
    global _cleanup_task_handle
    if _cleanup_task_handle is None:
        _cleanup_task_handle = asyncio.create_task(_run_cleanup_loop())
        logger.info("🧹 Background cleanup tasks started")

async def stop_cleanup_tasks():
    """
    Gracefully stop cleanup tasks.
    Called from FastAPI lifespan shutdown.
    """
    global _cleanup_task_handle
    if _cleanup_task_handle:
        _cleanup_task_handle.cancel()
        try:
            await _cleanup_task_handle
        except asyncio.CancelledError:
            pass
        _cleanup_task_handle = None
        logger.info("🛑 Background cleanup tasks stopped")
