#!/usr/bin/env python3
"""
Data Seeding Script - 20 Realistic Jobs
Populate database with diverse job postings for blind testing
"""

import requests
import json
import time

BASE_URL = "http://192.168.1.123:8000/api/v1"

# Placeholder employer token - will need actual login
EMPLOYER_TOKEN = None

def login_employer():
    """Login as employer to get auth token"""
    # Send OTP
    response = requests.post(f"{BASE_URL}/auth/send-otp", json={
        "identifier": "lokeshgandreddy81@gmail.com"
    })
    print("✅ OTP sent")
    
    # Verify with dev bypass
    response = requests.post(f"{BASE_URL}/auth/verify-otp", json={
        "identifier": "lokeshgandreddy81@gmail.com",
        "otp": "0000"
    })
    
    data = response.json()
    return data["access_token"]

def create_job(token, job_data):
    """Create a single job posting"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(
        f"{BASE_URL}/jobs",
        headers=headers,
        json=job_data
    )
    if response.status_code == 201:
        return response.json()
    else:
        print(f"❌ Failed: {job_data['title']} - {response.text}")
        return None

# 20 REALISTIC JOBS
JOBS = [
    # WHITE-COLLAR (6)
    {
        "title": "React Developer",
        "description": "Need someone who knows React and TypeScript. Must have worked on at least 2-3 projects. Redux is a plus. Remote work but need to be available during IST hours.",
        "location": "Bangalore",
        "salary_range": "₹6-10 LPA",
        "skills": ["React", "TypeScript", "JavaScript", "Redux"]
    },
    {
        "title": "Operations Manager",
        "description": "Looking for someone to manage day-to-day operations. Experience in logistics or supply chain preferred. Should be good with Excel and reports. 6 day week.",
        "location": "Mumbai",
        "salary_range": "₹4-7 LPA",
        "skills": ["Operations", "Excel", "Logistics", "Management"]
    },
    {
        "title": "Digital Marketing Executive",
        "description": "Run our social media pages and Google ads. Need someone creative who understands Instagram and Facebook marketing. 1-2 years experience needed.",
        "location": "Delhi",
        "salary_range": "₹3-5 LPA",
        "skills": ["Digital Marketing", "Social Media", "Google Ads", "SEO"]
    },
    {
        "title": "Python Backend Engineer",
        "description": "Building APIs with FastAPI/Django. Knowledge of PostgreSQL and basic devops. 2+ years exp. Work from office in Hyderabad.",
        "location": "Hyderabad",
        "salary_range": "₹7-12 LPA",
        "skills": ["Python", "FastAPI", "PostgreSQL", "APIs"]
    },
    {
        "title": "HR Recruiter",
        "description": "Hiring for IT roles. Should know how to screen candidates, coordinate interviews. Good communication skills required. Female candidates preferred.",
        "location": "Pune",
        "salary_range": "₹3-4 LPA",
        "skills": ["Recruitment", "HR", "Communication"]
    },
    {
        "title": "Accounts Assistant",
        "description": "Tally ERP knowledge must. Handle day to day accounting, GST filing, invoicing. Commerce graduate. Immediate joining.",
        "location": "Chennai",
        "salary_range": "₹2.5-3.5 LPA",
        "skills": ["Tally", "Accounting", "GST", "Excel"]
    },
    
    # BLUE-COLLAR (6)
    {
        "title": "Delivery Boy",
        "description": "Deliver parcels in local area. Own bike required. Petrol allowance given. Daily target 30-40 deliveries. Morning 8 to evening 8.",
        "location": "Bangalore",
        "salary_range": "₹15,000-18,000/month",
        "skills": ["Driving", "Bike License"]
    },
    {
        "title": "Security Guard",
        "description": "12 hour duty. Night shift available. Ex-serviceman preferred. Accommodation provided. Should be alert and fit.",
        "location": "Gurgaon",
        "salary_range": "₹12,000-14,000/month",
        "skills": ["Security", "Alert"]
    },
    {
        "title": "Construction Helper",
        "description": "Work at building site. Carry materials, help masons, cleaning. Hard work. Daily wages or monthly both okay. Food included.",
        "location": "Mumbai",
        "salary_range": "₹400-500/day",
        "skills": ["Physical Work", "Construction"]
    },
    {
        "title": "Electrician",
        "description": "Residential and commercial wiring work. Should know MCB, DB, all electrical fittings. Own tools preferred. Per visit payment.",
        "location": "Pune",
        "salary_range": "₹500-800/visit",
        "skills": ["Electrical Work", "Wiring", "MCB"]
    },
    {
        "title": "Office Boy",
        "description": "Tea coffee making, cleaning office, photocopying, small errands. Should be neat and well-behaved. 10am to 7pm.",
        "location": "Delhi",
        "salary_range": "₹10,000-12,000/month",
        "skills": ["Office Support", "Cleaning"]
    },
    {
        "title": "Driver cum Helper",
        "description": "Driving LCV vehicle + help in loading unloading. Valid DL must. Know Bangalore roads well. Salary negotiable based on experience.",
        "location": "Bangalore",
        "salary_range": "₹18,000-22,000/month",
        "skills": ["Driving", "LCV License", "Loading"]
    },
    
    # RETAIL / KIRANA (4)
    {
        "title": "Shop Assistant",
        "description": "Help customers, billing, stock arranging. Grocery store in Jayanagar. 10am-9pm with break. Sunday half day. Hindi/Kannada must.",
        "location": "Bangalore",
        "salary_range": "₹12,000-15,000/month",
        "skills": ["Billing", "Customer Service", "Hindi"]
    },
    {
        "title": "Kirana Store Staff",
        "description": "Weighing grains, packing, home delivery. Should know how to use digital weighing machine. Cycle provided for delivery nearby.",
        "location": "Indore",
        "salary_range": "₹10,000-12,000/month",
        "skills": ["Retail", "Billing", "Cycling"]
    },
    {
        "title": "Mobile Shop Salesman",
        "description": "Sell phones, explain features, handle customer queries. Commission on sales. Knowledge of Samsung, Xiaomi, Realme models required.",
        "location": "Jaipur",
        "salary_range": "₹12,000 + incentive",
        "skills": ["Sales", "Mobile Knowledge", "Communication"]
    },
    {
        "title": "Cashier - Supermarket",
        "description": "Billing counter work. Must know POS machine. Fast at counting cash. Day shift or night shift available. Experience in retail preferred.",
        "location": "Hyderabad",
        "salary_range": "₹13,000-16,000/month",
        "skills": ["Cashier", "POS", "Billing"]
    },
    
    # SERVICE (4)
    {
        "title": "Cook - Tiffin Service",
        "description": "Make 50-60 tiffins daily. South Indian + North Indian both. Early morning 5am start. Sunday off. Food habits - pure veg cooking only.",
        "location": "Mumbai",
        "salary_range": "₹15,000-18,000/month",
        "skills": ["Cooking", "South Indian", "North Indian"]
    },
    {
        "title": "Hotel Room Boy",
        "description": "Cleaning rooms, changing sheets, room service. 8 hour shift. Tips extra. Should be presentable and polite with guests.",
        "location": "Goa",
        "salary_range": "₹10,000-13,000/month",
        "skills": ["Housekeeping", "Cleaning", "Service"]
    },
    {
        "title": "Salon Assistant (Male)",
        "description": "Hair cutting, shaving, face massage. Training will be given if you know basics. Should have worked in salon before for 6 months minimum.",
        "location": "Bangalore",
        "salary_range": "₹12,000-15,000/month",
        "skills": ["Hair Cutting", "Salon Work"]
    },
    {
        "title": "AC Technician",
        "description": "Service and repair all brands AC. Gas filling, copper piping, electrical knowledge. Own tools and vehicle required. Service calls across city.",
        "location": "Delhi",
        "salary_range": "₹20,000-30,000/month",
        "skills": ["AC Repair", "Electrical", "Refrigeration"]
    },
]

def main():
    print("🚀 Starting Job Seeding Process...")
    print("=" * 50)
    
    # Login
    print("\n1️⃣ Logging in as employer...")
    token = login_employer()
    print(f"✅ Logged in successfully\n")
    
    # Create all jobs
    print("2️⃣ Creating 20 jobs...")
    created_jobs = []
    
    for i, job in enumerate(JOBS, 1):
        print(f"   Creating {i}/20: {job['title']}...", end=" ")
        result = create_job(token, job)
        if result:
            created_jobs.append({
                "number": i,
                "title": job["title"],
                "category": get_category(i)
            })
            print("✅")
        time.sleep(0.3)  # Rate limiting
    
    print("\n" + "=" * 50)
    print("✅ JOB SEEDING COMPLETE\n")
    
    # Output required format
    for job in created_jobs:
        category = job["category"]
        print(f"{job['number']}. {job['title']} - {category}")

def get_category(index):
    """Map job index to category"""
    if index <= 6:
        return "White-collar"
    elif index <= 12:
        return "Blue-collar"
    elif index <= 16:
        return "Retail"
    else:
        return "Service"

if __name__ == "__main__":
    main()
