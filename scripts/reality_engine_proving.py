
import requests
import json
import time

# CONFIG
API_URL = "http://localhost:8000/api/v1"
OTP_CODE = "123456"

# ... (DATA REMAINS SAME, just imports and functions change)

# =============================================================================
# DATA SEEDING - JOBS (15 Real-World Roles)
# =============================================================================
JOBS_DATA = [
    # --- BLUE COLLAR / LOCAL ---
    {
        "title": "Delivery Driver (Bike)",
        "company": "Swiggy Instamart",
        "location": "Indiranagar, Bangalore",
        "minSalary": 20000,
        "maxSalary": 25000,
        "skills": ["Two-wheeler", "License", "Navigation"],
        "experience_required": 0,
        "description": "Deliver groceries within 10 mins. Must have own bike and DL. Shift: 6pm - 2am."
    },
    {
        "title": "Warehouse Picker / Packer",
        "company": "Amazon FLX",
        "location": "Whitefield, Bangalore",
        "minSalary": 18000,
        "maxSalary": 22000,
        "skills": ["Packing", "Heavy Lifting", "Night Shift"],
        "experience_required": 0,
        "description": "Pick and pack items for dispatch. transport provided. Night shift allowance extra."
    },
    {
        "title": "Construction Helper",
        "company": "L&T Construction",
        "location": "Hebbal, Bangalore",
        "minSalary": 15000,
        "maxSalary": 18000,
        "skills": ["Physical Labor", "Safety Awareness"],
        "experience_required": 1,
        "description": "Assist masons and move materials. Day shift only. Helmet provided."
    },
    {
        "title": "Electrician",
        "company": "Urban Company",
        "location": "Koramangala, Bangalore",
        "minSalary": 30000,
        "maxSalary": 40000,
        "skills": ["Wiring", "Electrical Repair", "Safety Certified"],
        "experience_required": 3,
        "description": "Visit customer homes for repairs. Must have own tools and bike."
    },
    {
        "title": "Security Guard",
        "company": "SIS Security",
        "location": "Electronic City, Bangalore",
        "minSalary": 16000,
        "maxSalary": 19000,
        "skills": ["Security", "Gate Management", "Night Shift"],
        "experience_required": 1,
        "description": "Gate duty for IT park. 12 hour shift. Uniform provided."
    },
    {
        "title": "Salon Worker (Unisex)",
        "company": "Looks Salon",
        "location": "Jayanagar, Bangalore",
        "minSalary": 22000,
        "maxSalary": 28000,
        "skills": ["Hair Cutting", "Shaving", "Customer Service"],
        "experience_required": 2,
        "description": "Experienced barber/stylist needed. Commission on products extra."
    },
    {
        "title": "Restaurant Cook (South Indian)",
        "company": "Rameshwaram Cafe",
        "location": "Indiranagar, Bangalore",
        "minSalary": 28000,
        "maxSalary": 35000,
        "skills": ["Cooking", "South Indian Cuisine", "High Volume"],
        "experience_required": 5,
        "description": "Head cook for dosa station. Must handle morning rush."
    },
    {
        "title": "Retail Sales Associate",
        "company": "ZARA",
        "location": "Brigade Road, Bangalore",
        "minSalary": 25000,
        "maxSalary": 30000,
        "skills": ["Sales", "English", "Fashion"],
        "experience_required": 1,
        "description": "Assist customers and manage inventory. Good grooming mandatory."
    },
    {
        "title": "Driver + Loader",
        "company": "Porter",
        "location": "HSR Layout, Bangalore",
        "minSalary": 22000,
        "maxSalary": 26000,
        "skills": ["Driving", "Loading", "Heavy Lifting"],
        "experience_required": 2,
        "description": "Drive Tata Ace and help load/unload goods. Intra-city trips."
    },
    
    # --- WHITE COLLAR / REMOTE / HYBRID ---
    {
        "title": "Graphic Designer (Freelance)",
        "company": "Creative Studio",
        "location": "Remote",
        "minSalary": 40000,
        "maxSalary": 60000,
        "skills": ["Photoshop", "Illustrator", "Social Media"],
        "experience_required": 2,
        "description": "Design social media posts for brands. Portfolio required."
    },
    {
        "title": "Video Editor",
        "company": "YouTuber Team",
        "location": "Remote",
        "minSalary": 35000,
        "maxSalary": 50000,
        "skills": ["Premiere Pro", "After Effects", "YouTube"],
        "experience_required": 2,
        "description": "Edit 2 vlogs per week. Fast turnaround needed."
    },
    {
        "title": "Social Media Manager",
        "company": "Startup Inc",
        "location": "Koramangala, Bangalore",
        "minSalary": 30000,
        "maxSalary": 40000,
        "skills": ["Instagram", "Copywriting", "Marketing"],
        "experience_required": 1,
        "description": "Manage IG and LinkedIn. Hybrid role (3 days office)."
    },
    {
        "title": "Backend Engineer",
        "company": "Tech Unicorn",
        "location": "Remote",
        "minSalary": 100000,
        "maxSalary": 150000,
        "skills": ["Python", "FastAPI", "MongoDB", "AWS"],
        "experience_required": 4,
        "description": "Scale our API. Must have system design experience."
    },
    {
        "title": "Data Analyst",
        "company": "Fintech Corp",
        "location": "Bellandur, Bangalore",
        "minSalary": 60000,
        "maxSalary": 80000,
        "skills": ["SQL", "Excel", "Tableau"],
        "experience_required": 2,
        "description": "Analyze transaction data. Day shift."
    },
    {
        "title": "Operations Manager",
        "company": "Logistics Cohort",
        "location": "Peenya, Bangalore",
        "minSalary": 50000,
        "maxSalary": 70000,
        "skills": ["Logistics", "Team Management", "Kannada"],
        "experience_required": 5,
        "description": "Manage fleet of 50 drivers. Must verify routes."
    }
]

# =============================================================================
# DATA SEEDING - PROFILES (20 Real-World Humans)
# =============================================================================
PROFILES_DATA = [
    # 1. Perfect Match (Driver)
    {"role": "Delivery Partner", "location": "Indiranagar, Bangalore", "exp": 2, "pay": "20000", "skills": ["Two-wheeler", "License", "English"], "desc": "I deliver fast. Have my own bike."},
    # 2. Wrong Location (Driver)
    {"role": "Delivery Partner", "location": "Mysore", "exp": 5, "pay": "20000", "skills": ["Two-wheeler", "License"], "desc": "Willing to relocate if accommodation provided."},
    # 3. Pay too high (Driver)
    {"role": "Delivery Partner", "location": "Indiranagar, Bangalore", "exp": 10, "pay": "40000", "skills": ["Two-wheeler", "License"], "desc": "Senior driver with 10 years exp."},
    # 4. Skilled but Uncertified (Electrician)
    {"role": "Electrician", "location": "Koramangala, Bangalore", "exp": 5, "pay": "30000", "skills": ["Wiring", "Repair"], "desc": "Learned from father. No certificate."},
    # 5. Perfect Match (Warehouse)
    {"role": "Warehouse Helper", "location": "Whitefield, Bangalore", "exp": 0, "pay": "18000", "skills": ["Heavy Lifting", "Night Shift"], "desc": "Fresher ready for any work."},
    # 6. Mismatch (Cook trying for Driver)
    {"role": "Driver", "location": "Indiranagar, Bangalore", "exp": 0, "pay": "20000", "skills": ["Cooking", "Chopping"], "desc": "I want to switch to driving but no license yet."},
    # 7. Overqualified (Engineer applying for Data Entry)
    {"role": "Data Entry", "location": "Remote", "exp": 4, "pay": "20000", "skills": ["Python", "SQL", "Excel"], "desc": "Need side income. Engineer by day."},
    # 8. Underqualified (Fresher for Senior Ops)
    {"role": "Operations Manager", "location": "Peenya, Bangalore", "exp": 0, "pay": "50000", "skills": ["Management"], "desc": "MBA fresher looking for manager role."},
    # 9. Remote Only (Graphic Designer)
    {"role": "Graphic Designer", "location": "Remote", "exp": 3, "pay": "45000", "skills": ["Photoshop", "Illustrator"], "desc": "Freelancer. Cannot come to office."},
    # 10. Hybrid OK (Social Media)
    {"role": "Social Media Manager", "location": "Koramangala, Bangalore", "exp": 2, "pay": "35000", "skills": ["Instagram", "Content"], "desc": "Can come to office 3 days."},
    # 11. Tech Bro (Backend)
    {"role": "Backend Engineer", "location": "Remote", "exp": 5, "pay": "140000", "skills": ["Python", "FastAPI", "AWS", "Docker"], "desc": "Full stack exp."},
    # 12. Security Guard (Night Shift only)
    {"role": "Security Guard", "location": "Electronic City, Bangalore", "exp": 2, "pay": "16000", "skills": ["Security", "Night Shift"], "desc": "Night shift preferred."},
    # 13. Retail (Fashion)
    {"role": "Sales Staff", "location": "Brigade Road, Bangalore", "exp": 1, "pay": "26000", "skills": ["Sales", "English", "Fashion"], "desc": "Worked at H&M before."},
    # 14. Construction (Helper)
    {"role": "Helper", "location": "Hebbal, Bangalore", "exp": 5, "pay": "16000", "skills": ["Physical Labor"], "desc": "Hard working."},
    # 15. Salon (Stylist)
    {"role": "Hair Stylist", "location": "Jayanagar, Bangalore", "exp": 3, "pay": "25000", "skills": ["Hair Cutting", "Coloring"], "desc": "Certified from L'Oreal."},
    # 16. Wrong Skill (Java dev applying for Python)
    {"role": "Backend Engineer", "location": "Remote", "exp": 4, "pay": "100000", "skills": ["Java", "Spring Boot"], "desc": "Willing to learn Python."},
    # 17. The "Anything" Guy
    {"role": "Helper", "location": "Bangalore", "exp": 0, "pay": "15000", "skills": ["Driving", "Painting", "Cooking", "Cleaning"], "desc": "Will do any job."},
    # 18. High Expectations (Fresher)
    {"role": "Video Editor", "location": "Remote", "exp": 0, "pay": "60000", "skills": ["Premiere Pro"], "desc": "Just finished course. Need high pay."},
    # 19. The "Ghost" (Empty Profile)
    {"role": "Driver", "location": "Bangalore", "exp": 0, "pay": "20000", "skills": [], "desc": ""},
    # 20. The Perfect Match (Cook)
    {"role": "South Indian Cook", "location": "Indiranagar, Bangalore", "exp": 6, "pay": "30000", "skills": ["Cooking", "Dosa", "Idli"], "desc": "Expert in Udupi style."}
]

def create_user(identifier, role):
    # 1. Send OTP
    requests.post(f"{API_URL}/auth/send-otp", json={"identifier": identifier, "role": role})
    # 2. Verify OTP
    res = requests.post(f"{API_URL}/auth/verify-otp", json={"identifier": identifier, "otp": OTP_CODE, "role": role})
    try:
        data = res.json()
        return data["access_token"]
    except Exception:
        print(f"Auth Failed for {identifier}: {res.text}")
        return None

def seed_jobs():
    print(f"🔹 Seeding {len(JOBS_DATA)} Jobs...")
    
    token = create_user("employer@hire.com", "employer")
    if not token:
        return
        
    headers = {"Authorization": f"Bearer {token}"}
    
    for job in JOBS_DATA:
        res = requests.post(f"{API_URL}/jobs/", json=job, headers=headers)
        if res.status_code != 200:
            print(f"❌ Failed to create job {job['title']}: {res.text}")
        else:
            print(f"✅ Created Job: {job['title']}")

def run_matching():
    # DEBUG: Only run specific profiles
    # 0=Delivery, 11=Security, 4=Warehouse
    debug_profiles = PROFILES_DATA # Run ALL profiles for final verification
    # debug_profiles = [PROFILES_DATA[0], PROFILES_DATA[11], PROFILES_DATA[4]]
    print(f"\n🔹 [GATEKEEPER RUN] Running Match Engine for {len(debug_profiles)} Profiles...\n")
    
    results = []

    for i, p in enumerate(debug_profiles):
        identifier = f"seeker_{i}@hire.com"
        
        # 1. Login
        token = create_user(identifier, "employee")
        if not token:
            continue
            
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Create Profile
        profile_payload = {
            "job_title": p["role"],
            "target_role": p["role"],
            "location": p["location"],
            "experience_years": p["exp"],
            "salary_expectations": p["pay"],
            "skills": p["skills"],
            "summary": p["desc"],
            "remote_work_preference": p["location"] == "Remote"
        }
        res = requests.post(f"{API_URL}/profiles/", json=profile_payload, headers=headers)
        if res.status_code != 200:
            # Maybe already exists, try to get it? No, we cleared DB.
            # But duplicate key check might fail if we re-run without clearing
            print(f"❌ Failed to create profile for {identifier}: {res.text}")
            
        # 3. Get Matches
        res = requests.get(f"{API_URL}/jobs/", headers=headers)
        if res.status_code == 200:
            matches = res.json()
        else:
            matches = []
        
        results.append({
            "seeker": f"{p['role']} ({p['location']})",
            "profile": p,
            "matches": matches
        })
        
        print(f"👤 {p['role']:<20} | Matches Found: {len(matches)}")

    return results

def print_report(results):
    print("\n" + "="*60)
    print("REALITY ENGINE PROVING REPORT".center(60))
    print("="*60 + "\n")
    
    for r in results:
        print(f"🧐 Seeker: {r['seeker']}")
        print(f"   Context: Exp {r['profile']['exp']}y | Pay {r['profile']['pay']} | Skills: {r['profile']['skills']}")
        
        if not r['matches']:
            print("   🚫 NO MATCHES FOUND (Correct if mismatched)")
        
        for m in r['matches'][:3]: # Top 3
            print(f"   ✅ {m['match_percentage']}% MATCH -> {m['title']} @ {m['company']}")
            
        print("-" * 40)

def main():
    seed_jobs()
    results = run_matching()
    print_report(results)

if __name__ == "__main__":
    main()
