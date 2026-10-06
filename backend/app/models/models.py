import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship

from backend.app.database.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)  # 'donor', 'acceptor', 'admin'
    phone = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    donor_profile = relationship("DonorProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    acceptor_profile = relationship("AcceptorProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class DonorProfile(Base):
    __tablename__ = "donor_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    organization_name = Column(String, nullable=False)
    owner_name = Column(String, nullable=True)
    organization_type = Column(String, nullable=False) # Restaurant, Hotel, Canteen, etc.
    address = Column(String, nullable=False)
    city = Column(String, nullable=False)
    state = Column(String, nullable=False)
    pin_code = Column(String, nullable=False)
    latitude = Column(Float, default=12.9716)
    longitude = Column(Float, default=77.5946)

    user = relationship("User", back_populates="donor_profile")
    food_listings = relationship("FoodListing", back_populates="donor", cascade="all, delete-orphan")


class AcceptorProfile(Base):
    __tablename__ = "acceptor_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    organization_name = Column(String, nullable=False)
    contact_person = Column(String, nullable=True)
    organization_type = Column(String, nullable=False) # NGO, Food Bank, Charity, etc.
    address = Column(String, nullable=False)
    city = Column(String, nullable=False)
    state = Column(String, nullable=False)
    pin_code = Column(String, nullable=False)
    latitude = Column(Float, default=12.9716)
    longitude = Column(Float, default=77.5946)
    max_capacity = Column(Integer, default=500) # meals
    food_categories = Column(String, default="Cooked Meals,Bakery,Packaged Food")
    operating_hours = Column(String, default="09:00 AM - 09:00 PM")

    user = relationship("User", back_populates="acceptor_profile")
    donation_requests = relationship("DonationRequest", back_populates="acceptor", cascade="all, delete-orphan")


class FoodListing(Base):
    __tablename__ = "food_listings"

    id = Column(Integer, primary_key=True, index=True)
    donor_id = Column(Integer, ForeignKey("donor_profiles.id"), nullable=False)
    food_name = Column(String, nullable=False)
    category = Column(String, nullable=False) # Cooked Meals, Bakery, Packaged Food, Dairy & Drinks
    quantity = Column(Integer, nullable=False) # e.g., 100
    unit = Column(String, default="meals") # meals, kg, packets
    preparation_time = Column(String, nullable=False)
    expiry_time = Column(String, nullable=False)
    dietary_type = Column(String, default="Vegetarian") # Vegetarian, Non-Vegetarian, Vegan
    status = Column(String, default="AVAILABLE") # AVAILABLE, REQUESTED, APPROVED, PICKUP_SCHEDULED, PICKED_UP, COMPLETED, EXPIRED, CANCELLED
    pickup_address = Column(String, nullable=False)
    latitude = Column(Float, default=12.9716)
    longitude = Column(Float, default=77.5946)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    donor = relationship("DonorProfile", back_populates="food_listings")
    requests = relationship("DonationRequest", back_populates="food_listing", cascade="all, delete-orphan")


class DonationRequest(Base):
    __tablename__ = "donation_requests"

    id = Column(Integer, primary_key=True, index=True)
    food_listing_id = Column(Integer, ForeignKey("food_listings.id"), nullable=False)
    acceptor_id = Column(Integer, ForeignKey("acceptor_profiles.id"), nullable=False)
    requested_quantity = Column(Integer, nullable=False)
    status = Column(String, default="REQUESTED") # REQUESTED, APPROVED, REJECTED, PICKUP_SCHEDULED, COMPLETED, CANCELLED
    notes = Column(Text, nullable=True)
    pickup_time = Column(String, nullable=True)
    requested_at = Column(DateTime, default=datetime.datetime.utcnow)
    approved_at = Column(DateTime, nullable=True)

    food_listing = relationship("FoodListing", back_populates="requests")
    acceptor = relationship("AcceptorProfile", back_populates="donation_requests")
    pickup = relationship("Pickup", back_populates="donation_request", uselist=False, cascade="all, delete-orphan")


class Pickup(Base):
    __tablename__ = "pickups"

    id = Column(Integer, primary_key=True, index=True)
    donation_request_id = Column(Integer, ForeignKey("donation_requests.id"), unique=True, nullable=False)
    pickup_time = Column(String, nullable=False)
    pickup_status = Column(String, default="SCHEDULED") # SCHEDULED, COLLECTED, CONFIRMED, CANCELLED
    notes = Column(Text, nullable=True)
    confirmed_at = Column(DateTime, nullable=True)

    donation_request = relationship("DonationRequest", back_populates="pickup")


class AIPrediction(Base):
    __tablename__ = "ai_predictions"

    id = Column(Integer, primary_key=True, index=True)
    donor_id = Column(Integer, ForeignKey("donor_profiles.id"), nullable=False)
    input_data = Column(Text, nullable=False) # JSON string of inputs
    predicted_demand = Column(Integer, nullable=False)
    predicted_surplus = Column(Integer, nullable=False)
    recommended_quantity = Column(Integer, nullable=False)
    surplus_probability = Column(Integer, default=50)
    is_anomaly = Column(Boolean, default=False)
    anomaly_message = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    read_status = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="notifications")
