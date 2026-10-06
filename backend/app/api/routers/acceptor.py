from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.app.database.database import get_db
from backend.app.models.models import User, AcceptorProfile, FoodListing, DonationRequest, Pickup, Notification
from backend.app.schemas.schemas import FoodListingResponse, DonationRequestCreate, DonationRequestResponse
from backend.app.auth.auth import require_acceptor
from backend.app.services.matching import calculate_smart_match_score, calculate_haversine_distance

router = APIRouter(prefix="/api/acceptor", tags=["Acceptor Management"])

@router.get("/dashboard")
def get_acceptor_dashboard(current_user: User = Depends(require_acceptor), db: Session = Depends(get_db)):
    acceptor_profile = current_user.acceptor_profile
    if not acceptor_profile:
        raise HTTPException(status_code=404, detail="Acceptor profile not found.")

    available_listings = db.query(FoodListing).filter(FoodListing.status == 'AVAILABLE').all()
    
    requests = db.query(DonationRequest).filter(DonationRequest.acceptor_id == acceptor_profile.id).all()

    pending_requests = [r for r in requests if r.status == 'REQUESTED']
    accepted_donations = [r for r in requests if r.status in ['APPROVED', 'PICKUP_SCHEDULED', 'COMPLETED']]
    completed_requests = [r for r in requests if r.status == 'COMPLETED']

    total_food_received = sum([r.requested_quantity for r in completed_requests])

    # Today's Pickups
    todays_pickups = []
    for r in requests:
        if r.pickup and r.pickup.pickup_status in ['SCHEDULED', 'COLLECTED']:
            todays_pickups.append({
                "pickup_id": r.pickup.id,
                "food_name": r.food_listing.food_name,
                "quantity": r.requested_quantity,
                "donor_organization": r.food_listing.donor.organization_name,
                "pickup_address": r.food_listing.pickup_address,
                "pickup_time": r.pickup.pickup_time,
                "pickup_status": r.pickup.pickup_status
            })

    # Nearby map markers
    map_markers = []
    for l in available_listings[:15]:
        dist = calculate_haversine_distance(acceptor_profile.latitude, acceptor_profile.longitude, l.latitude, l.longitude)
        match = calculate_smart_match_score(l, acceptor_profile)
        map_markers.append({
            "id": l.id,
            "food_name": l.food_name,
            "quantity": l.quantity,
            "unit": l.unit,
            "category": l.category,
            "donor_name": l.donor.organization_name,
            "latitude": l.latitude,
            "longitude": l.longitude,
            "distance_km": dist,
            "match_score": match["match_score"],
            "expiry_time": l.expiry_time
        })

    return {
        "acceptor_name": current_user.name,
        "organization_name": acceptor_profile.organization_name,
        "kpi_cards": {
            "available_donations": len(available_listings),
            "nearby_food_count": len([m for m in map_markers if m["distance_km"] <= 10.0]),
            "pending_requests": len(pending_requests),
            "accepted_donations": len(accepted_donations),
            "todays_pickups_count": len(todays_pickups),
            "total_food_received_meals": total_food_received
        },
        "map_markers": map_markers,
        "expiring_soon": [m for m in map_markers if "1" in m["expiry_time"] or "2" in m["expiry_time"] or "hour" in m["expiry_time"].lower()][:5],
        "todays_pickups": todays_pickups
    }

@router.get("/available-food", response_model=List[FoodListingResponse])
def get_available_food(
    category: Optional[str] = None,
    dietary_type: Optional[str] = None,
    max_distance_km: Optional[float] = None,
    min_quantity: Optional[int] = None,
    current_user: User = Depends(require_acceptor),
    db: Session = Depends(get_db)
):
    acceptor_profile = current_user.acceptor_profile
    query = db.query(FoodListing).filter(FoodListing.status == 'AVAILABLE')

    if category and category != 'All':
        query = query.filter(FoodListing.category == category)
    if dietary_type and dietary_type != 'All':
        query = query.filter(FoodListing.dietary_type == dietary_type)
    if min_quantity:
        query = query.filter(FoodListing.quantity >= min_quantity)

    listings = query.order_by(FoodListing.id.desc()).all()

    result = []
    for l in listings:
        dist = calculate_haversine_distance(acceptor_profile.latitude, acceptor_profile.longitude, l.latitude, l.longitude)
        if max_distance_km and dist > max_distance_km:
            continue

        match = calculate_smart_match_score(l, acceptor_profile)

        res_item = FoodListingResponse(
            id=l.id,
            donor_id=l.donor_id,
            food_name=l.food_name,
            category=l.category,
            quantity=l.quantity,
            unit=l.unit,
            preparation_time=l.preparation_time,
            expiry_time=l.expiry_time,
            dietary_type=l.dietary_type,
            status=l.status,
            pickup_address=l.pickup_address,
            latitude=l.latitude,
            longitude=l.longitude,
            notes=l.notes,
            created_at=l.created_at,
            donor_organization=l.donor.organization_name if l.donor else "Donor Org",
            distance_km=dist,
            match_score=match["match_score"]
        )
        result.append(res_item)

    # Sort by match score descending
    result.sort(key=lambda x: x.match_score or 0, reverse=True)
    return result

@router.post("/request-food", response_model=DonationRequestResponse)
def request_food_donation(req: DonationRequestCreate, current_user: User = Depends(require_acceptor), db: Session = Depends(get_db)):
    acceptor_profile = current_user.acceptor_profile

    listing = db.query(FoodListing).filter(FoodListing.id == req.food_listing_id).first()
    if not listing or listing.status != 'AVAILABLE':
        raise HTTPException(status_code=400, detail="Food listing is no longer available.")

    if req.requested_quantity > listing.quantity:
        raise HTTPException(status_code=400, detail=f"Requested quantity ({req.requested_quantity}) exceeds available quantity ({listing.quantity}).")

    existing_req = db.query(DonationRequest).filter(
        DonationRequest.food_listing_id == listing.id,
        DonationRequest.acceptor_id == acceptor_profile.id,
        DonationRequest.status.in_(['REQUESTED', 'APPROVED'])
    ).first()

    if existing_req:
        raise HTTPException(status_code=400, detail="You have already submitted a active request for this food listing.")

    donation_req = DonationRequest(
        food_listing_id=listing.id,
        acceptor_id=acceptor_profile.id,
        requested_quantity=req.requested_quantity,
        status="REQUESTED",
        notes=req.notes
    )
    db.add(donation_req)

    # Update listing status to REQUESTED
    listing.status = "REQUESTED"

    # Notify Donor
    donor_user_id = listing.donor.user_id
    donor_notif = Notification(
        user_id=donor_user_id,
        title="New Food Request Received!",
        message=f"{acceptor_profile.organization_name} has requested {req.requested_quantity} {listing.unit} of '{listing.food_name}'."
    )
    db.add(donor_notif)

    db.commit()
    db.refresh(donation_req)

    return DonationRequestResponse(
        id=donation_req.id,
        food_listing_id=donation_req.food_listing_id,
        acceptor_id=donation_req.acceptor_id,
        requested_quantity=donation_req.requested_quantity,
        status=donation_req.status,
        notes=donation_req.notes,
        requested_at=donation_req.requested_at,
        food_name=listing.food_name,
        category=listing.category,
        donor_organization=listing.donor.organization_name,
        acceptor_organization=acceptor_profile.organization_name,
        pickup_address=listing.pickup_address
    )
