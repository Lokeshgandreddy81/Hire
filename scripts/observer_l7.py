from pymongo import MongoClient
import sys

MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "hire_app_db"

def observe_chat():
    try:
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        
        chats = list(db.chats.find({}))
        
        print(f"👀 OBSERVER REPORT: Found {len(chats)} active chats.")
        
        for chat in chats:
            msgs = chat.get("messages", [])
            print(f"   Chat {chat.get('_id')} | App {chat.get('application_id')}")
            print(f"   Participants: Emp={chat.get('employer_id')} | Seeker={chat.get('user_id')}")
            print(f"   Message Count: {len(msgs)}")
            for m in msgs[-3:]: # Show last 3
                sender = "Employer" if m.get("senderId") == chat.get("employer_id") else "Seeker"
                print(f"    - [{sender}] {m.get('text')}")
                
    except Exception as e:
        print(f"❌ Observer Error: {e}")

if __name__ == "__main__":
    observe_chat()
