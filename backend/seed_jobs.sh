#!/bin/bash
# Job Seeding Script - 20 realistic jobs via direct API calls

API_BASE="http://192.168.1.123:8000/api/v1"

echo "🚀 Job Seeding Process Started"
echo "================================"

# Step 1: Login as employer
echo ""
echo "1️⃣ Logging in as employer..."
curl -s -X POST "$API_BASE/auth/send-otp" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"employer@hire.com","role":"employer"}' > /dev/null

TOKEN=$(curl -s -X POST "$API_BASE/auth/verify-otp" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"employer@hire.com","otp":"0000","role":"employer"}' | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

echo "✅ Logged in successfully"

# Function to create job
create_job() {
  local num=$1
  local title=$2
  local description=$3
  local location=$4
  local salary=$5
  local skills=$6
  
  echo "   Creating $num/20: $title..." 
  
  curl -s -X POST "$API_BASE/jobs/" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"title\": \"$title\",
      \"description\": \"$description\",
      \"location\": \"$location\",
      \"salary_range\": \"$salary\",
      \"skills\": $skills
    }" > /dev/null
  
  echo "   ✅ Created"
  sleep 0.3
}

echo ""
echo "2️⃣ Creating 20 jobs..."

# WHITE-COLLAR (6)
create_job 1 "React Developer" "Need someone who knows React and TypeScript. Must have worked on at least 2-3 projects. Redux is a plus. Remote work but need to be available during IST hours." "Bangalore" "₹6-10 LPA" '["React","TypeScript","JavaScript","Redux"]'

create_job 2 "Operations Manager" "Looking for someone to manage day-to-day operations. Experience in logistics or supply chain preferred. Should be good with Excel and reports. 6 day week." "Mumbai" "₹4-7 LPA" '["Operations","Excel","Logistics","Management"]'

create_job 3 "Digital Marketing Executive" "Run our social media pages and Google ads. Need someone creative who understands Instagram and Facebook marketing. 1-2 years experience needed." "Delhi" "₹3-5 LPA" '["Digital Marketing","Social Media","Google Ads","SEO"]'

create_job 4 "Python Backend Engineer" "Building APIs with FastAPI/Django. Knowledge of PostgreSQL and basic devops. 2+ years exp. Work from office in Hyderabad." "Hyderabad" "₹7-12 LPA" '["Python","FastAPI","PostgreSQL","APIs"]'

create_job 5 "HR Recruiter" "Hiring for IT roles. Should know how to screen candidates, coordinate interviews. Good communication skills required. Female candidates preferred." "Pune" "₹3-4 LPA" '["Recruitment","HR","Communication"]'

create_job 6 "Accounts Assistant" "Tally ERP knowledge must. Handle day to day accounting, GST filing, invoicing. Commerce graduate. Immediate joining." "Chennai" "₹2.5-3.5 LPA" '["Tally","Accounting","GST","Excel"]'

# BLUE-COLLAR (6)
create_job 7 "Delivery Boy" "Deliver parcels in local area. Own bike required. Petrol allowance given. Daily target 30-40 deliveries. Morning 8 to evening 8." "Bangalore" "₹15,000-18,000/month" '["Driving","Bike License"]'

create_job 8 "Security Guard" "12 hour duty. Night shift available. Ex-serviceman preferred. Accommodation provided. Should be alert and fit." "Gurgaon" "₹12,000-14,000/month" '["Security","Alert"]'

create_job 9 "Construction Helper" "Work at building site. Carry materials, help masons, cleaning. Hard work. Daily wages or monthly both okay. Food included." "Mumbai" "₹400-500/day" '["Physical Work","Construction"]'

create_job 10 "Electrician" "Residential and commercial wiring work. Should know MCB, DB, all electrical fittings. Own tools preferred. Per visit payment." "Pune" "₹500-800/visit" '["Electrical Work","Wiring","MCB"]'

create_job 11 "Office Boy" "Tea coffee making, cleaning office, photocopying, small errands. Should be neat and well-behaved. 10am to 7pm." "Delhi" "₹10,000-12,000/month" '["Office Support","Cleaning"]'

create_job 12 "Driver cum Helper" "Driving LCV vehicle + help in loading unloading. Valid DL must. Know Bangalore roads well. Salary negotiable based on experience." "Bangalore" "₹18,000-22,000/month" '["Driving","LCV License","Loading"]'

# RETAIL / KIRANA (4)
create_job 13 "Shop Assistant" "Help customers, billing, stock arranging. Grocery store in Jayanagar. 10am-9pm with break. Sunday half day. Hindi/Kannada must." "Bangalore" "₹12,000-15,000/month" '["Billing","Customer Service","Hindi"]'

create_job 14 "Kirana Store Staff" "Weighing grains, packing, home delivery. Should know how to use digital weighing machine. Cycle provided for delivery nearby." "Indore" "₹10,000-12,000/month" '["Retail","Billing","Cycling"]'

create_job 15 "Mobile Shop Salesman" "Sell phones, explain features, handle customer queries. Commission on sales. Knowledge of Samsung, Xiaomi, Realme models required." "Jaipur" "₹12,000 + incentive" '["Sales","Mobile Knowledge","Communication"]'

create_job 16 "Cashier - Supermarket" "Billing counter work. Must know POS machine. Fast at counting cash. Day shift or night shift available. Experience in retail preferred." "Hyderabad" "₹13,000-16,000/month" '["Cashier","POS","Billing"]'

# SERVICE (4)
create_job 17 "Cook - Tiffin Service" "Make 50-60 tiffins daily. South Indian + North Indian both. Early morning 5am start. Sunday off. Food habits - pure veg cooking only." "Mumbai" "₹15,000-18,000/month" '["Cooking","South Indian","North Indian"]'

create_job 18 "Hotel Room Boy" "Cleaning rooms, changing sheets, room service. 8 hour shift. Tips extra. Should be presentable and polite with guests." "Goa" "₹10,000-13,000/month" '["Housekeeping","Cleaning","Service"]'

create_job 19 "Salon Assistant (Male)" "Hair cutting, shaving, face massage. Training will be given if you know basics. Should have worked in salon before for 6 months minimum." "Bangalore" "₹12,000-15,000/month" '["Hair Cutting","Salon Work"]'

create_job 20 "AC Technician" "Service and repair all brands AC. Gas filling, copper piping, electrical knowledge. Own tools and vehicle required. Service calls across city." "Delhi" "₹20,000-30,000/month" '["AC Repair","Electrical","Refrigeration"]'

echo ""
echo "================================"
echo "✅ JOB SEEDING COMPLETE"
echo ""
echo "CREATED JOBS:"
echo "1. React Developer - White-collar"
echo "2. Operations Manager - White-collar"
echo "3. Digital Marketing Executive - White-collar"
echo "4. Python Backend Engineer - White-collar"
echo "5. HR Recruiter - White-collar"
echo "6. Accounts Assistant - White-collar"
echo "7. Delivery Boy - Blue-collar"
echo "8. Security Guard - Blue-collar"
echo "9. Construction Helper - Blue-collar"
echo "10. Electrician - Blue-collar"
echo "11. Office Boy - Blue-collar"
echo "12. Driver cum Helper - Blue-collar"
echo "13. Shop Assistant - Retail"
echo "14. Kirana Store Staff - Retail"
echo "15. Mobile Shop Salesman - Retail"
echo "16. Cashier - Supermarket - Retail"
echo "17. Cook - Tiffin Service - Service"
echo "18. Hotel Room Boy - Service"
echo "19. Salon Assistant (Male) - Service"
echo "20. AC Technician - Service"
