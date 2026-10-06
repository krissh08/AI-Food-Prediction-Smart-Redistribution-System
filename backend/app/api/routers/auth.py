from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database.database import get_db
from backend.app.models.models import User, DonorProfile, AcceptorProfile, Notification
from backend.app.schemas.schemas import LoginRequest, DonorRegisterRequest, AcceptorRegisterRequest, TokenResponse, UserResponse
from backend.app.auth.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register/donor", response_model=TokenResponse)
def register_donor(req: DonorRegisterRequest, db: Session = Depends(get_db)):
    if req.password != req.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")

    existing_user = db.query(User).filter(User.email == req.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists.")

    user = User(
        name=req.organization_name,
        email=req.email,
        password_hash=hash_password(req.password),
        role="donor",
        phone=req.phone
    )
    db.add(user)
    db.flush()

    donor_profile = DonorProfile(
        user_id=user.id,
        organization_name=req.organization_name,
        owner_name=req.owner_name,
        organization_type=req.organization_type,
        address=req.address,
        city=req.city,
        state=req.state,
        pin_code=req.pin_code,
        latitude=req.latitude or 12.9716,
        longitude=req.longitude or 77.5946
    )
    db.add(donor_profile)

    welcome_notif = Notification(
        user_id=user.id,
        title="Welcome to Food Redistribution Platform!",
        message=f"Welcome {req.organization_name}! Your Food Donor account is now active. Start adding surplus food listings to help fight food waste."
    )
    db.add(welcome_notif)

    db.commit()

    token = create_access_token({"sub": user.id, "role": user.role, "email": user.email})
    return TokenResponse(
        access_token=token,
        role="donor",
        user_id=user.id,
        name=user.name,
        email=user.email
    )

@router.post("/register/acceptor", response_model=TokenResponse)
def register_acceptor(req: AcceptorRegisterRequest, db: Session = Depends(get_db)):
    if req.password != req.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")

    existing_user = db.query(User).filter(User.email == req.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists.")

    user = User(
        name=req.organization_name,
        email=req.email,
        password_hash=hash_password(req.password),
        role="acceptor",
        phone=req.phone
    )
    db.add(user)
    db.flush()

    acceptor_profile = AcceptorProfile(
        user_id=user.id,
        organization_name=req.organization_name,
        contact_person=req.contact_person,
        organization_type=req.organization_type,
        address=req.address,
        city=req.city,
        state=req.state,
        pin_code=req.pin_code,
        latitude=req.latitude or 12.9716,
        longitude=req.longitude or 77.5946,
        max_capacity=req.max_capacity or 500,
        food_categories=req.food_categories or "Cooked Meals,Bakery,Packaged Food",
        operating_hours=req.operating_hours or "09:00 AM - 09:00 PM"
    )
    db.add(acceptor_profile)

    welcome_notif = Notification(
        user_id=user.id,
        title="Welcome Food Acceptor Partner!",
        message=f"Welcome {req.organization_name}! Your Food Acceptor profile is registered. Browse available surplus food nearby and submit pickup requests."
    )
    db.add(welcome_notif)

    db.commit()

    token = create_access_token({"sub": user.id, "role": user.role, "email": user.email})
    return TokenResponse(
        access_token=token,
        role="acceptor",
        user_id=user.id,
        name=user.name,
        email=user.email
    )

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    # STRICT ROLE AUTHORIZATION CHECK
    if user.role != req.role and req.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Role mismatch error: You are registered as a '{user.role.replace('_', ' ').capitalize()}' and cannot log in as '{req.role.replace('_', ' ').capitalize()}'."
        )

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Your account has been deactivated by system administrator.")

    token = create_access_token({"sub": user.id, "role": user.role, "email": user.email})
    return TokenResponse(
        access_token=token,
        role=user.role,
        user_id=user.id,
        name=user.name,
        email=user.email
    )

@router.post("/logout")
def logout():
    return {"message": "Successfully logged out."}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile_data = None
    if current_user.role == "donor" and current_user.donor_profile:
        dp = current_user.donor_profile
        profile_data = {
            "id": dp.id,
            "organization_name": dp.organization_name,
            "owner_name": dp.owner_name,
            "organization_type": dp.organization_type,
            "address": dp.address,
            "city": dp.city,
            "state": dp.state,
            "pin_code": dp.pin_code,
            "latitude": dp.latitude,
            "longitude": dp.longitude
        }
    elif current_user.role == "acceptor" and current_user.acceptor_profile:
        ap = current_user.acceptor_profile
        profile_data = {
            "id": ap.id,
            "organization_name": ap.organization_name,
            "contact_person": ap.contact_person,
            "organization_type": ap.organization_type,
            "address": ap.address,
            "city": ap.city,
            "state": ap.state,
            "pin_code": ap.pin_code,
            "latitude": ap.latitude,
            "longitude": ap.longitude,
            "max_capacity": ap.max_capacity,
            "food_categories": ap.food_categories,
            "operating_hours": ap.operating_hours
        }

    return UserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role,
        phone=current_user.phone,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        profile=profile_data
    )
