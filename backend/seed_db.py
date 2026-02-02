import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "hire_app_db")

JOBS = [
    {
        "title": "Heavy Vehicle Driver",
        "companyName": "Logistics Pro",
        "location": "Hyderabad",
        "type": "Full-time",
        "minSalary": 25000,
        "maxSalary": 35000,
        "description": "Looking for experienced heavy vehicle driver with 5+ years experience. Night shifts required.",
        "requirements": ["Heavy License", "Night Shift", "Driving"],
        "skills": ["Driving", "Vehicle Maintenance", "Navigation"],
        "experience_required": 5,
        "remote": False,
        "employer_id": "seed_employer_001",
        "posted_at": datetime.utcnow(),
        "status": "active"
    },
    {
        "title": "Warehouse Manager",
        "companyName": "QuickCommerce",
        "location": "Bangalore",
        "type": "Full-time",
        "minSalary": 40000,
        "maxSalary": 60000,
        "description": "Manage inventory and staff. 3+ years experience required.",
        "requirements": ["Management", "Inventory", "Leadership"],
        "skills": ["Management", "Inventory Control", "Team Leadership"],
        "experience_required": 3,
        "remote": False,
        "employer_id": "seed_employer_002",
        "posted_at": datetime.utcnow(),
        "status": "active"
    },
    {
        "title": "Delivery Partner",
        "companyName": "FastFood",
        "location": "Remote",
        "type": "Contract",
        "minSalary": 15000,
        "maxSalary": 25000,
        "description": "Deliver food packages. Bike required.",
        "requirements": ["Bike", "License"],
        "skills": ["Driving", "Navigation", "Customer Service"],
        "experience_required": 1,
        "remote": True,
        "employer_id": "seed_employer_003",
        "posted_at": datetime.utcnow(),
        "status": "active"
    },
    {
        "title": "Software Engineer",
        "companyName": "TechCorp",
        "location": "Bangalore",
        "type": "Full-time",
        "minSalary": 800000,
        "maxSalary": 1500000,
        "description": "Build scalable web applications using React and Node.js.",
        "requirements": ["React", "Node.js", "3+ years"],
        "skills": ["JavaScript", "React", "Node", "Python", "AWS"],
        "experience_required": 3,
        "remote": True,
        "employer_id": "seed_employer_004",
        "posted_at": datetime.utcnow(),
        "status": "active"
    }
]

async def seed():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    print(f"🌱 Seeding database: {DB_NAME}...")
    
    # Clear existing to avoid duplicates
    await db["jobs"].delete_many({})
    
    result = await db["jobs"].insert_many(JOBS)
    print(f"✅ Inserted {len(result.inserted_ids)} jobs.")
    print("   - Heavy Vehicle Driver (Hyderabad)")
    print("   - Warehouse Manager (Bangalore)")
    print("   - Delivery Partner (Remote)")
    print("   - Software Engineer (Bangalore)")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed())
