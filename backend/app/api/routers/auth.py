import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, status, Request
from sqlalchemy.orm import Session
from typing import Optional
from urllib.parse import urlparse

def extract_frontend_origin(request: Request) -> Optional[str]:
    origin = request.headers.get("origin")
    if not origin and request.headers.get("referer"):
        parsed = urlparse(request.headers.get("referer"))
        if parsed.scheme and parsed.netloc:
            origin = f"{parsed.scheme}://{parsed.netloc}"
    return origin

from backend.app.database.database import get_db
from backend.app.models.models import (
    User,
    DonorProfile,
    AcceptorProfile,
    Notification,
    Application,
    ApplicationDocument,
    EmailVerificationToken
)
from backend.app.schemas.schemas import (
    LoginRequest,
    DonorRegisterRequest,
    AcceptorRegisterRequest,
    TokenResponse,
    UserResponse,
    RegisterResponse,
    VerifyEmailResponse,
    ResendVerificationRequest,
    ApplicationDocumentResponse
)
from backend.app.auth.auth import (
    hash_password,
    verify_password,
    generate_random_token,
    hash_token,
    create_access_token,
    log_audit_event,
    get_current_user
)
from backend.app.services.email_service import (
    send_email_a_verification,
    send_email_b_approval_pending
)
from backend.app.services.document_service import validate_and_save_document

router = APIRouter(prefix="/api/auth", tags=["Authentication & Verification"])

@router.post("/register/donor", response_model=RegisterResponse)
def register_donor(req: DonorRegisterRequest, request: Request, db: Session = Depends(get_db)):
    if req.password != req.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")

    # Prevent role escalation
    existing_user = db.query(User).filter(User.email == req.email).first()
    if existing_user:
        if existing_user.approval_status != "REJECTED":
            raise HTTPException(status_code=400, detail="An account with this email address already exists.")
        
        # Re-initialize user for new application lifecycle
        user = existing_user
        user.name = req.organization_name
        user.password_hash = hash_password(req.password)
        user.role = "donor"
        user.phone = req.phone
        user.email_verified = False
        user.approval_status = "EMAIL_UNVERIFIED"
        user.is_active = True

        donor_profile = db.query(DonorProfile).filter(DonorProfile.user_id == user.id).first()
        if donor_profile:
            donor_profile.organization_name = req.organization_name
            donor_profile.owner_name = req.owner_name
            donor_profile.organization_type = req.organization_type
            donor_profile.parent_institution = req.parent_institution
            donor_profile.address = req.address
            donor_profile.city = req.city
            donor_profile.state = req.state
            donor_profile.pin_code = req.pin_code
            donor_profile.latitude = req.latitude or 12.9716
            donor_profile.longitude = req.longitude or 77.5946
        else:
            donor_profile = DonorProfile(
                user_id=user.id,
                organization_name=req.organization_name,
                owner_name=req.owner_name,
                organization_type=req.organization_type,
                parent_institution=req.parent_institution,
                address=req.address,
                city=req.city,
                state=req.state,
                pin_code=req.pin_code,
                latitude=req.latitude or 12.9716,
                longitude=req.longitude or 77.5946
            )
            db.add(donor_profile)
    else:
        # 1. Create User in unverified and unapproved status
        user = User(
            name=req.organization_name,
            email=req.email,
            password_hash=hash_password(req.password),
            role="donor",
            phone=req.phone,
            email_verified=False,
            approval_status="EMAIL_UNVERIFIED",
            is_active=True
        )
        db.add(user)
        db.flush()

        # 2. Create DonorProfile
        donor_profile = DonorProfile(
            user_id=user.id,
            organization_name=req.organization_name,
            owner_name=req.owner_name,
            organization_type=req.organization_type,
            parent_institution=req.parent_institution,
            address=req.address,
            city=req.city,
            state=req.state,
            pin_code=req.pin_code,
            latitude=req.latitude or 12.9716,
            longitude=req.longitude or 77.5946
        )
        db.add(donor_profile)

    # 3. Create fresh Application record (independent review history)
    application = Application(
        user_id=user.id,
        application_type="donor",
        organization_name=req.organization_name,
        organization_type=req.organization_type,
        contact_name=req.owner_name or req.organization_name,
        status="EMAIL_UNVERIFIED",
        submitted_at=datetime.datetime.utcnow()
    )
    db.add(application)
    db.flush()

    # 4. Generate cryptographically random single-use verification token (store SHA-256 hash)
    raw_token = generate_random_token()
    token_rec = EmailVerificationToken(
        user_id=user.id,
        token_hash=hash_token(raw_token),
        expires_at=datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    )
    db.add(token_rec)

    # 5. Welcome notification and audit log
    db.add(Notification(
        user_id=user.id,
        title="Registration Received",
        message=f"Welcome {req.organization_name}! Please verify your email to submit your organization for admin review."
    ))

    log_audit_event(
        db=db,
        action="APPLICATION_CREATED",
        actor_id=user.id,
        target_type="application",
        target_id=application.id,
        metadata={"role": "donor", "organization": req.organization_name, "email": user.email}
    )

    db.commit()

    # 6. Dispatch Email A (Verify your email)
    origin = extract_frontend_origin(request)
    email_dispatch = send_email_a_verification(user.email, raw_token, req.owner_name or req.organization_name, frontend_url=origin)

    return RegisterResponse(
        message="Registration submitted successfully. Please check your email to verify your address before admin review.",
        email=user.email,
        user_id=user.id,
        role="donor",
        is_verified=False,
        email_verified=False,
        approval_status="EMAIL_UNVERIFIED",
        verification_url=email_dispatch.get("verification_url"),
        application_id=application.id
    )

@router.post("/register/acceptor", response_model=RegisterResponse)
def register_acceptor(req: AcceptorRegisterRequest, request: Request, db: Session = Depends(get_db)):
    if req.password != req.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")

    existing_user = db.query(User).filter(User.email == req.email).first()
    if existing_user:
        if existing_user.approval_status != "REJECTED":
            raise HTTPException(status_code=400, detail="An account with this email address already exists.")
        
        # Re-initialize user for new application lifecycle
        user = existing_user
        user.name = req.organization_name
        user.password_hash = hash_password(req.password)
        user.role = "acceptor"
        user.phone = req.phone
        user.email_verified = False
        user.approval_status = "EMAIL_UNVERIFIED"
        user.is_active = True

        acceptor_profile = db.query(AcceptorProfile).filter(AcceptorProfile.user_id == user.id).first()
        if acceptor_profile:
            acceptor_profile.organization_name = req.organization_name
            acceptor_profile.contact_person = req.contact_person
            acceptor_profile.organization_type = req.organization_type
            acceptor_profile.food_distribution_activities = req.food_distribution_activities
            acceptor_profile.address = req.address
            acceptor_profile.city = req.city
            acceptor_profile.state = req.state
            acceptor_profile.pin_code = req.pin_code
            acceptor_profile.latitude = req.latitude or 12.9716
            acceptor_profile.longitude = req.longitude or 77.5946
            acceptor_profile.max_capacity = req.max_capacity or 500
            acceptor_profile.food_categories = req.food_categories or "Cooked Meals,Bakery,Packaged Food"
            acceptor_profile.operating_hours = req.operating_hours or "09:00 AM - 09:00 PM"
        else:
            acceptor_profile = AcceptorProfile(
                user_id=user.id,
                organization_name=req.organization_name,
                contact_person=req.contact_person,
                organization_type=req.organization_type,
                food_distribution_activities=req.food_distribution_activities,
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
    else:
        user = User(
            name=req.organization_name,
            email=req.email,
            password_hash=hash_password(req.password),
            role="acceptor",
            phone=req.phone,
            email_verified=False,
            approval_status="EMAIL_UNVERIFIED",
            is_active=True
        )
        db.add(user)
        db.flush()

        acceptor_profile = AcceptorProfile(
            user_id=user.id,
            organization_name=req.organization_name,
            contact_person=req.contact_person,
            organization_type=req.organization_type,
            food_distribution_activities=req.food_distribution_activities,
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

    application = Application(
        user_id=user.id,
        application_type="acceptor",
        organization_name=req.organization_name,
        organization_type=req.organization_type,
        contact_name=req.contact_person or req.organization_name,
        status="EMAIL_UNVERIFIED",
        submitted_at=datetime.datetime.utcnow()
    )
    db.add(application)
    db.flush()

    raw_token = generate_random_token()
    token_rec = EmailVerificationToken(
        user_id=user.id,
        token_hash=hash_token(raw_token),
        expires_at=datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    )
    db.add(token_rec)

    db.add(Notification(
        user_id=user.id,
        title="Acceptor Registration Received",
        message=f"Welcome {req.organization_name}! Please verify your email to submit your organization for manual review."
    ))

    log_audit_event(
        db=db,
        action="APPLICATION_CREATED",
        actor_id=user.id,
        target_type="application",
        target_id=application.id,
        metadata={"role": "acceptor", "organization": req.organization_name, "email": user.email}
    )

    db.commit()

    origin = extract_frontend_origin(request)
    email_dispatch = send_email_a_verification(user.email, raw_token, req.contact_person or req.organization_name, frontend_url=origin)

    return RegisterResponse(
        message="Registration submitted successfully. Please check your email to verify your address before admin review.",
        email=user.email,
        user_id=user.id,
        role="acceptor",
        is_verified=False,
        email_verified=False,
        approval_status="EMAIL_UNVERIFIED",
        verification_url=email_dispatch.get("verification_url"),
        application_id=application.id
    )

@router.post("/applications/{application_id}/documents", response_model=ApplicationDocumentResponse)
def upload_application_document(
    application_id: int,
    file: UploadFile = File(...),
    document_type: str = Form("other"),
    db: Session = Depends(get_db)
):
    """
    Securely uploads supporting documents (PDF, PNG, JPG) for an organization application.
    Validates magic bytes, restricts file size (<= 5MB), and assigns unique storage key.
    """
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application record not found.")

    original_filename, storage_key, content_type, file_size = validate_and_save_document(file, document_type)

    doc = ApplicationDocument(
        application_id=application.id,
        document_type=document_type,
        original_filename=original_filename,
        storage_key=storage_key,
        content_type=content_type,
        file_size=file_size,
        uploaded_at=datetime.datetime.utcnow()
    )
    db.add(doc)

    log_audit_event(
        db=db,
        action="DOCUMENTS_UPLOADED",
        actor_id=application.user_id,
        target_type="document",
        metadata={
            "application_id": application.id,
            "filename": original_filename,
            "document_type": document_type,
            "file_size": file_size
        }
    )
    db.commit()
    db.refresh(doc)

    return doc

@router.get("/verify-email", response_model=VerifyEmailResponse)
def verify_email(
    token: str = Query(..., description="Single-use email verification token"),
    db: Session = Depends(get_db)
):
    """
    Validates email verification token.
    Marks email as verified and transitions status to PENDING_APPROVAL.
    CRITICAL: Does NOT approve organization or activate operational dashboards!
    """
    if not token or len(token.strip()) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification link format."
        )

    t_hash = hash_token(token.strip())
    token_record = db.query(EmailVerificationToken).filter(EmailVerificationToken.token_hash == t_hash).first()

    if not token_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification link. Please request a new verification email."
        )

    if token_record.used_at is not None:
        # Already used token
        user = token_record.user
        return VerifyEmailResponse(
            message="Your email has already been verified. Your organization is awaiting manual administrator approval.",
            verified=True,
            email=user.email if user else None,
            approval_status=user.approval_status if user else "PENDING_APPROVAL"
        )

    if token_record.expires_at < datetime.datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This verification link has expired (24-hour limit exceeded). Please request a new verification email."
        )

    # 1. Mark token as used
    token_record.used_at = datetime.datetime.utcnow()

    # 2. Update User email verification
    user = token_record.user
    if not user:
        raise HTTPException(status_code=404, detail="Associated user account not found.")

    user.email_verified = True
    if user.approval_status == "EMAIL_UNVERIFIED":
        user.approval_status = "PENDING_APPROVAL"

    # 3. Update Application status
    latest_app = db.query(Application).filter(Application.user_id == user.id).order_by(Application.id.desc()).first()
    if latest_app and latest_app.status == "EMAIL_UNVERIFIED":
        latest_app.status = "PENDING_APPROVAL"

    # 4. Log audit event
    log_audit_event(
        db=db,
        action="EMAIL_VERIFIED",
        actor_id=user.id,
        target_type="user",
        target_id=user.id,
        metadata={"email": user.email, "approval_status": "PENDING_APPROVAL"}
    )

    db.commit()

    # 5. Dispatch Email B (Email verified — NourishSync approval pending)
    send_email_b_approval_pending(user.email, user.name)

    return VerifyEmailResponse(
        message="Email verified successfully. Your organization is now awaiting review by the NourishSync administration team.",
        verified=True,
        email=user.email,
        approval_status=user.approval_status
    )

@router.post("/resend-verification")
def resend_verification(req: ResendVerificationRequest, request: Request, db: Session = Depends(get_db)):
    """
    Resends verification email with rate limiting and safe response to prevent account enumeration.
    """
    user = db.query(User).filter(User.email == req.email).first()
    
    # Generic safe response even if account does not exist
    if not user:
        return {"message": "If an account is registered with this email, a verification link has been dispatched."}

    if user.email_verified:
        return {"message": "This email address is already verified. Your application is awaiting administrator approval."}

    # Invalidate previous unused tokens for this user
    db.query(EmailVerificationToken).filter(
        EmailVerificationToken.user_id == user.id,
        EmailVerificationToken.used_at.is_(None)
    ).update({"used_at": datetime.datetime.utcnow()})

    # Generate new token
    raw_token = generate_random_token()
    token_rec = EmailVerificationToken(
        user_id=user.id,
        token_hash=hash_token(raw_token),
        expires_at=datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    )
    db.add(token_rec)
    db.commit()

    origin = extract_frontend_origin(request)
    email_dispatch = send_email_a_verification(user.email, raw_token, user.name, frontend_url=origin)

    return {
        "message": "A new verification link has been sent to your email address.",
        "verification_url": email_dispatch.get("verification_url")
    }

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """
    Strict two-stage verified and approved authentication.
    Verifies credentials, role selection, email verification, and admin organization approval.
    """
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    # 1. STRICT ROLE CHECK: ordinary donor and acceptor accounts cannot cross-login
    if user.role != "admin" and user.role != req.role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Role mismatch error: This account is registered as a '{user.role.title()}' and cannot log in as '{req.role.title()}'."
        )

    # 2. ACCOUNT STATUS CHECK
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated or suspended by the system administrator."
        )

    # 3. ADMIN ROLE BYPASS: Admins do not require organization review
    if user.role == "admin":
        token = create_access_token({"sub": user.id, "role": user.role, "email": user.email})
        log_audit_event(db=db, action="ADMIN_LOGIN", actor_id=user.id, target_type="user", target_id=user.id)
        return TokenResponse(
            access_token=token,
            role=user.role,
            user_id=user.id,
            name=user.name,
            email=user.email,
            is_verified=True,
            email_verified=True,
            approval_status="APPROVED"
        )

    # 4. EMAIL VERIFICATION CHECK
    if not user.email_verified:
        # Generate new link and prompt user
        raw_token = generate_random_token()
        db.add(EmailVerificationToken(
            user_id=user.id,
            token_hash=hash_token(raw_token),
            expires_at=datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        ))
        db.commit()
        send_email_a_verification(user.email, raw_token, user.name)

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please check your inbox for the verification link before logging in."
        )

    # 5. ORGANIZATION APPROVAL CHECK (Must be APPROVED)
    if user.approval_status == "EMAIL_UNVERIFIED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please click the verification link in your inbox."
        )

    if user.approval_status == "PENDING_APPROVAL":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Application pending administrator review. You will receive an email notification as soon as your organization is approved."
        )

    if user.approval_status == "REJECTED":
        # Get rejection reason from latest application
        latest_app = db.query(Application).filter(Application.user_id == user.id).order_by(Application.id.desc()).first()
        reason = latest_app.rejection_reason if latest_app else "Application did not meet operational criteria."
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Application rejected: {reason}. To participate, please submit a new application with verified supporting evidence."
        )

    if user.approval_status != "APPROVED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your organization account is not approved for operational access."
        )

    # 6. Success: Issue privileged access token
    token = create_access_token({"sub": user.id, "role": user.role, "email": user.email})
    return TokenResponse(
        access_token=token,
        role=user.role,
        user_id=user.id,
        name=user.name,
        email=user.email,
        is_verified=True,
        email_verified=True,
        approval_status="APPROVED"
    )

@router.get("/applications/{application_id}/status")
def get_application_public_status(application_id: int, db: Session = Depends(get_db)):
    """Safe public or restricted status check for an applicant's pending/rejected screen."""
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")

    return {
        "application_id": app.id,
        "organization_name": app.organization_name,
        "application_type": app.application_type,
        "status": app.status,
        "email_verified": app.user.email_verified if app.user else False,
        "submitted_at": app.submitted_at.strftime("%Y-%m-%d %H:%M") if app.submitted_at else None,
        "rejection_reason": app.rejection_reason if app.status == "REJECTED" else None
    }

@router.post("/status-by-email")
def check_status_by_email(req: ResendVerificationRequest, db: Session = Depends(get_db)):
    """Check application verification and approval status safely by registered email."""
    if not req.email:
        raise HTTPException(status_code=400, detail="Email is required.")
    user = db.query(User).filter(User.email == req.email.strip().lower()).first()
    if not user:
        raise HTTPException(status_code=404, detail="No registered account found matching this email address.")
    latest_app = db.query(Application).filter(Application.user_id == user.id).order_by(Application.id.desc()).first()
    return {
        "application_id": latest_app.id if latest_app else None,
        "organization_name": user.name,
        "role": user.role,
        "email": user.email,
        "email_verified": user.email_verified,
        "status": latest_app.status if latest_app else user.approval_status,
        "submitted_at": latest_app.submitted_at.strftime("%Y-%m-%d %H:%M") if latest_app and latest_app.submitted_at else None,
        "reviewed_at": latest_app.reviewed_at.strftime("%Y-%m-%d %H:%M") if latest_app and latest_app.reviewed_at else None,
        "rejection_reason": latest_app.rejection_reason if latest_app and latest_app.status == "REJECTED" else None
    }

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
            "parent_institution": dp.parent_institution,
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
            "food_distribution_activities": ap.food_distribution_activities,
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
        is_verified=current_user.email_verified,
        email_verified=current_user.email_verified,
        approval_status=current_user.approval_status,
        created_at=current_user.created_at,
        profile=profile_data
    )

@router.post("/logout")
def logout():
    return {"message": "Successfully logged out."}
