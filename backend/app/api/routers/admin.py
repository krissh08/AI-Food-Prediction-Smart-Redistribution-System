import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.app.database.database import get_db
from backend.app.models.models import (
    User,
    DonorProfile,
    AcceptorProfile,
    FoodListing,
    DonationRequest,
    Application,
    ApplicationDocument,
    AuditLog
)
from backend.app.schemas.schemas import (
    ApplicationListResponse,
    ApplicationDetailResponse,
    ApproveApplicationRequest,
    RejectApplicationRequest,
    AuditLogResponse
)
from backend.app.auth.auth import require_admin, log_audit_event
from backend.app.services.email_service import (
    send_email_c_organization_approved,
    send_email_d_organization_rejected
)
from backend.app.services.document_service import get_document_path

router = APIRouter(prefix="/api/admin", tags=["Admin Portal & Verification"])

@router.get("/dashboard")
def get_admin_dashboard(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Summary overview metrics and recent applications for administrator portal."""
    total_users = db.query(User).count()
    donors_count = db.query(DonorProfile).count()
    acceptors_count = db.query(AcceptorProfile).count()

    total_listings = db.query(FoodListing).count()
    total_requests = db.query(DonationRequest).count()
    completed_donations = db.query(DonationRequest).filter(DonationRequest.status == 'COMPLETED').count()

    pending_apps = db.query(Application).filter(Application.status == 'PENDING_APPROVAL').count()
    approved_apps = db.query(Application).filter(Application.status == 'APPROVED').count()
    rejected_apps = db.query(Application).filter(Application.status == 'REJECTED').count()
    total_audit_events = db.query(AuditLog).count()

    # Recent applications
    recent_apps = db.query(Application).order_by(Application.id.desc()).limit(15).all()
    apps_data = []
    for a in recent_apps:
        apps_data.append({
            "id": a.id,
            "organization_name": a.organization_name,
            "application_type": a.application_type,
            "account_role": a.application_type,
            "organization_type": a.organization_type,
            "contact_name": a.contact_name,
            "status": a.status,
            "email": a.user.email if a.user else "N/A",
            "email_verified": a.user.email_verified if a.user else False,
            "submitted_at": a.submitted_at.strftime("%Y-%m-%d %H:%M") if a.submitted_at else "N/A",
            "reviewed_at": a.reviewed_at.strftime("%Y-%m-%d %H:%M") if a.reviewed_at else None,
            "reviewed_by_admin": a.reviewer.name if a.reviewer else "Admin",
            "rejection_reason": a.rejection_reason,
            "documents_count": len(a.documents)
        })

    # All Platform Users for User Management Tabs
    all_users = db.query(User).order_by(User.id.asc()).all()
    users_data = []
    for u in all_users:
        org_name = u.name
        if u.role == "donor" and u.donor_profile:
            org_name = u.donor_profile.organization_name
        elif u.role == "acceptor" and u.acceptor_profile:
            org_name = u.acceptor_profile.organization_name

        users_data.append({
            "id": u.id,
            "organization_name": org_name,
            "email": u.email,
            "role": u.role,
            "phone": u.phone,
            "is_active": u.is_active,
            "email_verified": u.email_verified,
            "approval_status": u.approval_status,
            "created_at": u.created_at.strftime("%Y-%m-%d %H:%M") if u.created_at else "N/A"
        })

    return {
        "kpi": {
            "total_users": total_users,
            "donors_count": donors_count,
            "acceptors_count": acceptors_count,
            "total_listings": total_listings,
            "total_requests": total_requests,
            "completed_donations": completed_donations,
            "pending_applications": pending_apps,
            "approved_applications": approved_apps,
            "rejected_applications": rejected_apps,
            "audit_events_count": total_audit_events
        },
        "recent_applications": apps_data,
        "recent_users": users_data
    }

@router.get("/applications", response_model=List[ApplicationListResponse])
def list_applications(
    status_filter: Optional[str] = Query(None, alias="status"),
    role_filter: Optional[str] = Query(None, alias="role"),
    search: Optional[str] = None,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Lists organization applications with filtering by status, role, and search query.
    """
    query = db.query(Application)

    if status_filter and status_filter.upper() != "ALL":
        query = query.filter(Application.status == status_filter.upper())

    if role_filter and role_filter.lower() != "all":
        query = query.filter(Application.application_type == role_filter.lower())

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (Application.organization_name.ilike(s)) |
            (Application.contact_name.ilike(s)) |
            (Application.user.has(User.email.ilike(s)))
        )

    apps = query.order_by(Application.id.desc()).all()

    results = []
    for a in apps:
        results.append(ApplicationListResponse(
            id=a.id,
            user_id=a.user_id,
            application_type=a.application_type,
            account_role=a.application_type,
            organization_name=a.organization_name,
            organization_type=a.organization_type,
            contact_name=a.contact_name,
            email=a.user.email if a.user else "N/A",
            status=a.status,
            submitted_at=a.submitted_at,
            reviewed_at=a.reviewed_at,
            reviewed_by_admin=a.reviewer.name if a.reviewer else None,
            rejection_reason=a.rejection_reason,
            documents_count=len(a.documents),
            email_verified=a.user.email_verified if a.user else False
        ))

    return results

@router.get("/applications/{application_id}", response_model=ApplicationDetailResponse)
def get_application_details(
    application_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Retrieves full application details, applicant profile, and submitted documents list."""
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application record not found.")

    user = app.user
    address = None
    city = None
    state = None
    pin_code = None
    parent_institution = None
    food_distribution_activities = None

    if app.application_type == "donor" and user and user.donor_profile:
        dp = user.donor_profile
        address = dp.address
        city = dp.city
        state = dp.state
        pin_code = dp.pin_code
        parent_institution = dp.parent_institution
    elif app.application_type == "acceptor" and user and user.acceptor_profile:
        ap = user.acceptor_profile
        address = ap.address
        city = ap.city
        state = ap.state
        pin_code = ap.pin_code
        food_distribution_activities = ap.food_distribution_activities

    docs = []
    for d in app.documents:
        docs.append({
            "id": d.id,
            "document_type": d.document_type,
            "original_filename": d.original_filename,
            "content_type": d.content_type,
            "file_size": d.file_size,
            "uploaded_at": d.uploaded_at
        })

    return ApplicationDetailResponse(
        id=app.id,
        user_id=app.user_id,
        application_type=app.application_type,
        account_role=app.application_type,
        organization_name=app.organization_name,
        organization_type=app.organization_type,
        contact_name=app.contact_name,
        email=user.email if user else "N/A",
        phone=user.phone if user else None,
        status=app.status,
        rejection_reason=app.rejection_reason,
        admin_notes=app.admin_notes,
        submitted_at=app.submitted_at,
        reviewed_at=app.reviewed_at,
        email_verified=user.email_verified if user else False,
        address=address,
        city=city,
        state=state,
        pin_code=pin_code,
        parent_institution=parent_institution,
        food_distribution_activities=food_distribution_activities,
        documents=docs
    )

@router.get("/applications/{application_id}/documents/{document_id}")
def view_application_document(
    application_id: int,
    document_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Secure endpoint allowing authenticated administrators to view or download
    an applicant's uploaded verification evidence.
    Non-admin access is rejected.
    """
    doc = db.query(ApplicationDocument).filter(
        ApplicationDocument.id == document_id,
        ApplicationDocument.application_id == application_id
    ).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    file_path = get_document_path(doc.storage_key)
    return FileResponse(
        path=file_path,
        media_type=doc.content_type,
        filename=doc.original_filename
    )

@router.post("/applications/{application_id}/approve")
def approve_application(
    application_id: int,
    req: ApproveApplicationRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Approves an organization application.
    Requires that the applicant has verified their email address and that status is PENDING_APPROVAL.
    Activates the organization account and transmits Email C.
    """
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application record not found.")

    user = app.user
    if not user:
        raise HTTPException(status_code=404, detail="Associated applicant account not found.")

    if not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot approve application: Applicant has not yet verified their email address."
        )

    if app.status == "APPROVED":
        return {"message": "Application is already approved.", "status": "APPROVED"}

    if app.status == "REJECTED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rejected applications cannot be re-opened. The applicant must submit a new application."
        )

    # 1. Update Application
    app.status = "APPROVED"
    app.reviewed_at = datetime.datetime.utcnow()
    app.reviewed_by = current_user.id
    if req.admin_notes:
        app.admin_notes = req.admin_notes

    # 2. Activate User account and update approval status
    user.approval_status = "APPROVED"
    user.is_active = True

    # 3. Log audit event
    log_audit_event(
        db=db,
        action="APPLICATION_APPROVED",
        actor_id=current_user.id,
        target_type="application",
        target_id=app.id,
        metadata={
            "applicant_email": user.email,
            "organization_name": app.organization_name,
            "role": app.application_type,
            "admin_notes": req.admin_notes
        }
    )

    db.commit()

    # 4. Dispatch Email C (Organization approved)
    send_email_c_organization_approved(
        email=user.email,
        contact_name=app.contact_name or user.name,
        role=app.application_type
    )

    return {
        "message": f"Application #{app.id} for '{app.organization_name}' has been successfully approved.",
        "status": "APPROVED",
        "user_email": user.email
    }

@router.post("/applications/{application_id}/reject")
def reject_application(
    application_id: int,
    req: RejectApplicationRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Rejects an organization application with an explicit reason.
    Permanently marks application as REJECTED, closes application, and transmits Email D.
    """
    if not req.rejection_reason or len(req.rejection_reason.strip()) < 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A substantive rejection reason is required (minimum 5 characters)."
        )

    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application record not found.")

    user = app.user
    if not user:
        raise HTTPException(status_code=404, detail="Associated applicant account not found.")

    if app.status == "REJECTED":
        return {"message": "Application is already rejected.", "status": "REJECTED"}

    # 1. Update Application status
    app.status = "REJECTED"
    app.rejection_reason = req.rejection_reason.strip()
    app.reviewed_at = datetime.datetime.utcnow()
    app.reviewed_by = current_user.id
    if req.admin_notes:
        app.admin_notes = req.admin_notes

    # 2. Update User approval status
    user.approval_status = "REJECTED"

    # 3. Log audit event
    log_audit_event(
        db=db,
        action="APPLICATION_REJECTED",
        actor_id=current_user.id,
        target_type="application",
        target_id=app.id,
        metadata={
            "applicant_email": user.email,
            "organization_name": app.organization_name,
            "role": app.application_type,
            "reason": req.rejection_reason.strip()
        }
    )

    db.commit()

    # 4. Dispatch Email D (Organization rejected)
    send_email_d_organization_rejected(
        email=user.email,
        contact_name=app.contact_name or user.name,
        reason=req.rejection_reason.strip()
    )

    return {
        "message": f"Application #{app.id} for '{app.organization_name}' has been rejected.",
        "status": "REJECTED",
        "reason": req.rejection_reason.strip()
    }

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    limit: int = 50,
    action: Optional[str] = None,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Returns chronologically ordered audit logs for verification and security actions."""
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action.upper())

    logs = query.order_by(AuditLog.id.desc()).limit(limit).all()

    import json
    result = []
    for l in logs:
        meta = None
        if l.metadata_json:
            try:
                meta = json.loads(l.metadata_json)
            except Exception:
                meta = {"raw": l.metadata_json}

        result.append(AuditLogResponse(
            id=l.id,
            actor_id=l.actor_id,
            actor_name=l.actor.name if l.actor else "System",
            action=l.action,
            target_type=l.target_type,
            target_id=l.target_id,
            metadata=meta,
            created_at=l.created_at
        ))

    return result

@router.put("/users/{user_id}/toggle-status")
def toggle_user_account_status(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own admin account.")

    user.is_active = not user.is_active

    log_audit_event(
        db=db,
        action="ACCOUNT_STATUS_TOGGLED",
        actor_id=current_user.id,
        target_type="user",
        target_id=user.id,
        metadata={"email": user.email, "is_active": user.is_active}
    )

    db.commit()

    status_str = "activated" if user.is_active else "deactivated"
    return {"message": f"User account {user.email} has been {status_str}.", "is_active": user.is_active}
