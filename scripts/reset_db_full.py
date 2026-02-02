from pymongo import MongoClient
import sys

MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "hire_app_db"

def reset_db():
    cl = MongoClient(MONGO_URI)
    if DB_NAME in cl.list_database_names():
        cl.drop_database(DB_NAME)
        print("✅ DATABASE WIPED: Clean State Enforced.")
    else:
        print("✅ DATABASE ALREADY CLEAN.")

if __name__ == "__main__":
    reset_db()
