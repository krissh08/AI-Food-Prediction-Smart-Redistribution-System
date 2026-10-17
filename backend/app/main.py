import os
import sys
import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

# Add root directory to python path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

try:
    from dotenv import load_dotenv
    load_dotenv()
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
except ImportError:
    pass

from backend.app.database.database import engine, Base, SessionLocal
from backend.app.database.migrations import run_migrations
from backend.app.models.models import (
    User,
    DonorProfile,
    AcceptorProfile,
    FoodListing,
    DonationRequest,
    Notification,
    Application
)
from backend.app.auth.auth import hash_password

from backend.app.api.routers import auth, donor, acceptor, ai, donations, matching, notifications, analytics, admin
from ml.prediction.predict import load_models

app = FastAPI(
    title="NourishSync — AI-Driven Food Surplus Prediction and Smart Redistribution System API",
    description="Production REST API powering AI surplus predictions, donor-acceptor workflows, smart matching, and DevOps monitoring.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(donor.router)
app.include_router(acceptor.router)
app.include_router(ai.router)
app.include_router(donations.router)
app.include_router(matching.router)
app.include_router(notifications.router)
app.include_router(analytics.router)
app.include_router(admin.router)

# Irreversible, one-way bcrypt cryptographic hash (12 salt rounds) for master administrator
DEFAULT_ADMIN_HASH = "$2b$12$zHzdD1NUD2eomjtlmrO.meA0MKyqBcXaDHUsTuUP2JlIfvzNQHebq"

def seed_admin_user(db: Session):
    admin_email = os.getenv("ADMIN_EMAIL", "admin@nourishsync.org").strip()
    env_password = os.getenv("ADMIN_PASSWORD")
    target_hash = hash_password(env_password.strip()) if env_password else DEFAULT_ADMIN_HASH

    existing_admin = db.query(User).filter(User.role == "admin").first()
    if not existing_admin:
        admin_user = User(
            name="System Administrator",
            email=admin_email,
            password_hash=target_hash,
            role="admin",
            phone="+1-555-0100",
            email_verified=True,
            approval_status="APPROVED",
            is_active=True
        )
        db.add(admin_user)
        db.commit()
        print(f"[SECURITY] Administrator account initialized: {admin_email}")
    else:
        existing_admin.password_hash = target_hash
        existing_admin.email = admin_email
        db.commit()
        print(f"[SECURITY] Administrator credentials synchronized: {admin_email}")

def seed_demo_data(db: Session):
    # Check if demo donor already exists
    if db.query(User).filter(User.email == "donor@demo.com").first():
        return

    print("Seeding initial demo donor & acceptor accounts with sample food listings...")

    # 1. Food Donor Account
    donor_user = User(
        name="Grand Palace Hotel & Canteen",
        email="donor@demo.com",
        password_hash=hash_password("password123"),
        role="donor",
        phone="+1-555-0144",
        email_verified=True,
        approval_status="APPROVED",
        is_active=True
    )
    db.add(donor_user)
    db.flush()

    donor_profile = DonorProfile(
        user_id=donor_user.id,
        organization_name="Grand Palace Hotel & Canteen",
        owner_name="Robert Vance",
        organization_type="Hotel",
        parent_institution="Vance Hospitality Group",
        address="104 Tech Park Avenue, Central Campus",
        city="Bengaluru",
        state="Karnataka",
        pin_code="560001",
        latitude=12.9716,
        longitude=77.5946
    )
    db.add(donor_profile)

    donor_app = Application(
        user_id=donor_user.id,
        application_type="donor",
        organization_name="Grand Palace Hotel & Canteen",
        organization_type="Hotel",
        contact_name="Robert Vance",
        status="APPROVED",
        submitted_at=datetime.datetime.utcnow(),
        reviewed_at=datetime.datetime.utcnow()
    )
    db.add(donor_app)

    # 2. Food Acceptor Account
    acceptor_user = User(
        name="Hope Community Food Bank",
        email="acceptor@demo.com",
        password_hash=hash_password("password123"),
        role="acceptor",
        phone="+1-555-0188",
        email_verified=True,
        approval_status="APPROVED",
        is_active=True
    )
    db.add(acceptor_user)
    db.flush()

    acceptor_profile = AcceptorProfile(
        user_id=acceptor_user.id,
        organization_name="Hope Community Food Bank",
        contact_person="Sarah Jenkins",
        organization_type="NGO",
        food_distribution_activities="Daily community soup kitchen and surplus food distribution to local shelters.",
        address="42 Community Street, Near City Park",
        city="Bengaluru",
        state="Karnataka",
        pin_code="560002",
        latitude=12.9816,
        longitude=77.6046,
        max_capacity=600,
        food_categories="Cooked Meals,Bakery,Packaged Food,Buffet Items",
        operating_hours="08:00 AM - 10:00 PM"
    )
    db.add(acceptor_profile)

    acceptor_app = Application(
        user_id=acceptor_user.id,
        application_type="acceptor",
        organization_name="Hope Community Food Bank",
        organization_type="NGO",
        contact_name="Sarah Jenkins",
        status="APPROVED",
        submitted_at=datetime.datetime.utcnow(),
        reviewed_at=datetime.datetime.utcnow()
    )
    db.add(acceptor_app)
    db.flush()

    # 3. Sample Food Listings for Demo Donor only
    listing1 = FoodListing(
        donor_id=donor_profile.id,
        food_name="Fresh Vegetable Biryani & Gravy",
        category="Cooked Meals",
        quantity=80,
        unit="meals",
        preparation_time="12:30 PM",
        expiry_time="08:30 PM (in 4 hours)",
        dietary_type="Vegetarian",
        pickup_address="104 Tech Park Avenue, Central Campus",
        latitude=12.9716,
        longitude=77.5946,
        status="AVAILABLE",
        notes="Hygienically packaged in food-grade insulated containers."
    )
    db.add(listing1)

    listing2 = FoodListing(
        donor_id=donor_profile.id,
        food_name="Assorted Pastries & Whole Wheat Bread",
        category="Bakery",
        quantity=40,
        unit="packets",
        preparation_time="09:00 AM",
        expiry_time="Tomorrow 11:00 AM",
        dietary_type="Vegetarian",
        pickup_address="104 Tech Park Avenue, Central Campus",
        latitude=12.9716,
        longitude=77.5946,
        status="AVAILABLE",
        notes="Freshly baked morning batch."
    )
    db.add(listing2)

    # 4. Welcome Notifications
    db.add(Notification(
        user_id=donor_user.id,
        title="Donor Portal Ready",
        message="Welcome to your Food Donor Dashboard. Use our AI model to predict surplus and list excess food."
    ))
    db.add(Notification(
        user_id=acceptor_user.id,
        title="Acceptor Portal Ready",
        message="Welcome Hope Community Food Bank. Browse nearby listings and request food for distribution."
    ))

    db.commit()
    print("Demo data successfully seeded!")

@app.on_event("startup")
def startup_event():
    # 1. Run database migrations to ensure all tables & columns exist
    run_migrations()

    # 2. Seed admin account and demo accounts if empty
    db = SessionLocal()
    try:
        seed_admin_user(db)
        seed_demo_data(db)
    finally:
        db.close()

    # 3. Pre-load ML model artifacts
    try:
        load_models()
        print("ML Model pipeline loaded successfully at startup.")
    except Exception as e:
        print(f"ML Model initialization warning: {e}")

@app.get("/")
def root():
    return {
        "system": "NourishSync — AI-Driven Food Surplus Prediction and Smart Redistribution System",
        "status": "Online",
        "documentation": "/docs",
        "ml_engine": "Active"
    }
