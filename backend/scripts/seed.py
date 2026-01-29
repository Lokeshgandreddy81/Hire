from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.core import User, Employer, Job, JobSeekerProfile
from app.models.workflow import Application, ApplicationState
from app.models.matching import MatchRun, MatchLog
from datetime import datetime

def seed_db():
    db = SessionLocal()
    
    # Check if data exists
    if db.query(User).first():
        print("Data already exists. Skipping seed.")
        return

    # Create Users
    employee_user = User(
        email="rajesh@example.com",
        hashed_password="hashed_secret",
        full_name="Rajesh Kumar",
        user_type="EMPLOYEE",
        is_active=True
    )
    employer_user = User(
        email="sarah@logitech.com",
        hashed_password="hashed_secret",
        full_name="Sarah Jenkins",
        user_type="EMPLOYER",
        is_active=True
    )
    db.add(employee_user)
    db.add(employer_user)
    db.commit()

    # Create Employer Profile
    employer_profile = Employer(
        user_id=employer_user.id,
        company_name="LogiTech Solutions",
        company_size="100-500",
        industry="Logistics"
    )
    db.add(employer_profile)
    db.commit()

    # Create Job Seeker Profile
    seeker_profile = JobSeekerProfile(
        user_id=employee_user.id,
        headline="Heavy Driver",
        summary="10 years of experience driving heavy trucks across South India.",
        experience_years=10,
        current_role="Senior Driver",
        location="Hyderabad",
        profile_version=1
    )
    db.add(seeker_profile)
    db.commit()

    # Create Jobs
    job1 = Job(
        employer_id=employer_profile.id,
        title="Heavy Vehicle Driver",
        description="Looking for experienced heavy vehicle drivers for inter-city logistics.",
        requirements="Heavy License, Night Shift, Route Knowledge",
        location="Hyderabad",
        salary_min=25000,
        salary_max=30000,
        experience_required=5,
        employment_type="Full-time"
    )
    job2 = Job(
        employer_id=employer_profile.id,
        title="Warehouse Supervisor",
        description="Manage incoming inventory and supervise loading dock staff.",
        requirements="Team Management, Inventory, Excel",
        location="Secunderabad",
        salary_min=35000,
        salary_max=35000,
        experience_required=3,
        employment_type="Full-time"
    )
    db.add(job1)
    db.add(job2)
    db.commit()

    # Create Application
    app1 = Application(
        job_id=job1.id,
        profile_id=seeker_profile.id,
        state=ApplicationState.INTERVIEW,
        cover_letter="I am interested.",
        submitted_at=datetime.utcnow()
    )
    db.add(app1)
    db.commit()

    print("Database seeded successfully!")
    db.close()

if __name__ == "__main__":
    seed_db()
