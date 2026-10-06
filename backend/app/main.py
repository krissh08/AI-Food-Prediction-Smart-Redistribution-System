import os
import sys
import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

# Add root directory to python path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from backend.app.database.database import engine, Base, SessionLocal
from backend.app.models.models import User, DonorProfile, AcceptorProfile, FoodListing, DonationRequest, Notification
from backend.app.auth.auth import hash_password

from backend.app.api.routers import auth, donor, acceptor, ai, donations, matching, notifications, analytics, admin
from ml.prediction.predict import load_models

app = FastAPI(
    title="AI-Driven Food Surplus Prediction and Smart Redistribution System API",
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

def seed_demo_data(db: Session):
    if db.query(User).count() > 0:
        return

    print("Seeding initial demo accounts & sample food listings...")

    # 1. Admin Account
    admin_user = User(
        name="System Administrator",
        email="admin@demo.com",
        password_hash=hash_password("admin123"),
        role="admin",
        phone="+1-800-555-0199"
    )
    db.add(admin_user)

    # 2. Food Donor Account
    donor_user = User(
        name="Grand Palace Hotel & Canteen",
        email="donor@demo.com",
        password_hash=hash_password("password123"),
        role="donor",
        phone="+1-555-0144"
    )
    db.add(donor_user)
    db.flush()

    donor_profile = DonorProfile(
        user_id=donor_user.id,
        organization_name="Grand Palace Hotel & Canteen",
        owner_name="Robert Vance",
        organization_type="Hotel",
        address="104 Tech Park Avenue, Central Campus",
        city="Bengaluru",
        state="Karnataka",
        pin_code="560001",
        latitude=12.9716,
        longitude=77.5946
    )
    db.add(donor_profile)

    # 3. Food Acceptor Account
    acceptor_user = User(
        name="Hope Community Food Bank",
        email="acceptor@demo.com",
        password_hash=hash_password("password123"),
        role="acceptor",
        phone="+1-555-0188"
    )
    db.add(acceptor_user)
    db.flush()

    acceptor_profile = AcceptorProfile(
        user_id=acceptor_user.id,
        organization_name="Hope Community Food Bank",
        contact_person="Sarah Jenkins",
        organization_type="NGO",
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
    db.flush()

    # 4. Sample Food Listings
    listing1 = FoodListing(
        donor_id=donor_profile.id,
        food_name="Fresh Vegetable Biryani & Gravy",
        category="Cooked Meals",
        quantity=100,
        unit="meals",
        preparation_time="12:30 PM",
        expiry_time="08:30 PM (in 3 hours)",
        dietary_type="Vegetarian",
        status="AVAILABLE",
        pickup_address=donor_profile.address,
        latitude=donor_profile.latitude,
        longitude=donor_profile.longitude,
        notes="Freshly prepared lunch surplus from corporate conference banquet."
    )
    db.add(listing1)

    listing2 = FoodListing(
        donor_id=donor_profile.id,
        food_name="Assorted Pastries & Whole Wheat Bread",
        category="Bakery",
        quantity=60,
        unit="packets",
        preparation_time="07:00 AM",
        expiry_time="10:00 PM (in 5 hours)",
        dietary_type="Vegetarian",
        status="AVAILABLE",
        pickup_address=donor_profile.address,
        latitude=donor_profile.latitude,
        longitude=donor_profile.longitude,
        notes="Hygienically packed bakery items."
    )
    db.add(listing2)

    # 5. Welcome Notifications
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
    # Create DB tables
    Base.metadata.create_all(bind=engine)

    # Seed demo accounts if empty
    db = SessionLocal()
    try:
        seed_demo_data(db)
    finally:
        db.close()

    # Pre-load ML model artifacts
    try:
        load_models()
        print("ML Model pipeline loaded successfully at startup.")
    except Exception as e:
        print(f"ML Model initialization warning: {e}")

@app.get("/")
def root():
    return {
        "system": "AI-Driven Food Surplus Prediction and Smart Redistribution System",
        "status": "Online",
        "documentation": "/docs",
        "ml_engine": "Active"
    }
