import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from pprint import pprint

# DB Config
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = "hire_app_db"

async def inspect_chat():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("--- INSPECTING LATEST CHAT ---")
    # Find active chat with messages
    chat = await db.chats.find_one(
        {"messages": {"$exists": True, "$not": {"$size": 0}}},
        sort=[("updated_at", -1)]
    )
    
    if not chat:
        print("No active chats found.")
        return

    print(f"Chat ID: {chat['_id']}")
    print(f"Seeker (user_id): {chat.get('user_id')}")
    print(f"Employer (employer_id): {chat.get('employer_id')}")
    print(f"Total Messages: {len(chat.get('messages', []))}")
    print("-" * 30)
    
    for msg in chat.get("messages", []):
        sender = msg.get("sender_id")
        role = msg.get("role", "N/A")
        text = msg.get("text")
        
        print(f"[{role}] {sender}: {text}")

if __name__ == "__main__":
    asyncio.run(inspect_chat())
