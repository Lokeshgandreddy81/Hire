import asyncio
import os
import re
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

# DB Config
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = "hire_app_db"

# -----------------------------------------------------------------------------
# MATCHING LOGIC (COPIED FROM matching_algorithm.py for debug)
# -----------------------------------------------------------------------------
class DebugMatcher:
    def __init__(self):
        self.skill_normalizer = {
            "js": "javascript", "py": "python", "reactjs": "react", "nodejs": "node"
        }
        self.regex = {"clean": re.compile(r"[^\w\s]")}
        self.weights = {"skills": 0.40, "experience": 0.30, "salary": 0.20, "location": 0.10}

    def _skills(self, data):
        raw = set()
        for k in ("skills", "requirements"):
            v = data.get(k)
            if isinstance(v, list):
                raw |= {str(x).lower() for x in v}
        return {self.skill_normalizer.get(s, s) for s in raw if s}

    def _title_score(self, profile, job):
        p_title = str(profile.get("title") or "").lower()
        j_title = str(job.get("title") or "").lower()
        
        print(f"    Comparing Title: '{p_title}' vs '{j_title}'")
        
        if not p_title or not j_title:
            return 1.0
            
        p_tokens = set(self.regex["clean"].sub(" ", p_title).split())
        j_tokens = set(self.regex["clean"].sub(" ", j_title).split())
        
        stop_words = {"senior", "junior", "lead", "manager", "intern", "associate", "executive", "iii", "ii", "i"}
        p_core = p_tokens - stop_words
        j_core = j_tokens - stop_words
        
        if not p_core: p_core = p_tokens
        if not j_core: j_core = j_tokens

        overlap = len(p_core & j_core)
        print(f"    Tokens: {p_core} vs {j_core} -> Overlap: {overlap}")
        
        if overlap > 0: return 1.2
        else: return 0.5

    def calculate(self, profile, job):
        ps = self._skills(profile)
        js = self._skills(job)
        
        # Skills
        if not js:
            skill_score = 0.1
        else:
            overlap = len(ps & js)
            skill_score = (overlap / len(js)) if len(js) > 0 else 0.0
            
        # Exp
        pe = float(profile.get("experience_years", 0))
        je = float(job.get("experience_required", 0))
        exp_score = 1.0 if je == 0 else min(1.0, pe / je)

        # Salary
        sal_score = 1.0 # Simplified for debug

        # Base
        base = (skill_score * 0.4) + (exp_score * 0.3) + (sal_score * 0.2) + (1.0 * 0.1)
        
        # Title
        title_mult = self._title_score(profile, job)
        final = base * title_mult
        
        print(f"  > Scores: Skill={skill_score:.2f}, Exp={exp_score:.2f}, Base={base:.2f}, TitleMult={title_mult}, FINAL={final:.4f}")
        return final

# -----------------------------------------------------------------------------
# RUNNER
# -----------------------------------------------------------------------------
async def debug_matches():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("--- DEBUGGING MATCHES ---")
    
    # Get latest profile
    profile = await db.profiles.find_one({"active": True}, sort=[("created_at", -1)])
    if not profile:
        # Fallback to any profile
        profile = await db.profiles.find_one({}, sort=[("created_at", -1)])
        
    print(f"User Profile: {profile.get('title')} | Skills: {profile.get('skills')}")
    
    jobs = await db.jobs.find({"status": "active"}).to_list(100)
    matcher = DebugMatcher()
    
    for job in jobs:
        print(f"Job: {job.get('title')} ({job.get('company')})")
        matcher.calculate(profile, job)
        print("-" * 20)

if __name__ == "__main__":
    asyncio.run(debug_matches())
