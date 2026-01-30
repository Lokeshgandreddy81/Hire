from typing import Dict, List
from bson import ObjectId
from bson.errors import InvalidId
from app.db.mongo import get_db
import math

async def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two coordinates in km (Haversine formula)"""
    R = 6371  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    return R * c

async def apply_hard_gates(profile: Dict, job: Dict) -> tuple:
    """
    Apply hard gates to filter jobs.
    Returns (passed, reason_if_failed)
    """
    # Gate 1: License/Registration Requirement
    if job.get("license_required", False):
        user_licenses = profile.get("licenses_certifications", [])
        if not user_licenses:
            return False, "License required but not provided"
    
    # Gate 2: Commute/Proximity (100km limit)
    if not job.get("remote", False):
        profile_location = profile.get("location", {})
        job_location = job.get("location", {})
        
        if isinstance(profile_location, dict) and isinstance(job_location, dict):
            profile_lat = profile_location.get("lat")
            profile_lon = profile_location.get("lon")
            job_lat = job_location.get("lat")
            job_lon = job_location.get("lon")
            
            if all([profile_lat, profile_lon, job_lat, job_lon]):
                distance = await calculate_distance(profile_lat, profile_lon, job_lat, job_lon)
                if distance > 100:
                    return False, f"Distance {distance:.1f}km exceeds 100km limit"
    
    # Gate 3: Shift Compatibility
    if job.get("shift_type") == "night":
        if not profile.get("prefers_night_shift", False):
            return False, "Night shift required but user doesn't prefer it"
    
    return True, "Passed"

async def calculate_composite_score(profile: Dict, job: Dict) -> float:
    """
    Calculate composite match score.
    Components:
    - Salary: 15%
    - Skills: 35%
    - Experience: 30%
    - Location: 10%
    - Education: 10%
    """
    # Component 1: Salary (15%)
    salary_score = 1.0
    if job.get("salary_range"):
        job_salary = job["salary_range"].get("max", 0) if isinstance(job["salary_range"], dict) else 0
        user_expectation = profile.get("salary_expectations", 0)
        if isinstance(user_expectation, str):
            # Try to extract number
            import re
            nums = re.findall(r'\d+', user_expectation)
            user_expectation = int(nums[0]) if nums else 0
        
        if job_salary > 0 and user_expectation > 0:
            salary_score = min(1.0, user_expectation / job_salary)
    
    # Component 2: Skills (35%)
    profile_skills = set(profile.get("skills", []))
    job_skills = set(job.get("required_skills", []))
    
    if len(job_skills) == 0:
        skills_score = 0.5  # Neutral if no skills specified
    else:
        matching_skills = len(profile_skills.intersection(job_skills))
        skills_score = matching_skills / len(job_skills)
    
    # Component 3: Experience (30%)
    job_exp_required = job.get("experience_required", 0)
    user_exp = profile.get("experience_years", 0)
    
    if job_exp_required == 0:
        experience_score = 1.0
    else:
        experience_score = min(1.0, user_exp / job_exp_required)
    
    # Component 4: Location (10%)
    location_score = 1.0
    if job.get("remote", False) and profile.get("remote_work_preference", False):
        location_score = 1.0
    elif not job.get("remote", False):
        # Proximity bonus (simplified)
        location_score = 0.8
    
    # Component 5: Education (10%) - simplified
    education_score = 0.8  # Default neutral
    
    # Composite formula
    composite_score = (
        salary_score * 0.15 +
        skills_score * 0.35 +
        experience_score * 0.30 +
        location_score * 0.10 +
        education_score * 0.10
    )
    
    return composite_score

async def match_jobs_for_profile(profile_id: str, user_id: str) -> List[Dict]:
    """
    Main matching algorithm:
    1. Query active jobs
    2. Apply hard gates
    3. Calculate composite scores
    4. Filter by threshold (0.62)
    5. Sort and limit to 20
    """
    db = get_db()
    
    # Get profile (profile_id is string from API; MongoDB _id is ObjectId)
    try:
        profile_oid = ObjectId(profile_id)
    except InvalidId:
        return []
    profile = await db["profiles"].find_one({"_id": profile_oid})
    if not profile:
        return []
    
    # Query active jobs
    jobs = await db["jobs"].find({"status": "active"}).to_list(2000)
    
    results = []
    
    for job in jobs:
        # Apply hard gates
        passed, reason = await apply_hard_gates(profile, job)
        if not passed:
            continue
        
        # Calculate composite score
        score = await calculate_composite_score(profile, job)
        
        # Apply threshold (0.62)
        if score >= 0.62:
            job["_id"] = str(job["_id"])
            job["id"] = job["_id"]
            job["match_score"] = score
            job["match_percentage"] = int(score * 100)
            results.append(job)
    
    # Sort by score descending
    results.sort(key=lambda x: x["match_score"], reverse=True)
    
    # Limit to 20
    results = results[:20]
    
    # Store in cache (simplified - in production use Redis)
    cache_key = f"matches:{user_id}:{profile_id}"
    # In production: await redis.setex(cache_key, 3600, json.dumps(results))
    
    return results
