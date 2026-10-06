from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from backend.app.database.database import get_db
from backend.app.models.models import User, DonorProfile, AcceptorProfile, FoodListing, DonationRequest
from backend.app.auth.auth import require_admin

router = APIRouter(prefix="/api/admin", tags=["Admin Portal"])

@router.get("/dashboard")
def get_admin_dashboard(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    donors_count = db.query(DonorProfile).count()
    acceptors_count = db.query(AcceptorProfile).count()

    total_listings = db.query(FoodListing).count()
    total_requests = db.query(DonationRequest).count()
    completed_donations = db.query(DonationRequest).filter(DonationRequest.status == 'COMPLETED').count()

    users_list = db.query(User).order_by(User.id.desc()).limit(20).all()

    users_data = []
    for u in users_list:
        org_name = u.name
        if u.role == "donor" and u.donor_profile:
            org_name = u.donor_profile.organization_name
        elif u.role == "acceptor" and u.acceptor_profile:
            org_name = u.acceptor_profile.organization_name

        users_data.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "organization_name": org_name,
            "is_active": u.is_active,
            "created_at": u.created_at.strftime("%Y-%m-%d %H:%M")
        })

    return {
        "kpi": {
            "total_users": total_users,
            "donors_count": donors_count,
            "acceptors_count": acceptors_count,
            "total_listings": total_listings,
            "total_requests": total_requests,
            "completed_donations": completed_donations
        },
        "recent_users": users_data
    }

@router.put("/users/{user_id}/toggle-status")
def toggle_user_account_status(user_id: int, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own admin account.")

    user.is_active = not user.is_active
    db.commit()

    status_str = "activated" if user.is_active else "deactivated"
    return {"message": f"User account {user.email} has been {status_str}.", "is_active": user.is_active}
