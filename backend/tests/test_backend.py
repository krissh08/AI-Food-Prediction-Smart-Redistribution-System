import sys
import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from backend.app.main import app
from backend.app.database.database import Base, get_db

SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)

client = TestClient(app)

def test_donor_registration_and_login():
    reg_payload = {
        "organization_name": "Test Restaurant",
        "owner_name": "John Doe",
        "email": "donor_test@example.com",
        "phone": "9876543210",
        "password": "Password123",
        "confirm_password": "Password123",
        "organization_type": "Restaurant",
        "address": "123 Main St",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pin_code": "560001",
        "latitude": 12.9716,
        "longitude": 77.5946
    }
    res = client.post("/api/auth/register/donor", json=reg_payload)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["role"] == "donor"
    assert "access_token" in data

    # Login as donor
    login_payload = {
        "email": "donor_test@example.com",
        "password": "Password123",
        "role": "donor"
    }
    login_res = client.post("/api/auth/login", json=login_payload)
    assert login_res.status_code == 200
    assert login_res.json()["role"] == "donor"

def test_role_mismatch_rejection():
    # Attempt to log in as Acceptor with a Donor account
    login_payload = {
        "email": "donor_test@example.com",
        "password": "Password123",
        "role": "acceptor"
    }
    res = client.post("/api/auth/login", json=login_payload)
    assert res.status_code == 403
    assert "Role mismatch error" in res.json()["detail"]

def test_acceptor_registration_and_login():
    reg_payload = {
        "organization_name": "Test NGO",
        "contact_person": "Jane Smith",
        "email": "acceptor_test@example.com",
        "phone": "9123456789",
        "password": "Password123",
        "confirm_password": "Password123",
        "organization_type": "NGO",
        "address": "456 Charity Rd",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pin_code": "560002",
        "latitude": 12.9816,
        "longitude": 77.6046,
        "max_capacity": 500,
        "food_categories": "Cooked Meals",
        "operating_hours": "09:00 AM - 08:00 PM"
    }
    res = client.post("/api/auth/register/acceptor", json=reg_payload)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["role"] == "acceptor"

def test_rbac_donor_cannot_access_acceptor_endpoints():
    # Get Donor Token
    login_res = client.post("/api/auth/login", json={
        "email": "donor_test@example.com",
        "password": "Password123",
        "role": "donor"
    })
    donor_token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {donor_token}"}

    # Donor attempting acceptor-only dashboard
    res = client.get("/api/acceptor/dashboard", headers=headers)
    assert res.status_code == 403
    assert "Access denied" in res.json()["detail"]

def test_rbac_acceptor_cannot_create_food_listing():
    # Get Acceptor Token
    login_res = client.post("/api/auth/login", json={
        "email": "acceptor_test@example.com",
        "password": "Password123",
        "role": "acceptor"
    })
    acceptor_token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {acceptor_token}"}

    # Acceptor trying to create donor listing
    listing_payload = {
        "food_name": "Unauthorized Meals",
        "category": "Cooked Meals",
        "quantity": 50,
        "preparation_time": "12:00 PM",
        "expiry_time": "06:00 PM",
        "pickup_address": "Test"
    }
    res = client.post("/api/donor/food", json=listing_payload, headers=headers)
    assert res.status_code == 403
    assert "Access denied" in res.json()["detail"]

def test_ai_prediction_endpoint():
    login_res = client.post("/api/auth/login", json={
        "email": "donor_test@example.com",
        "password": "Password123",
        "role": "donor"
    })
    donor_token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {donor_token}"}

    ai_payload = {
        "meals_planned": 700,
        "expected_customers": 600,
        "previous_avg_waste": 70,
        "event_status": "College Fest",
        "day_of_week": "Friday",
        "weather_condition": "Sunny",
        "food_category": "Cooked Meals",
        "meal_type": "Lunch",
        "season": "Spring"
    }
    res = client.post("/api/ai/predict-surplus", json=ai_payload, headers=headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert "expected_demand" in data
    assert "predicted_surplus" in data
    assert "recommended_preparation" in data
    assert "surplus_probability" in data

def test_food_listing_and_matching():
    login_res = client.post("/api/auth/login", json={
        "email": "donor_test@example.com",
        "password": "Password123",
        "role": "donor"
    })
    donor_token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {donor_token}"}

    listing_payload = {
        "food_name": "Fried Rice & Curry",
        "category": "Cooked Meals",
        "quantity": 80,
        "unit": "meals",
        "preparation_time": "01:00 PM",
        "expiry_time": "09:00 PM",
        "dietary_type": "Vegetarian",
        "pickup_address": "123 Main St, Bengaluru",
        "latitude": 12.9716,
        "longitude": 77.5946
    }
    res = client.post("/api/donor/food", json=listing_payload, headers=headers)
    assert res.status_code == 200
    food_id = res.json()["id"]

    # Test Matching Endpoint
    match_res = client.get(f"/api/matching/recommendations/{food_id}", headers=headers)
    assert match_res.status_code == 200
    match_data = match_res.json()
    assert match_data["food_listing_id"] == food_id
    assert "recommended_acceptors" in match_data
