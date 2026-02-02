import math
import hashlib
import re
import logging
from typing import Dict, Any, List, Set, Tuple
from bson import ObjectId

try:
    from app.db.mongo import get_db
except ImportError:
    get_db = None

# =============================================================================
# APEX SYNTHESIS ALGORITHM — STABLE PRODUCTION VERSION
# =============================================================================

class ApexSynthesisMatcher:
    __slots__ = ("skill_normalizer", "exp_levels", "MIN_SALARY", "MAX_SALARY", "weights", "regex")

    def __init__(self):
        self.skill_normalizer = {
            "js": "javascript",
            "py": "python",
            "reactjs": "react",
            "nodejs": "node",
            "ml": "machine learning",
            "ai": "artificial intelligence",
        }

        self.exp_levels = {
            "junior": 2,
            "mid": 4,
            "senior": 7,
            "lead": 9,
        }

        self.MIN_SALARY = 10_000
        self.MAX_SALARY = 5_000_000

        self.weights = {
            "skills": 0.40,
            "experience": 0.30,
            "salary": 0.20,
            "location": 0.10,
        }

        self.regex = {
            "clean": re.compile(r"[^\w\s]"),
            "years": re.compile(r"(\d+)\s*years?"),
        }

    # -------------------------------------------------------------------------
    # NORMALIZATION
    # -------------------------------------------------------------------------

    def _skills(self, data: Dict[str, Any]) -> Set[str]:
        raw = set()
        for k in ("skills", "requirements"):
            v = data.get(k)
            if isinstance(v, list):
                raw |= {str(x).lower() for x in v}
        return {self.skill_normalizer.get(s, s) for s in raw if s}

    def _experience(self, data: Dict[str, Any]) -> float:
        val = data.get("experience_required") or data.get("experience_years") or 0
        try:
            return float(val)
        except:
            return 0.0

    def _salary(self, data: Dict[str, Any]) -> float:
        for k in ("maxSalary", "salary"):
            v = data.get(k)
            if isinstance(v, (int, float)) and v > 0:
                return float(v)
        return 0.0

    # -------------------------------------------------------------------------
    # SCORING
    # -------------------------------------------------------------------------

    def _title_score(self, profile: Dict[str, Any], job: Dict[str, Any]) -> float:
        """
        Heuristic Title Matching
        Returns multiplier: 1.0 (neutral), >1.0 (boost), <1.0 (penalty)
        """
        p_title = str(profile.get("title") or "").lower()
        j_title = str(job.get("title") or "").lower()
        
        if not p_title or not j_title:
            return 1.0
            
        # Tokenize (simple split)
        p_tokens = set(self.regex["clean"].sub(" ", p_title).split())
        j_tokens = set(self.regex["clean"].sub(" ", j_title).split())
        
        # Ignored words
        stop_words = {"senior", "junior", "lead", "manager", "intern", "associate", "executive", "iii", "ii", "i"}
        p_core = p_tokens - stop_words
        j_core = j_tokens - stop_words
        
        if not p_core or not j_core:
             # Fallback to full tokens if core is empty (e.g. "Manager")
             p_core = p_tokens
             j_core = j_tokens

        overlap = len(p_core & j_core)
        
        if overlap > 0:
            return 1.2  # Boost for exact word match (e.g. "Software")
        else:
            return 0.5  # Heavy penalty for NO word match
            
    def calculate(self, profile: Dict[str, Any], job: Dict[str, Any]) -> float:
        try:
            ps = self._skills(profile)
            js = self._skills(job)

            # ✅ SKILL SCORING (STRICTER)
            if not js:
                # Job has no skills listed -> Low confidence match
                skill_score = 0.1 # Was 0.7
            else:
                overlap = len(ps & js)
                if len(js) > 0:
                    # Raw ratio
                    ratio = overlap / len(js)
                    # No floor. If 0 overlap, score is 0.
                    skill_score = ratio
                    
                    # 🔒 CRITICAL: FILTER BY SKILL
                    # User Request: "If skills are not matched then I should [NOT] get that job"
                    if skill_score == 0:
                        return 0.0
                else:
                    skill_score = 0.0

            # EXPERIENCE
            pe = self._experience(profile)
            je = self._experience(job)
            exp_score = 1.0 if je == 0 else min(1.0, pe / je)

            # SALARY
            psal = self._salary(profile)
            jsal = self._salary(job)
            
            # If job salary is 0 (hidden), assume match
            if jsal == 0:
                sal_score = 1.0
            else:
                # If profile has no salary expectation, assume match
                if psal == 0:
                    sal_score = 1.0
                else:
                    # Job pays 100k, I want 120k -> 100/120 = 0.83
                    # Job pays 100k, I want 80k -> 1.0
                    sal_score = 1.0 if psal <= jsal else (jsal / psal)

            # WEIGHTED SUM
            # Weights: Skills(0.4) + Exp(0.3) + Salary(0.2) + Location(0.1)
            # We assume location is neutral (1.0) since we don't have geo-distance yet
            loc_score = 1.0 
            
            base_score = (
                (skill_score * self.weights["skills"]) +
                (exp_score * self.weights["experience"]) +
                (sal_score * self.weights["salary"]) +
                (loc_score * self.weights["location"])
            )
            
            # TITLE MULTIPLIER (The "Category" Filter)
            title_mult = self._title_score(profile, job)
            
            final_score = base_score * title_mult
            
            return min(1.0, max(0.0, final_score))

        except Exception as e:
            logging.error(f"Match Calc Error: {e}")
            return 0.0



# =============================================================================
# MATCH ADAPTER (API LAYER)
# =============================================================================

async def match_jobs_for_profile(profile_id: str, user_id: str) -> List[Dict]:
    if not get_db:
        return []

    db = get_db()

    profile = await db["profiles"].find_one({"_id": ObjectId(profile_id)})
    if not profile:
        return []

    jobs = await db["jobs"].find({"status": "active"}).to_list(1000)

    matcher = ApexSynthesisMatcher()
    results = []

    for job in jobs:
        score = matcher.calculate(profile, job)

        results.append({
            "id": str(job["_id"]),
            "title": job.get("title", "Role"),
            "company": job.get("company", job.get("companyName", "Company")),
            "match_score": score,
            "match_percentage": int(score * 100),
            "location": job.get("location", "Remote"),
            "salary": job.get("maxSalary", job.get("salary", "Negotiable")),
            "requirements": job.get("requirements", []),
            "remote": job.get("remote", False),
        })

    # 🔒 HARDENING: MINIMUM THRESHOLD ENFORCEMENT
    # Prevents "junk" matches from reaching the UI.
    MIN_MATCH_THRESHOLD = 0.45  # 45% match minimum (Requires at least some skill/exp overlap)

    filtered_results = [
        r for r in results 
        if r["match_score"] >= MIN_MATCH_THRESHOLD
    ]

    filtered_results.sort(key=lambda x: x["match_score"], reverse=True)
    return filtered_results[:50]