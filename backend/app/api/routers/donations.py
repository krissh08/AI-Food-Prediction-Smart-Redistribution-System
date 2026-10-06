import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.app.database.database import get_db
from backend.app.models.models import User, FoodListing, DonationRequest, Pickup, Notification
from backend.app.schemas.schemas import DonationRequestResponse, DonationRequestAction
from backend.app.auth.auth import get_current_user

router = APIRouter(prefix="/api/donations", tags=["Donations & Pickups Workflow"])

@router.get("", response_model=List[DonationRequestResponse])
def get_donations_list(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(DonationRequest)

    if current_user.role == "donor":
        donor_profile = current_user.donor_profile
        listing_ids = [l.id for l in db.query(FoodListing).filter(FoodListing.donor_id == donor_profile.id).all()]
        query = query.filter(DonationRequest.food_listing_id.in_(listing_ids)) if listing_ids else query.filter(False)
    elif current_user.role == "acceptor":
        acceptor_profile = current_user.acceptor_profile
        query = query.filter(DonationRequest.acceptor_id == acceptor_profile.id)

    if status_filter:
        query = query.filter(DonationRequest.status == status_filter)

    requests = query.order_by(DonationRequest.id.desc()).all()

    result = []
    for r in requests:
        result.append(DonationRequestResponse(
            id=r.id,
            food_listing_id=r.food_listing_id,
            acceptor_id=r.acceptor_id,
            requested_quantity=r.requested_quantity,
            status=r.status,
            notes=r.notes,
            pickup_time=r.pickup_time,
            requested_at=r.requested_at,
            approved_at=r.approved_at,
            food_name=r.food_listing.food_name if r.food_listing else "Food Item",
            category=r.food_listing.category if r.food_listing else "General",
            donor_organization=r.food_listing.donor.organization_name if (r.food_listing and r.food_listing.donor) else "Donor Org",
            acceptor_organization=r.acceptor.organization_name if r.acceptor else "Acceptor Org",
            pickup_address=r.food_listing.pickup_address if r.food_listing else "N/A"
        ))
    return result

@router.get("/{request_id}", response_model=DonationRequestResponse)
def get_donation_detail(request_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    req = db.query(DonationRequest).filter(DonationRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Donation request not found.")

    return DonationRequestResponse(
        id=req.id,
        food_listing_id=req.food_listing_id,
        acceptor_id=req.acceptor_id,
        requested_quantity=req.requested_quantity,
        status=req.status,
        notes=req.notes,
        pickup_time=req.pickup_time,
        requested_at=req.requested_at,
        approved_at=req.approved_at,
        food_name=req.food_listing.food_name if req.food_listing else "Food Item",
        category=req.food_listing.category if req.food_listing else "General",
        donor_organization=req.food_listing.donor.organization_name if (req.food_listing and req.food_listing.donor) else "Donor Org",
        acceptor_organization=req.acceptor.organization_name if req.acceptor else "Acceptor Org",
        pickup_address=req.food_listing.pickup_address if req.food_listing else "N/A"
    )

@router.put("/{request_id}/approve")
def approve_donation_request(
    request_id: int,
    action: DonationRequestAction,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    req = db.query(DonationRequest).filter(DonationRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Donation request not found.")

    if current_user.role != "donor":
        raise HTTPException(status_code=403, detail="Only food donors can approve requests.")

    req.status = "APPROVED"
    req.approved_at = datetime.datetime.utcnow()
    req.pickup_time = action.pickup_time or "Within 2 hours"

    listing = req.food_listing
    listing.status = "APPROVED"

    # Create Pickup record
    pickup = Pickup(
        donation_request_id=req.id,
        pickup_time=req.pickup_time,
        pickup_status="SCHEDULED",
        notes=action.notes or "Pickup approved by donor."
    )
    db.add(pickup)

    # Notify Acceptor
    acceptor_user_id = req.acceptor.user_id
    notif = Notification(
        user_id=acceptor_user_id,
        title="Donation Request Approved!",
        message=f"Great news! Your request for '{listing.food_name}' was approved by {listing.donor.organization_name}. Scheduled pickup time: {req.pickup_time}."
    )
    db.add(notif)

    db.commit()
    return {"message": "Donation request approved and pickup scheduled.", "status": req.status}

@router.put("/{request_id}/reject")
def reject_donation_request(request_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    req = db.query(DonationRequest).filter(DonationRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Donation request not found.")

    if current_user.role != "donor":
        raise HTTPException(status_code=403, detail="Only food donors can reject requests.")

    req.status = "REJECTED"
    listing = req.food_listing
    listing.status = "AVAILABLE" # Return listing to available pool

    # Notify Acceptor
    acceptor_user_id = req.acceptor.user_id
    notif = Notification(
        user_id=acceptor_user_id,
        title="Donation Request Update",
        message=f"Unfortunately, your request for '{listing.food_name}' was declined by {listing.donor.organization_name}."
    )
    db.add(notif)

    db.commit()
    return {"message": "Donation request rejected.", "status": req.status}

@router.put("/{request_id}/confirm-pickup")
def confirm_pickup_collection(request_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    req = db.query(DonationRequest).filter(DonationRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Donation request not found.")

    req.status = "COMPLETED"
    if req.food_listing:
        req.food_listing.status = "COMPLETED"

    if req.pickup:
        req.pickup.pickup_status = "COLLECTED"
        req.pickup.confirmed_at = datetime.datetime.utcnow()

    # Notify both parties
    donor_notif = Notification(
        user_id=req.food_listing.donor.user_id,
        title="Donation Completed & Picked Up!",
        message=f"{req.acceptor.organization_name} has confirmed collection of '{req.food_listing.food_name}'. Thank you for reducing food waste!"
    )
    acceptor_notif = Notification(
        user_id=req.acceptor.user_id,
        title="Pickup Completed!",
        message=f"Pickup of '{req.food_listing.food_name}' confirmed. Thank you for redistributing food to the community."
    )
    db.add(donor_notif)
    db.add(acceptor_notif)

    db.commit()
    return {"message": "Pickup confirmed and donation completed!", "status": req.status}
