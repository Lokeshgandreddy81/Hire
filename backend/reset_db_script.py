from pymongo import MongoClient

def reset_db():
    client = MongoClient("mongodb://localhost:27017")
    db = client["hire_app_db"]
    collections = ["jobs", "profiles", "applications", "chats", "job_matches"]
    
    print("Resetting database...")
    for col in collections:
        db[col].drop()
        print(f"Dropped collection: {col}")
    
    # Also clear users if we want a TRULY fresh start, but user didn't explicitly ask for users to be wiped, 
    # just "legacy contamination" of content. Keeping users allows for easier testing without re-registering.
    # However, to be "Hard Reset", maybe we should? 
    # User said: "legacy contamination". 
    # "Goal: no legacy contamination"
    # Usually users are fine to keep, but their data should be gone.
    # I will stick to the requested list: jobs, profiles, applications, chats, matches.
    
    print("Database reset complete.")

if __name__ == "__main__":
    reset_db()
