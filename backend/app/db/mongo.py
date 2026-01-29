from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

class MongoDB:
    client: AsyncIOMotorClient = None
    db = None

    def connect(self):
        try:
            self.client = AsyncIOMotorClient(settings.MONGO_URL)
            self.db = self.client[settings.DB_NAME]
            print(f"✅ Connected to MongoDB at {settings.MONGO_URL}")
        except Exception as e:
            print(f"❌ Could not connect to MongoDB: {e}")

    def close(self):
        if self.client:
            self.client.close()
            print("MongoDB connection closed")

mongo_db = MongoDB()

def get_db():
    return mongo_db.db
