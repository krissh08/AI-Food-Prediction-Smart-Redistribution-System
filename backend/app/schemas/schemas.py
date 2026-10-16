from pydantic import BaseModel, EmailStr, Field, ConfigDict, model_validator
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- Auth Schemas ---
class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    role: str # 'donor', 'acceptor', 'admin'

class DonorRegisterRequest(BaseModel):
    organization_name: str
    owner_name: Optional[str] = None
    email: EmailStr
    phone: str
    password: str
    confirm_password: str
    organization_type: str # Restaurant, Hotel, Canteen, Hostel, Event organizer, Cafeteria, Other
    parent_institution: Optional[str] = None # Explanation if affiliated with university/chain
    address: str
    city: str
    state: str
    pin_code: str
    latitude: Optional[float] = 12.9716
    longitude: Optional[float] = 77.5946

class AcceptorRegisterRequest(BaseModel):
    organization_name: str
    contact_person: Optional[str] = None
    email: EmailStr
    phone: str
    password: str
    confirm_password: str
    organization_type: str # NGO, Food Bank, Charity, Shelter, Community organization, Other
    food_distribution_activities: Optional[str] = None # Evidence/description of charitable food distribution
    address: str
    city: str
    state: str
    pin_code: str
    latitude: Optional[float] = 12.9716
    longitude: Optional[float] = 77.5946
    max_capacity: Optional[int] = 500
    food_categories: Optional[str] = "Cooked Meals,Bakery,Packaged Food"
    operating_hours: Optional[str] = "09:00 AM - 09:00 PM"

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    name: str
    email: str
    is_verified: Optional[bool] = True
    email_verified: Optional[bool] = True
    approval_status: Optional[str] = "APPROVED"
    verification_url: Optional[str] = None
    message: Optional[str] = None

class RegisterResponse(BaseModel):
    message: str
    email: str
    user_id: int
    role: str
    is_verified: bool = False
    email_verified: bool = False
    approval_status: str = "EMAIL_UNVERIFIED"
    verification_url: Optional[str] = None
    application_id: Optional[int] = None

class VerifyEmailResponse(BaseModel):
    message: str
    verified: bool
    email: Optional[str] = None
    approval_status: Optional[str] = "PENDING_APPROVAL"

class ResendVerificationRequest(BaseModel):
    email: EmailStr

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    role: str
    phone: Optional[str] = None
    is_active: bool
    is_verified: bool = False
    email_verified: bool = False
    approval_status: str = "EMAIL_UNVERIFIED"
    created_at: datetime
    profile: Optional[Dict[str, Any]] = None

# --- Application & Verification Schemas ---
class ApplicationDocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    document_type: str
    original_filename: str
    content_type: str
    file_size: int
    uploaded_at: datetime

class ApplicationDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    application_type: str
    account_role: str
    organization_name: str
    organization_type: str
    contact_name: Optional[str] = None
    email: str
    phone: Optional[str] = None
    status: str
    rejection_reason: Optional[str] = None
    admin_notes: Optional[str] = None
    submitted_at: datetime
    reviewed_at: Optional[datetime] = None
    email_verified: bool
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pin_code: Optional[str] = None
    parent_institution: Optional[str] = None
    food_distribution_activities: Optional[str] = None
    documents: List[ApplicationDocumentResponse] = []

class ApplicationListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    application_type: str
    account_role: str
    organization_name: str
    organization_type: str
    contact_name: Optional[str] = None
    email: str
    status: str
    submitted_at: datetime
    reviewed_at: Optional[datetime] = None
    reviewed_by_admin: Optional[str] = None
    rejection_reason: Optional[str] = None
    documents_count: int = 0
    email_verified: bool = False

class ApproveApplicationRequest(BaseModel):
    admin_notes: Optional[str] = None

class RejectApplicationRequest(BaseModel):
    rejection_reason: str
    admin_notes: Optional[str] = None

class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    actor_id: Optional[int] = None
    actor_name: Optional[str] = None
    action: str
    target_type: Optional[str] = None
    target_id: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime

# --- Food Listing Schemas ---
class FoodListingCreate(BaseModel):
    food_name: str
    category: str
    quantity: int
    unit: Optional[str] = "meals"
    preparation_time: str
    expiry_time: str
    dietary_type: Optional[str] = "Vegetarian"
    pickup_address: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    notes: Optional[str] = None

class FoodListingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    donor_id: int
    food_name: str
    category: str
    quantity: int
    unit: str
    preparation_time: str
    expiry_time: str
    dietary_type: str
    status: str
    pickup_address: str
    latitude: float
    longitude: float
    notes: Optional[str] = None
    created_at: datetime
    donor_organization: Optional[str] = None
    distance_km: Optional[float] = None
    match_score: Optional[int] = None

# --- Donation Request Schemas ---
class DonationRequestCreate(BaseModel):
    food_listing_id: int
    requested_quantity: int
    notes: Optional[str] = None

class DonationRequestAction(BaseModel):
    pickup_time: Optional[str] = None
    notes: Optional[str] = None

class DonationRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    food_listing_id: int
    acceptor_id: int
    requested_quantity: int
    status: str
    notes: Optional[str] = None
    pickup_time: Optional[str] = None
    requested_at: datetime
    approved_at: Optional[datetime] = None
    food_name: Optional[str] = None
    category: Optional[str] = None
    donor_organization: Optional[str] = None
    acceptor_organization: Optional[str] = None
    pickup_address: Optional[str] = None

# --- AI Prediction Schemas ---
class AIPredictRequest(BaseModel):
    # Prediction Mode: 'daily_operations' (routine food prep) or 'special_events' (catered events)
    prediction_mode: str = Field("special_events", json_schema_extra={"example": "special_events"})

    # Core Quantities (acceptable via either mode's field names)
    quantity_of_food: Optional[int] = None
    meals_planned: Optional[int] = None
    number_of_guests: Optional[int] = None
    expected_customers: Optional[int] = None

    # Shared Categorical Features
    type_of_food: Optional[str] = Field("Meat", json_schema_extra={"example": "Meat"})
    food_category: Optional[str] = None
    storage_conditions: Optional[str] = Field("Refrigerated", json_schema_extra={"example": "Refrigerated"})
    preparation_method: Optional[str] = Field("Buffet", json_schema_extra={"example": "Buffet"})
    service_style: Optional[str] = None
    geographical_location: Optional[str] = Field("Urban", json_schema_extra={"example": "Urban"})
    pricing: Optional[str] = Field("Moderate", json_schema_extra={"example": "Moderate"})
    purchase_history: Optional[str] = Field("Regular", json_schema_extra={"example": "Regular"})
    customer_pattern: Optional[str] = None
    seasonality: Optional[str] = Field("All Seasons", json_schema_extra={"example": "All Seasons"})
    season: Optional[str] = None

    # Mode-Specific Parameters
    # Special Events only:
    event_type: Optional[str] = None

    # Daily Operations only:
    meal_period: Optional[str] = None # Breakfast, Lunch, Dinner, All-Day Service
    day_of_week: Optional[str] = None

    # Legacy Compatibility Fields
    previous_avg_waste: Optional[int] = None
    event_status: Optional[str] = None
    weather_condition: Optional[str] = None
    meal_type: Optional[str] = None

    @model_validator(mode="after")
    def validate_prediction_mode_and_inputs(self):
        mode = (self.prediction_mode or "special_events").strip().lower()
        if mode not in ["daily_operations", "special_events"]:
            raise ValueError("prediction_mode must be either 'daily_operations' or 'special_events'.")
        self.prediction_mode = mode

        qty = self.quantity_of_food if self.quantity_of_food is not None else self.meals_planned
        guests = self.number_of_guests if self.number_of_guests is not None else self.expected_customers

        if qty is None:
            raise ValueError("Planned food quantity (quantity_of_food or meals_planned) is required.")
        if qty <= 0:
            raise ValueError("Planned food quantity must be greater than 0.")
        if qty > 5000:
            raise ValueError("Planned food quantity cannot exceed 5,000 units.")

        if guests is None:
            raise ValueError("Number of guests/customers (number_of_guests or expected_customers) is required.")
        if guests <= 0:
            raise ValueError("Number of guests/customers must be greater than 0.")
        if guests > 5000:
            raise ValueError("Number of guests/customers cannot exceed 5,000.")

        if mode == "daily_operations":
            if self.event_type is not None and str(self.event_type).strip() != "":
                raise ValueError("event_type cannot be specified when predicting routine daily operations. Switch to Special Events mode for catered gatherings.")
        elif mode == "special_events":
            if not self.event_type or str(self.event_type).strip() == "":
                raise ValueError("event_type is required for Special Events mode (e.g. Corporate, Birthday, Wedding, Social Gathering).")
            if self.meal_period is not None and str(self.meal_period).strip() != "":
                raise ValueError("meal_period is a daily operations parameter and cannot be submitted for special events.")

        return self

class AIPredictResponse(BaseModel):
    # Primary Prediction Output
    predicted_surplus: int
    surplus_unit: Optional[str] = "food units"

    # Mode Metadata & Disclosures
    prediction_mode: Optional[str] = "special_events"
    mode_label: Optional[str] = "Special Events (Catered Gatherings)"
    model_mode_note: Optional[str] = None
    food_safety_notice: Optional[str] = None

    # Transparently Derived Calculations
    estimated_consumption: Optional[int] = None
    recommended_preparation: Optional[int] = None
    surplus_ratio_pct: Optional[float] = None

    # Input Features
    quantity_of_food: Optional[int] = None
    number_of_guests: Optional[int] = None
    type_of_food: Optional[str] = None
    event_type: Optional[str] = None
    storage_conditions: Optional[str] = None
    preparation_method: Optional[str] = None

    # Daily Operations Specific Fields
    meal_period: Optional[str] = None
    expected_customers: Optional[int] = None
    meals_planned: Optional[int] = None

    # Compatibility Aliases
    expected_demand: Optional[int] = None
    surplus_probability: Optional[int] = None

    # Insights & Diagnostic Metadata
    is_anomaly: bool = False
    anomaly_message: Optional[str] = None
    insights_and_recommendations: List[str] = []
    model_evaluation: Optional[Dict[str, Any]] = None

# --- Notification Schemas ---
class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    message: str
    read_status: bool
    created_at: datetime

# --- Analytics Schemas ---
class DonorAnalyticsResponse(BaseModel):
    total_meals_prepared: int
    total_meals_donated: int
    total_meals_surplus: int
    total_meals_wasted: Optional[int] = None
    meals_saved: int
    donation_count: int
    completed_pickups: int
    surplus_redistribution_rate: float
    waste_reduction_rate: Optional[float] = None
    monthly_trends: List[Dict[str, Any]]
    surplus_by_category: List[Dict[str, Any]]
    waste_by_category: Optional[List[Dict[str, Any]]] = None
    ai_prediction_accuracy: Optional[float] = 92.1

class AcceptorAnalyticsResponse(BaseModel):
    total_meals_received: int
    total_requests_made: int
    completed_pickups: int
    active_donor_partners: int
    average_distance_km: float
    monthly_received: List[Dict[str, Any]]
    food_categories_breakdown: List[Dict[str, Any]]
