from pydantic import BaseModel, EmailStr, Field, ConfigDict
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
    organization_type: str # Restaurant, Hotel, Canteen, etc.
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
    organization_type: str # NGO, Food Bank, Charity, etc.
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

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    role: str
    phone: Optional[str] = None
    is_active: bool
    created_at: datetime
    profile: Optional[Dict[str, Any]] = None

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
    meals_planned: int = Field(..., json_schema_extra={"example": 700})
    expected_customers: int = Field(..., json_schema_extra={"example": 600})
    previous_avg_waste: int = Field(..., json_schema_extra={"example": 70})
    event_status: Optional[str] = "None"
    day_of_week: Optional[str] = "Wednesday"
    weather_condition: Optional[str] = "Sunny"
    food_category: Optional[str] = "Cooked Meals"
    meal_type: Optional[str] = "Lunch"
    season: Optional[str] = "Spring"

class AIPredictResponse(BaseModel):
    meals_planned: int
    expected_customers: int
    expected_demand: int
    predicted_surplus: int
    recommended_preparation: int
    surplus_probability: int
    is_anomaly: bool
    anomaly_message: Optional[str] = None
    insights_and_recommendations: List[str]
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
    total_meals_wasted: int
    meals_saved: int
    donation_count: int
    completed_pickups: int
    waste_reduction_rate: float
    monthly_trends: List[Dict[str, Any]]
    waste_by_category: List[Dict[str, Any]]

class AcceptorAnalyticsResponse(BaseModel):
    total_meals_received: int
    total_requests_made: int
    completed_pickups: int
    active_donor_partners: int
    average_distance_km: float
    monthly_received: List[Dict[str, Any]]
    food_categories_breakdown: List[Dict[str, Any]]
