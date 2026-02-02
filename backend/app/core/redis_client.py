import logging
import redis.asyncio as redis
from typing import Optional
from app.core.config import settings

logger = logging.getLogger("RedisClient")

class RedisClient:
    _instance: Optional[redis.Redis] = None

    @classmethod
    def get_instance(cls) -> redis.Redis:
        if cls._instance is None:
            try:
                cls._instance = redis.from_url(
                    settings.REDIS_URL, 
                    encoding="utf-8", 
                    decode_responses=True
                )
                logger.info("✅ Redis Client Initialized")
            except Exception as e:
                logger.error(f"❌ Redis Init Failed: {e}")
                raise e
        return cls._instance

    @classmethod
    async def close(cls):
        if cls._instance:
            await cls._instance.close()
            cls._instance = None
            logger.info("🔒 Redis Connection Closed")

def get_redis() -> redis.Redis:
    """Dependency for validaiton or direct usage"""
    return RedisClient.get_instance()
