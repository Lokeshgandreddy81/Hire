import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import IndexModel, ASCENDING, TEXT
from app.core.config import settings

# =============================================================================
# CONFIGURATION
# =============================================================================
logger = logging.getLogger("MongoManager")

class MongoDB:
    """
    Singleton Wrapper for MongoDB Connection.
    Handles connection pooling, health checks, and index management.
    """
    client: AsyncIOMotorClient = None
    db: AsyncIOMotorDatabase = None

    async def connect(self):
        """
        Connect to MongoDB and Initialize Schema.
        """
        if self.client:
            return  # Idempotent: Don't reconnect if already connected

        try:
            logger.info(f"🔌 Connecting to MongoDB at {settings.MONGO_URL}...")
            
            self.client = AsyncIOMotorClient(
                settings.MONGO_URL,
                serverSelectionTimeoutMS=5000, # Fail fast (5s)
                maxPoolSize=100, # Handle high concurrency
                minPoolSize=10   # Keep connections warm
            )
            
            # Select Database
            self.db = self.client[settings.DB_NAME]
            
            # Health Check (Ping)
            await self.client.admin.command('ping')
            logger.info("✅ MongoDB Connected Successfully.")
            
            # Initialize Indexes (Critical for Performance)
            await self._create_indexes()

        except Exception as e:
            logger.critical(f"❌ MongoDB Connection Failed: {e}")
            raise RuntimeError(f"Database connection failed: {e}")

    async def _create_indexes(self):
        """
        Automated Index Management.
        Ensures queries are fast and unique constraints are enforced.
        """
        try:
            # 1. Users Collection
            await self.db.users.create_indexes([
                IndexModel([("identifier", ASCENDING)], unique=True), # Unique Email/Phone
                IndexModel([("role", ASCENDING)])                     # Fast role lookup
            ])

            # 2. Profiles Collection
            await self.db.profiles.create_indexes([
                IndexModel([("user_id", ASCENDING)], unique=True),    # One profile per user
                IndexModel([("skills", TEXT)])                        # Text search for skills
            ])

            # 3. Jobs Collection
            await self.db.jobs.create_indexes([
                IndexModel([("employer_id", ASCENDING)]),             # My Jobs query
                IndexModel([("status", ASCENDING)]),                  # Active jobs query
                IndexModel([("requirements", TEXT), ("title", TEXT)]) # Search capability
            ])
            
            # 4. Applications Collection
            await self.db.applications.create_indexes([
                # Compound index for uniqueness (User cannot double apply to same Job)
                IndexModel([("job_id", ASCENDING), ("user_id", ASCENDING)], unique=True),
                IndexModel([("employer_id", ASCENDING)])
            ])
            
            # 5. Job Matches (Cache)
            await self.db.job_matches.create_indexes([
                IndexModel([("user_id", ASCENDING)], unique=True)     # Fast cache retrieval
            ])

            logger.info("✅ Database Indexes Verified.")
            
        except Exception as e:
            logger.warning(f"⚠️ Index Creation Warning: {e}")
            # We don't raise here; app can run even if indexes are building in background

    def close(self):
        """Graceful Shutdown."""
        if self.client:
            self.client.close()
            logger.info("🛑 MongoDB Connection Closed.")

# =============================================================================
# EXPORTED INSTANCE
# =============================================================================
mongo_db = MongoDB()

def get_db() -> AsyncIOMotorDatabase:
    """Dependency Injection Helper"""
    if mongo_db.db is None:
        # In testing/scripts, we might need to auto-connect, 
        # but in FastAPI, lifespan handles it.
        raise RuntimeError("Database not initialized. Ensure app startup has completed.")
    return mongo_db.db