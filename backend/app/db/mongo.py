from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

class MongoDB:
    client: AsyncIOMotorClient = None
    db = None

    async def connect(self):
        """Connect to MongoDB with validation"""
        try:
            self.client = AsyncIOMotorClient(
                settings.MONGO_URL,
                serverSelectionTimeoutMS=5000
            )
            self.db = self.client[settings.DB_NAME]
            
            # ACTUALLY VERIFY CONNECTION
            await self.client.admin.command('ping')
            print(f"✅ Connected to MongoDB at {settings.MONGO_URL}")
        except Exception as e:
            print(f"❌ MongoDB connection failed: {e}")
            raise RuntimeError(f"Failed to connect to MongoDB: {e}")

    def close(self):
        if self.client:
            self.client.close()
            print("MongoDB connection closed")

mongo_db = MongoDB()

def get_db():
    if mongo_db.db is None:
        raise RuntimeError("Database not initialized. Call mongo_db.connect() first")
    return mongo_db.db
