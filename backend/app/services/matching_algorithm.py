import re
import math
import hashlib
import logging
from typing import Dict, Any, List, Set, Optional, Tuple
from bson import ObjectId

# Import database dependency safely
try:
    from app.db.mongo import get_db
except ImportError:
    get_db = None

# =============================================================================
# APEX SYNTHESIS ALGORITHM v1.0 - 99.999% RELIABILITY GUARANTEED
# =============================================================================
# (User Provided Implementation)
# =============================================================================

class ApexSynthesisMatcher:
    """
    The definitive job matching algorithm.
    Integrates Musk, Bezos, Pichai, Cook, Altman principles.
    """
    
    def __init__(self):
        # Skill normalization dictionary
        self.skill_normalizer = {
            'js': 'javascript', 'javascript es6': 'javascript', 'ecmascript': 'javascript',
            'typescript': 'typescript', 'ts': 'typescript',
            'python3': 'python', 'python 3': 'python', 'py': 'python',
            'java 8': 'java', 'java 11': 'java', 'java ee': 'java',
            'aws': 'amazon web services', 'amazonaws': 'amazon web services',
            'azure': 'microsoft azure', 'gcp': 'google cloud platform',
            'postgresql': 'postgres', 'postgres db': 'postgres',
            'mongodb': 'mongo', 'mysql': 'mysql',
            'reactjs': 'react', 'react.js': 'react', 'react js': 'react',
            'nodejs': 'node', 'node.js': 'node', 'node js': 'node',
            'vuejs': 'vue', 'vue.js': 'vue',
            'angularjs': 'angular', 'angular.js': 'angular',
            'kubernetes': 'k8s', 'k8': 'k8s',
            'docker': 'docker', 'docker swarm': 'docker',
            'machine learning': 'ml', 'ml': 'machine learning',
            'artificial intelligence': 'ai', 'ai': 'artificial intelligence',
            'data science': 'data science', 'data scientist': 'data science',
        }
        
        self.exp_levels = {
            'entry': 1, 'junior': 2, 'associate': 3,
            'mid': 4, 'intermediate': 5, 'senior': 7,
            'lead': 8, 'principal': 9, 'director': 10, 'vp': 11
        }
        
        self.MIN_SALARY = 10000
        self.MAX_SALARY = 5000000
        
        self.weights = {
            'skills': 0.40,
            'experience': 0.30,
            'salary': 0.20,
            'location': 0.10
        }

    # =========================================================================
    # REQUIREMENT DENSITY LOGIC (The Entrepreneur Move)
    # =========================================================================
    
    def _calculate_density(self, job: Dict[str, Any]) -> float:
        """
        Calculates Requirement Density (0.0 to 10.0+)
        High Density (> 5) = Complex Role (Skills King)
        Low Density (< 3) = Simple Role (Location/Availability King)
        """
        density = 0.0
        
        # 1. Skill Count Density
        skills = self._extract_skills(job)
        density += len(skills) * 1.0
        
        # 2. Experience Strictness
        years, level = self._extract_experience(job)
        if years > 0: density += 1.0
        if years > 3: density += 1.0 # Mid-level
        if years > 6: density += 1.5 # Senior
        
        # 3. Salary Constraints (Implies Value/Complexity)
        salary = self._extract_salary(job)
        if salary > 80000: density += 1.0
        if salary > 150000: density += 1.5
        
        return density

    def _get_dynamic_weights(self, density: float) -> Dict[str, float]:
        """
        Returns dynamic weights based on density.
        """
        if density >= 5.0:
            # HIGH DENSITY (Engineering, Specialized)
            # Skills & Exp are non-negotiable. Location is flexible.
            return {
                'skills': 0.50,      # Critically important
                'experience': 0.30,  # Validation of skills
                'salary': 0.15,      # Still important
                'location': 0.05     # Often remote/relocatable
            }
        elif density <= 2.5:
            # LOW DENSITY (Delivery, Retail, Gig)
            # Location & Availability are King.
            return {
                'skills': 0.15,      # "Can you drive?"
                'experience': 0.15,  # "Have you done it?"
                'salary': 0.20,      # Pricing
                'location': 0.50     # "Are you ANYWHERE near here?" (MASSIVE BOOST)
            }
        else:
            # MID DENSITY (Standard White/Blue Collar)
            # Balanced approach (The Default)
            return {
                'skills': 0.40,
                'experience': 0.30,
                'salary': 0.20,
                'location': 0.10
            }
    
    # ... (Phase 1-8 Implementation) ...

    def _sanitize_input(self, data: Any) -> Dict[str, Any]:
        if data is None: return {}
        if not isinstance(data, dict):
            try: return dict(data)
            except: return {}
        
        safe_copy = {}
        for key, value in list(data.items())[:100]:
            if not isinstance(key, str): continue
            safe_key = key[:100]
            if isinstance(value, (int, float)):
                safe_value = value if math.isfinite(value) else 0.0
            elif isinstance(value, str):
                safe_value = str(value)[:10000]
            elif isinstance(value, list):
                if value and isinstance(value[0], dict):
                     # Recursive sanitize for rich lists (Skill Entries)
                     safe_value = [self._sanitize_input(x) for x in value[:100]]
                else:
                     safe_value = [str(x)[:1000] for x in value[:100]]
            elif isinstance(value, dict):
                safe_value = self._sanitize_input(value)
            else:
                safe_value = str(value)[:1000]
            safe_copy[safe_key] = safe_value
        return safe_copy

    def _extract_number(self, value: Any, context: str = "") -> float:
        if value is None: return 0.0
        if isinstance(value, (int, float)): return float(value)
        text = str(value).lower().replace(',', '')
        numbers = re.findall(r'(\d+(?:\.\d+)?)', text)
        if not numbers: return 0.0
        try:
            val = float(numbers[0])
            if 'k' in text: val *= 1000
            elif 'm' in text: val *= 1000000
            return val
        except: return 0.0

    def _extract_salary(self, data: Dict[str, Any]) -> float:
        for k in ['salary', 'maxSalary', 'max_salary', 'compensation']:
            if k in data:
                return self._extract_number(data[k])
        return 0.0

    def _extract_skills(self, data: Dict[str, Any]) -> Dict[str, float]:
        """
        Returns Dict[normalized_skill_name -> proficiency_weight]
        Weights: Expert=1.5, Advanced=1.2, Intermediate=1.0, Entry=0.8
        """
        skills = {}
        
        # Priority: process rich entries
        entries = data.get("skill_entries") or []
        for entry in entries:
            if isinstance(entry, dict):
                name = str(entry.get("name", "")).lower().strip()
                if not name: continue
                
                raw_level = str(entry.get("level", "intermediate")).lower()
                weight = 1.0
                if "expert" in raw_level: weight = 1.5
                elif "advanced" in raw_level: weight = 1.2
                elif "entry" in raw_level or "junior" in raw_level: weight = 0.8
                
                norm_name = self.skill_normalizer.get(name, name)
                skills[norm_name] = max(skills.get(norm_name, 0), weight)

        # Fallback/Supplement: legacy string fields
        # If we already have the skill from rich entries, don't overwrite with default weight
        fields = ['skills', 'requirements', 'technologies', 'required_skills']
        for f in fields:
            val = data.get(f)
            if isinstance(val, list):
                for item in val:
                    # Skip if item is actually a dictionary (handled above or mixed list)
                    if isinstance(item, dict): 
                        continue
                        
                    s = str(item).lower().strip()
                    norm = self.skill_normalizer.get(s, s)
                    if norm not in skills:
                        skills[norm] = 1.0 # Default weight
            elif isinstance(val, str):
                for part in val.lower().replace(',', ' ').split():
                    norm = self.skill_normalizer.get(part, part)
                    if norm not in skills:
                        skills[norm] = 1.0

        return skills

    def _extract_experience(self, data: Dict[str, Any]) -> Tuple[float, float]:
        # Check rich signal first
        detail = data.get("experience_detail")
        if isinstance(detail, dict):
             years = float(detail.get("years", 0))
             etype = str(detail.get("type", "production")).lower()
             
             # Discount non-production experience
             if "academic" in etype or "student" in etype:
                 years *= 0.5
             elif "intern" in etype:
                 years *= 0.7
                 
             return years, 0.0 # Level extracted elsewhere or inferred
             
        years = self._extract_number(data.get('experience_years') or data.get('experience_required'))
        level = 0.0
        title = str(data.get('title', '')).lower()
        for k, v in self.exp_levels.items():
            if k in title: level = float(v)
        return years, level

    def _analyze_location(self, profile: Dict[str, Any], job: Dict[str, Any]) -> float:
        ploc = str(profile.get('location', '')).lower()
        jloc = str(job.get('location', '')).lower()
        if 'remote' in jloc or 'remote' in ploc: return 1.0
        if not ploc or not jloc: return 0.8
        return 1.0 if ploc == jloc else 0.5

    def _score_skills(self, profile_skills: Dict[str, float], job_skills: Dict[str, float]) -> float:
        """
        Weighted Skill Match.
        """
        # If job has no skills, it's permissive
        if not job_skills: 
            return 0.8
            
        # If profile has no skills, it's a weak match
        if not profile_skills: 
            return 0.2
            
        p_keys = set(profile_skills.keys())
        j_keys = set(job_skills.keys())
        
        matches = p_keys & j_keys
        
        if not matches:
             return 0.1
             
        # Calculate Weighted Score
        # For every matched skill, we take the profile's proficiency weight.
        # We divide by total number of job requirements.
        
        weighted_sum = 0.0
        for skill in matches:
            # Add the profile's proficiency bonus (e.g. 1.2 for Advanced)
            weighted_sum += profile_skills[skill]
            
        # Base score = weighted matches / total job skills
        score = weighted_sum / len(job_skills)
        
        # Altman Optimism Bonus for extra skills (limited)
        extra = len(p_keys - j_keys)
        bonus = min(0.2, extra * 0.02)
        
        return min(1.0, score + bonus)

    def _score_experience(self, py: float, pl: float, jy: float, jl: float) -> float:
        if jy == 0: return 1.0
        if py >= jy: return 1.0
        return max(0.0, py / jy)

    def _score_salary(self, jsal: float, psal: float) -> float:
        if jsal == 0 or psal == 0: return 0.8
        if jsal >= psal: return 1.0
        return max(0.0, jsal / psal)


    def _normalize_text(self, text: str) -> str:
        """
        OBJECTIVE 2: SEMANTIC NORMALIZATION (HONESTY PROTECTION)
        Map task-level honesty -> category-level meaning.
        """
        t = text.lower().strip()
        
        # South Indian Cuisine
        if any(x in t for x in ['dosa', 'idli', 'vada', 'sambar', 'udupi']):
            return 'south indian cuisine'
            
        # Last Mile Delivery
        if any(x in t for x in ['bike', 'scooter', 'two-wheeler', 'swiggy', 'zomato', 'porter']):
            return 'delivery'
            
        # Security
        if any(x in t for x in ['guard', 'gate', 'watchman', 'security']):
            return 'security'
            
        # Driving
        if any(x in t for x in ['driving', 'driver', 'chauffeur', 'cab']):
            return 'driver'
        
        # Cooking
        if any(x in t for x in ['cook', 'chef', 'kitchen']):
            return 'cook'

        return t

    def _check_blockers(self, profile_skills: Dict[str, float], job_skills: Dict[str, float]) -> bool:
        """
        OBJECTIVE 1: BLOCKER TAGS (HARD FAIL FAST)
        If a job implies a hard requirement, unmatched profile gets 0.0.
        """
        # Define Known Blockers (In a real system, these would be flags in the job DB)
        # For this phase, we infer them from skill naming conventions.
        BLOCKER_KEYWORDS = {
            'license', 'licence', 'dl', 'driving license', 
            'certified', 'certification', 'certificate',
            'night shift', 'own bike', 'vehicle' 
        }
        
        for j_skill in job_skills.keys():
            # Check if this job skill is a blocker
            is_blocker = False
            for k in BLOCKER_KEYWORDS:
                if k in j_skill:
                    is_blocker = True
                    break
            
            if is_blocker:
                # Profile MUST have this skill (or a normalized equivalent)
                # We check for partial string match in profile skills as well for safety
                has_skill = False
                for p_skill in profile_skills.keys():
                    if p_skill == j_skill or j_skill in p_skill or p_skill in j_skill:
                        has_skill = True
                        break
                
                if not has_skill:
                    # logging.info(f"🚫 BLOCKER FAIL: Missing {j_skill}")
                    return False # BLOCKER TRIGGERED
                    
        return True

    def calculate_composite_score(self, profile: Dict[str, Any], job: Dict[str, Any]) -> float:
        try:
            safe_p = self._sanitize_input(profile)
            safe_j = self._sanitize_input(job)
            
            # --- NORMALIZATION ---
            # Inject normalized "Virtual Skills" into the sanitized input before extraction
            # This is a hack for the "Honesty Protection" without rewriting _extract_skills completely
            p_desc = str(safe_p.get('summary', '')) + " " + " ".join(safe_p.get('skills', []))
            normalized_concept = self._normalize_text(p_desc)
            
            # We add the normalized concept as a 'skill' to the profile extraction
            # This allows "Dosa" -> "South Indian Cuisine" match if the job asks for it
            
            ps = self._extract_skills(safe_p)
            js = self._extract_skills(safe_j)
            
            # Add virtual normalized skill
            if normalized_concept and normalized_concept not in ps:
                 ps[normalized_concept] = 1.0
            
            # --- BLOCKER CHECK (Objective 1) ---
            if not self._check_blockers(ps, js):
                return 0.0

            py, pl = self._extract_experience(safe_p)
            jy, jl = self._extract_experience(safe_j)
            psal = self._extract_salary(safe_p)
            jsal = self._extract_salary(safe_j)
            
            # DYNAMIC WEIGHTING
            density = self._calculate_density(safe_j)
            weights = self._get_dynamic_weights(density)
            
            scores = [
                self._score_skills(ps, js) * weights['skills'],
                self._score_experience(py, pl, jy, jl) * weights['experience'],
                self._score_salary(jsal, psal) * weights['salary'],
                self._analyze_location(safe_p, safe_j) * weights['location']
            ]
            
            raw_score = sum(scores)
            
            # --- TRADE DOMINANCE (Objective 3) ---
            # Introduce Primary Trade Priority
            # Fix: Handle multiple possible keys for title
            p_title_raw = safe_p.get('job_title') or safe_p.get('role') or safe_p.get('title') or safe_p.get('roleTitle') or ''
            j_title_raw = safe_j.get('title') or safe_j.get('role') or safe_j.get('job_title') or safe_j.get('roleTitle') or ''
            
            p_title_norm = self._normalize_text(p_title_raw)
            j_title_norm = self._normalize_text(j_title_raw)
            
            trade_match = False
            # Fix: Ensure p_title_norm is not empty to avoid "empty string in string" returning True
            if p_title_norm and j_title_norm:
                if p_title_norm == j_title_norm or p_title_norm in j_title_norm or j_title_norm in p_title_norm:
                    trade_match = True
            
            # DEBUG LOG
            if 'security' in p_title_norm:
                 logging.info(f"MATCH DEBUG: Profile={p_title_norm} Job={j_title_norm} TradeMatch={trade_match} Raw={raw_score}")

            # Logic: If profile's primary trade == job's primary trade
            # That match MUST rank higher. Even if another job pays slightly more.
            # We apply a strict multiplier (BOOST) for trade match
            
            if trade_match:
                raw_score *= 1.5 # Massive boost for correct role
                raw_score = min(0.99, raw_score) # Cap at 0.99
            else:
                # Penalize mismatched trades significantly to prevent "Warehouse > Security" nonsense
                # Unless it's a generic "Helper" role
                if 'helper' not in p_title_norm and 'helper' not in j_title_norm:
                     raw_score *= 0.6
            
            # --- EXISTING GATES ---
            
            # 🔒 STRICT SKILL GATE (User Requirement)
            # If skills don't match (score <= 0.15), tank the overall score.
            # Design Job (0.6) -> becomes 0.3 (Success)
            # score index 0 is skills. BUT weights changed!
            # We use the raw skill score for the gate logic.
            skill_component_score = scores[0] 
            skill_weight = weights['skills']
            
            # If weighted skill contribution is low relative to the weight itself
            # i.e. (score * weight) <= (0.15 * weight)
            if skill_component_score <= (0.15 * skill_weight):
                 raw_score *= 0.5
                 
            # 🔒 STRICT LOCATION GATE (Requirement Density Logic)
            # For Low Density jobs (Delivery, etc), Location is NON-NEGOTIABLE.
            # If density is low and location score is not perfect (mismatch), KILL the score.
            # score index 3 is location
            location_component_score = scores[3]
            location_weight = weights['location']
            
            if density <= 2.5:
                # If they didn't get full location points (meaning mismatch or weak match)
                if location_component_score < (0.9 * location_weight):
                    raw_score *= 0.1 # "Can you be here?" -> NO -> Score 0.07

            # Micro-variation check
            # hash_input = f"{hash(str(safe_p))}:{hash(str(safe_j))}" # Non-deterministic
            
            return min(1.0, max(0.0, raw_score + 0.0001))
            
        except Exception as e:
            logging.error(f"Apex Calc Error: {e}")
            return 0.5


# =============================================================================
# MATCH ADAPTER (API LAYER)
# =============================================================================

async def match_jobs_for_profile(profile_id: str, user_id: str) -> List[Dict]:
    """
    Adapter to expose Apex Algorithm to the existing jobs API.
    """
    if not get_db:
        return []

    db = get_db()
    
    # 1. Fetch Profile
    try:
        profile = await db["profiles"].find_one({"_id": ObjectId(profile_id)})
    except:
        return []
        
    if not profile:
        return []

    # 2. Fetch Active Jobs
    jobs = await db["jobs"].find({"status": "active"}).to_list(1000)

    # 3. Apply Apex Algorithm
    matcher = ApexSynthesisMatcher()
    results = []

    for job in jobs:
        # Use the new synthesis method
        score = matcher.calculate_composite_score(profile, job)

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

    # 4. Filter & Sort
    MIN_MATCH_THRESHOLD = 0.40  # Reasonable cutoff

    filtered_results = [
        r for r in results 
        if r["match_score"] >= MIN_MATCH_THRESHOLD
    ]

    filtered_results.sort(key=lambda x: x["match_score"], reverse=True)
    return filtered_results[:50]