import sys
import os
import io
import datetime
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from backend.app.main import app
from backend.app.database.database import Base, get_db
from backend.app.models.models import (
    User,
    DonorProfile,
    AcceptorProfile,
    Application,
    ApplicationDocument,
    EmailVerificationToken,
    AuditLog
)
from backend.app.auth.auth import hash_password, hash_token
from backend.app.cli.init_admin import init_first_admin

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
    db = TestingSessionLocal()
    try:
        # Seed Demo Donor
        demo_donor = User(
            name="Community Kitchen Demo",
            email="donor@demo.com",
            password_hash=hash_password("password123"),
            role="donor",
            phone="9876543210",
            email_verified=True,
            approval_status="APPROVED",
            is_active=True
        )
        db.add(demo_donor)
        db.flush()

        dp = DonorProfile(
            user_id=demo_donor.id,
            organization_name="Community Kitchen Demo",
            owner_name="Chef Maria",
            organization_type="Restaurant",
            address="123 Food Care Avenue",
            city="Bengaluru",
            state="Karnataka",
            pin_code="560001",
            latitude=12.9716,
            longitude=77.5946
        )
        db.add(dp)

        # Seed Demo Acceptor
        demo_acceptor = User(
            name="Hope Shelter NGO Demo",
            email="acceptor@demo.com",
            password_hash=hash_password("password123"),
            role="acceptor",
            phone="9123456780",
            email_verified=True,
            approval_status="APPROVED",
            is_active=True
        )
        db.add(demo_acceptor)
        db.flush()

        ap = AcceptorProfile(
            user_id=demo_acceptor.id,
            organization_name="Hope Shelter NGO Demo",
            contact_person="Director Rajesh",
            organization_type="NGO",
            address="456 Relief Road",
            city="Bengaluru",
            state="Karnataka",
            pin_code="560002",
            latitude=12.9816,
            longitude=77.6046,
            max_capacity=300,
            food_categories="Cooked Meals",
            operating_hours="09:00 AM - 09:00 PM"
        )
        db.add(ap)

        # Seed System Admin
        admin_user = User(
            name="System Administrator",
            email="admin@nourishsync.org",
            password_hash=hash_password("AdminSecret!2026"),
            role="admin",
            phone="+1-800-555-ADMIN",
            is_active=True,
            email_verified=True,
            approval_status="APPROVED"
        )
        db.add(admin_user)
        db.flush()

        from backend.app.auth.auth import log_audit_event
        log_audit_event(
            db=db,
            action="ADMIN_INITIALIZED",
            actor_id=admin_user.id,
            target_type="user",
            target_id=admin_user.id,
            metadata={"email": admin_user.email, "setup_method": "CLI"}
        )

        db.commit()
    finally:
        db.close()

    yield
    Base.metadata.drop_all(bind=test_engine)

client = TestClient(app)

# =========================================================================
# 1. ADMIN INITIALIZATION & IDEMPOTENCY TESTS
# =========================================================================

def test_admin_initialization_and_idempotency():
    isolated_engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    Base.metadata.create_all(bind=isolated_engine)
    IsolatedSession = sessionmaker(autocommit=False, autoflush=False, bind=isolated_engine)
    db = IsolatedSession()
    try:
        # Weak password should fail
        with pytest.raises(ValueError, match="Password must"):
            init_first_admin(email="testadmin@nourishsync.org", password="short", db=db)

        # Valid strong password creates admin
        admin = init_first_admin(email="admin@nourishsync.org", password="AdminSecret!2026", db=db)
        assert admin.id is not None
        assert admin.role == "admin"
        assert admin.email == "admin@nourishsync.org"

        # Second attempt should be refused (Idempotency check)
        with pytest.raises(RuntimeError, match="already exists"):
            init_first_admin(email="secondadmin@nourishsync.org", password="AdminSecret!2026", db=db)
    finally:
        db.close()
        Base.metadata.drop_all(bind=isolated_engine)

# =========================================================================
# 2. TWO-STAGE DONOR VERIFICATION LIFECYCLE
# =========================================================================

def test_donor_registration_lifecycle():
    reg_payload = {
        "organization_name": "Sunrise Bakery",
        "owner_name": "Sunita Rao",
        "email": "sunrise@example.com",
        "phone": "9876543211",
        "password": "Password@123",
        "confirm_password": "Password@123",
        "organization_type": "Restaurant",
        "parent_institution": "Sunrise Foods Group",
        "address": "12 Baker Street",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pin_code": "560001",
        "latitude": 12.9716,
        "longitude": 77.5946
    }
    
    # 1. Registration
    res = client.post("/api/auth/register/donor", json=reg_payload)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["role"] == "donor"
    assert data["is_verified"] is False
    assert data["approval_status"] == "EMAIL_UNVERIFIED"
    assert "application_id" in data
    app_id = data["application_id"]
    token = data["verification_url"].split("token=")[1]

    # 2. Duplicate registration rejected
    dup_res = client.post("/api/auth/register/donor", json=reg_payload)
    assert dup_res.status_code == 400
    assert "already exists" in dup_res.json()["detail"].lower()

    # 3. Password mismatch rejected
    mismatch_payload = dict(reg_payload, email="other@example.com", confirm_password="WrongPassword")
    mismatch_res = client.post("/api/auth/register/donor", json=mismatch_payload)
    assert mismatch_res.status_code == 400
    assert "passwords do not match" in mismatch_res.json()["detail"].lower()

    # 4. Login BEFORE email verification (Strictly blocked)
    login_payload = {
        "email": "sunrise@example.com",
        "password": "Password@123",
        "role": "donor"
    }
    unverified_res = client.post("/api/auth/login", json=login_payload)
    assert unverified_res.status_code == 403
    assert "not verified" in unverified_res.json()["detail"].lower()

    # 5. Invalid token rejected
    bad_verify = client.get("/api/auth/verify-email?token=invalid_random_string_12345")
    assert bad_verify.status_code == 400

    # 6. Valid Token Verification
    verify_res = client.get(f"/api/auth/verify-email?token={token}")
    assert verify_res.status_code == 200
    assert verify_res.json()["verified"] is True
    assert verify_res.json()["approval_status"] == "PENDING_APPROVAL"

    # 7. Token reuse check (Token cannot be reused to re-trigger state changes)
    reuse_res = client.get(f"/api/auth/verify-email?token={token}")
    assert reuse_res.status_code == 200
    assert "already been verified" in reuse_res.json()["message"].lower()

    # 8. Login AFTER email verification but BEFORE admin approval (CRITICAL REQUIREMENT: Must be 403 Forbidden)
    pending_res = client.post("/api/auth/login", json=login_payload)
    assert pending_res.status_code == 403
    assert "pending administrator review" in pending_res.json()["detail"].lower()

    # 9. Public Application Status Check by email
    status_res = client.post("/api/auth/status-by-email", json={"email": "sunrise@example.com"})
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "PENDING_APPROVAL"
    assert status_res.json()["email_verified"] is True

# =========================================================================
# 3. DOCUMENT UPLOAD & VALIDATION
# =========================================================================

def test_document_upload_and_validation():
    # Retrieve application id for sunrise
    db = TestingSessionLocal()
    user = db.query(User).filter(User.email == "sunrise@example.com").first()
    app = db.query(Application).filter(Application.user_id == user.id).first()
    app_id = app.id
    db.close()

    # Test invalid extension (e.g. .exe or .sh)
    fake_exe = io.BytesIO(b"MZ\x90\x00executable content")
    bad_upload = client.post(
        f"/api/auth/applications/{app_id}/documents",
        data={"document_type": "FSSAI Food License"},
        files={"file": ("malicious.exe", fake_exe, "application/x-msdownload")}
    )
    assert bad_upload.status_code == 400
    assert "Unsupported file format" in bad_upload.json()["detail"]

    # Test valid PDF upload
    valid_pdf_content = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"
    pdf_file = io.BytesIO(valid_pdf_content)
    upload_res = client.post(
        f"/api/auth/applications/{app_id}/documents",
        data={"document_type": "FSSAI Food License"},
        files={"file": ("fssai_cert.pdf", pdf_file, "application/pdf")}
    )
    assert upload_res.status_code == 200
    doc_data = upload_res.json()
    assert doc_data["original_filename"] == "fssai_cert.pdf"
    assert doc_data["content_type"] == "application/pdf"

# =========================================================================
# 4. ADMIN REVIEW, DOCUMENT ACCESS & APPROVAL
# =========================================================================

def test_admin_review_and_approval():
    # Login as Admin
    admin_login = client.post("/api/auth/login", json={
        "email": "admin@nourishsync.org",
        "password": "AdminSecret!2026",
        "role": "admin"
    })
    assert admin_login.status_code == 200, admin_login.text
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Admin dashboard overview
    dash_res = client.get("/api/admin/dashboard", headers=admin_headers)
    assert dash_res.status_code == 200
    assert "kpi" in dash_res.json()

    # List applications
    apps_res = client.get("/api/admin/applications?status_filter=PENDING_APPROVAL", headers=admin_headers)
    assert apps_res.status_code == 200
    apps_list = apps_res.json()
    assert any(a["email"] == "sunrise@example.com" for a in apps_list)

    target_app = next(a for a in apps_list if a["email"] == "sunrise@example.com")
    app_id = target_app["id"]

    # View application detail
    detail_res = client.get(f"/api/admin/applications/{app_id}", headers=admin_headers)
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert len(detail["documents"]) >= 1
    doc_id = detail["documents"][0]["id"]

    # Download private document
    doc_stream_res = client.get(f"/api/admin/applications/{app_id}/documents/{doc_id}", headers=admin_headers)
    assert doc_stream_res.status_code == 200
    assert doc_stream_res.content.startswith(b"%PDF")

    # Approve application
    approve_res = client.post(
        f"/api/admin/applications/{app_id}/approve",
        json={"review_notes": "All documentation verified against state food registry."},
        headers=admin_headers
    )
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "APPROVED"

    # Now, approved donor CAN log in!
    login_res = client.post("/api/auth/login", json={
        "email": "sunrise@example.com",
        "password": "Password@123",
        "role": "donor"
    })
    assert login_res.status_code == 200
    assert login_res.json()["approval_status"] == "APPROVED"
    assert "access_token" in login_res.json()

# =========================================================================
# 5. ACCEPTOR REGISTRATION, REJECTION & RE-APPLICATION WORKFLOW
# =========================================================================

def test_acceptor_rejection_workflow():
    acceptor_payload = {
        "organization_name": "City Meals Shelter",
        "contact_person": "Ramesh Kumar",
        "email": "citymeals@example.com",
        "phone": "9876543299",
        "password": "Password@123",
        "confirm_password": "Password@123",
        "organization_type": "Shelter",
        "food_distribution_activities": "Serving evening meals to homeless individuals",
        "address": "77 South Road",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pin_code": "560002",
        "latitude": 12.9816,
        "longitude": 77.6046,
        "max_capacity": 400,
        "food_categories": "Cooked Meals",
        "operating_hours": "08:00 AM - 08:00 PM"
    }

    reg_res = client.post("/api/auth/register/acceptor", json=acceptor_payload)
    assert reg_res.status_code == 200
    token = reg_res.json()["verification_url"].split("token=")[1]
    app_id = reg_res.json()["application_id"]

    # Verify email
    client.get(f"/api/auth/verify-email?token={token}")

    # Admin Login
    admin_login = client.post("/api/auth/login", json={
        "email": "admin@nourishsync.org",
        "password": "AdminSecret!2026",
        "role": "admin"
    })
    admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

    # Rejection without reason must fail
    bad_reject = client.post(
        f"/api/admin/applications/{app_id}/reject",
        json={"rejection_reason": "   "},
        headers=admin_headers
    )
    assert bad_reject.status_code == 400

    # Rejection with reason succeeds
    reject_res = client.post(
        f"/api/admin/applications/{app_id}/reject",
        json={"rejection_reason": "Incomplete documentation: Registration certificate not provided."},
        headers=admin_headers
    )
    assert reject_res.status_code == 200
    assert reject_res.json()["status"] == "REJECTED"

    # Login attempt for rejected account fails
    rejected_login = client.post("/api/auth/login", json={
        "email": "citymeals@example.com",
        "password": "Password@123",
        "role": "acceptor"
    })
    assert rejected_login.status_code == 403
    assert "rejected" in rejected_login.json()["detail"].lower()

    # Rejected application CANNOT be re-approved
    cannot_reopen = client.post(
        f"/api/admin/applications/{app_id}/approve",
        json={"review_notes": "Trying to reopen"},
        headers=admin_headers
    )
    assert cannot_reopen.status_code == 400
    assert "cannot be re-opened" in cannot_reopen.json()["detail"].lower()

    # Re-apply with same email (Allowed after rejection with new application record)
    reapply_payload = dict(acceptor_payload, organization_name="City Meals Shelter Reapplied")
    reapply_res = client.post("/api/auth/register/acceptor", json=reapply_payload)
    assert reapply_res.status_code == 200
    new_app_id = reapply_res.json()["application_id"]
    assert new_app_id != app_id

# =========================================================================
# 6. ROLE-BASED ACCESS CONTROL (RBAC)
# =========================================================================

def test_rbac_donor_cannot_access_acceptor_endpoints():
    login_res = client.post("/api/auth/login", json={
        "email": "donor@demo.com",
        "password": "password123",
        "role": "donor"
    })
    assert login_res.status_code == 200, login_res.text
    donor_token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {donor_token}"}

    # Donor attempting acceptor-only endpoint
    res = client.get("/api/acceptor/dashboard", headers=headers)
    assert res.status_code == 403
    assert "Access denied" in res.json()["detail"]

    # Non-admin attempting admin endpoint
    admin_access_attempt = client.get("/api/admin/dashboard", headers=headers)
    assert admin_access_attempt.status_code == 403
    assert "Access denied" in admin_access_attempt.json()["detail"]

def test_rbac_acceptor_cannot_create_food_listing():
    login_res = client.post("/api/auth/login", json={
        "email": "acceptor@demo.com",
        "password": "password123",
        "role": "acceptor"
    })
    acceptor_token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {acceptor_token}"}

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

# =========================================================================
# 7. AUDIT LOG RECORDING
# =========================================================================

def test_audit_log_entries():
    admin_login = client.post("/api/auth/login", json={
        "email": "admin@nourishsync.org",
        "password": "AdminSecret!2026",
        "role": "admin"
    })
    admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

    logs_res = client.get("/api/admin/audit-logs", headers=admin_headers)
    assert logs_res.status_code == 200
    logs = logs_res.json()
    actions = [l["action"] for l in logs]

    assert "APPLICATION_APPROVED" in actions
    assert "APPLICATION_REJECTED" in actions
    assert "EMAIL_VERIFIED" in actions
    assert "DOCUMENTS_UPLOADED" in actions
    assert "ADMIN_INITIALIZED" in actions

# =========================================================================
# 8. PRESERVED DEMO ACCOUNTS & OPERATIONAL FEATURES
# =========================================================================

def test_demo_donor_and_acceptor_operational_access():
    # Demo donor
    donor_res = client.post("/api/auth/login", json={
        "email": "donor@demo.com",
        "password": "password123",
        "role": "donor"
    })
    assert donor_res.status_code == 200
    assert donor_res.json()["approval_status"] == "APPROVED"

    # Demo acceptor
    acceptor_res = client.post("/api/auth/login", json={
        "email": "acceptor@demo.com",
        "password": "password123",
        "role": "acceptor"
    })
    assert acceptor_res.status_code == 200
    assert acceptor_res.json()["approval_status"] == "APPROVED"

# =========================================================================
# 9. AI PREDICTION & DATASET INTEGRATION
# =========================================================================

def test_ai_prediction_endpoint_with_dataset_features():
    donor_login = client.post("/api/auth/login", json={
        "email": "donor@demo.com",
        "password": "password123",
        "role": "donor"
    })
    donor_token = donor_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {donor_token}"}

    ai_payload = {
        "type_of_food": "Meat",
        "number_of_guests": 350,
        "event_type": "Corporate",
        "quantity_of_food": 450,
        "storage_conditions": "Refrigerated",
        "purchase_history": "Regular",
        "seasonality": "Winter",
        "preparation_method": "Buffet",
        "geographical_location": "Urban",
        "pricing": "High"
    }
    res = client.post("/api/ai/predict-surplus", json=ai_payload, headers=headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert "predicted_surplus" in data
    assert isinstance(data["predicted_surplus"], int)
    assert data["predicted_surplus"] >= 0
    assert "insights_and_recommendations" in data


def test_ai_prediction_daily_operations_mode():
    donor_login = client.post("/api/auth/login", json={
        "email": "donor@demo.com",
        "password": "password123",
        "role": "donor"
    })
    headers = {"Authorization": f"Bearer {donor_login.json()['access_token']}"}

    daily_payload = {
        "prediction_mode": "daily_operations",
        "meals_planned": 380,
        "expected_customers": 320,
        "type_of_food": "Meat",
        "meal_period": "Lunch",
        "preparation_method": "Buffet",
        "storage_conditions": "Refrigerated",
        "purchase_history": "Regular",
        "seasonality": "All Seasons",
        "geographical_location": "Urban",
        "pricing": "Moderate"
    }
    res = client.post("/api/ai/predict-surplus", json=daily_payload, headers=headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["prediction_mode"] == "daily_operations"
    assert data["predicted_surplus"] >= 0
    assert data["meal_period"] == "Lunch"
    assert "Operational Mapping Proxy" in data["model_mode_note"]
    assert "food_safety_notice" in data
    assert len(data["insights_and_recommendations"]) > 0

def test_ai_prediction_special_events_mode():
    donor_login = client.post("/api/auth/login", json={
        "email": "donor@demo.com",
        "password": "password123",
        "role": "donor"
    })
    headers = {"Authorization": f"Bearer {donor_login.json()['access_token']}"}

    event_payload = {
        "prediction_mode": "special_events",
        "quantity_of_food": 500,
        "number_of_guests": 400,
        "event_type": "Wedding",
        "type_of_food": "Vegetables",
        "preparation_method": "Sit-down Dinner",
        "storage_conditions": "Refrigerated",
        "purchase_history": "Occasional",
        "seasonality": "Winter",
        "geographical_location": "Suburban",
        "pricing": "High"
    }
    res = client.post("/api/ai/predict-surplus", json=event_payload, headers=headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["prediction_mode"] == "special_events"
    assert data["predicted_surplus"] >= 0
    assert data["event_type"] == "Wedding"
    assert "Native Event Model" in data["model_mode_note"]

def test_ai_prediction_mode_validation_prevent_cross_pollination():
    donor_login = client.post("/api/auth/login", json={
        "email": "donor@demo.com",
        "password": "password123",
        "role": "donor"
    })
    headers = {"Authorization": f"Bearer {donor_login.json()['access_token']}"}

    # 1. Daily Operations submitting event_type must fail with 422
    daily_with_event = {
        "prediction_mode": "daily_operations",
        "meals_planned": 300,
        "expected_customers": 250,
        "event_type": "Corporate"  # Forbidden in daily_operations
    }
    res1 = client.post("/api/ai/predict-surplus", json=daily_with_event, headers=headers)
    assert res1.status_code == 422
    assert "event_type cannot be specified" in res1.text

    # 2. Special Events missing event_type must fail with 422
    event_without_type = {
        "prediction_mode": "special_events",
        "quantity_of_food": 400,
        "number_of_guests": 300
        # event_type missing
    }
    res2 = client.post("/api/ai/predict-surplus", json=event_without_type, headers=headers)
    assert res2.status_code == 422
    assert "event_type is required" in res2.text

    # 3. Special Events submitting meal_period must fail with 422
    event_with_period = {
        "prediction_mode": "special_events",
        "quantity_of_food": 400,
        "number_of_guests": 300,
        "event_type": "Wedding",
        "meal_period": "Breakfast"  # Forbidden in special_events
    }
    res3 = client.post("/api/ai/predict-surplus", json=event_with_period, headers=headers)
    assert res3.status_code == 422
    assert "meal_period is a daily operations parameter" in res3.text

def test_ai_prediction_input_validation_ranges():
    donor_login = client.post("/api/auth/login", json={
        "email": "donor@demo.com",
        "password": "password123",
        "role": "donor"
    })
    headers = {"Authorization": f"Bearer {donor_login.json()['access_token']}"}

    # Negative food quantity
    res1 = client.post("/api/ai/predict-surplus", json={
        "prediction_mode": "daily_operations",
        "meals_planned": -10,
        "expected_customers": 100
    }, headers=headers)
    assert res1.status_code == 422

    # Zero customers
    res2 = client.post("/api/ai/predict-surplus", json={
        "prediction_mode": "daily_operations",
        "meals_planned": 100,
        "expected_customers": 0
    }, headers=headers)
    assert res2.status_code == 422

    # Invalid mode
    res3 = client.post("/api/ai/predict-surplus", json={
        "prediction_mode": "invalid_mode",
        "meals_planned": 100,
        "expected_customers": 50
    }, headers=headers)
    assert res3.status_code == 422

def test_dataset_loading_and_cleaning():
    from ml.preprocessing.preprocess import load_and_preprocess_data

    X_train, X_test, y_train, y_test, preprocessor, df_cleaned = load_and_preprocess_data()
    assert len(df_cleaned) == 1618
    assert len(X_train) + len(X_test) == 1618
    assert len(y_train) + len(y_test) == 1618

    with pytest.raises(FileNotFoundError):
        load_and_preprocess_data(dataset_path="ml/dataset/non_existent_dataset.csv")

