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
    email_verified = Column(Boolean, default=False)
    approval_status = Column(String, default="EMAIL_UNVERIFIED")  # 'EMAIL_UNVERIFIED', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Backward compatibility property for is_verified
    @property
    def is_verified(self):
        return self.email_verified

    @is_verified.setter
    def is_verified(self, value):
        self.email_verified = value

    donor_profile = relationship("DonorProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    acceptor_profile = relationship("AcceptorProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="user", foreign_keys="Application.user_id", cascade="all, delete-orphan")
    verification_tokens = relationship("EmailVerificationToken", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="actor", foreign_keys="AuditLog.actor_id")


class DonorProfile(Base):
    __tablename__ = "donor_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    organization_name = Column(String, nullable=False)
    owner_name = Column(String, nullable=True)
    organization_type = Column(String, nullable=False) # Restaurant, Hotel, College canteen, Hostel, Event organizer, Cafeteria, Other
    parent_institution = Column(Text, nullable=True) # Optional explanation if operating under a university/hotel chain
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
    organization_type = Column(String, nullable=False) # NGO, Food bank, Charity, Shelter, Community organization, Other
    food_distribution_activities = Column(Text, nullable=True) # Evidence/description of charitable food distribution
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


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    application_type = Column(String, nullable=False)  # 'donor' or 'acceptor'
    organization_name = Column(String, nullable=False)
    organization_type = Column(String, nullable=False)
    contact_name = Column(String, nullable=True)
    status = Column(String, default="EMAIL_UNVERIFIED", index=True)  # 'EMAIL_UNVERIFIED', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'
    rejection_reason = Column(Text, nullable=True)
    admin_notes = Column(Text, nullable=True)
    submitted_at = Column(DateTime, default=datetime.datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="applications", foreign_keys=[user_id])
    reviewer = relationship("User", foreign_keys=[reviewed_by])
    documents = relationship("ApplicationDocument", back_populates="application", cascade="all, delete-orphan")


class ApplicationDocument(Base):
    __tablename__ = "application_documents"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    document_type = Column(String, nullable=False) # 'business_registration', 'fssai_license', 'tax_exemption_80g', 'activity_report', 'student_union_letter', 'other'
    original_filename = Column(String, nullable=False)
    storage_key = Column(String, unique=True, nullable=False)
    content_type = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)

    application = relationship("Application", back_populates="documents")


class EmailVerificationToken(Base):
    __tablename__ = "email_verification_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token_hash = Column(String, unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="verification_tokens")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False, index=True)
    target_type = Column(String, nullable=True) # 'application', 'user', 'document', 'system'
    target_id = Column(Integer, nullable=True)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    actor = relationship("User", back_populates="audit_logs", foreign_keys=[actor_id])


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
