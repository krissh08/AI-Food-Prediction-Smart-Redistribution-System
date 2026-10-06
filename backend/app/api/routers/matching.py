from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from backend.app.database.database import get_db
from backend.app.models.models import FoodListing, AcceptorProfile, User
from backend.app.auth.auth import get_current_user
from backend.app.services.matching import calculate_smart_match_score

router = APIRouter(prefix="/api/matching", tags=["Smart Food Matching"])

@router.get("/recommendations/{food_id}")
def get_matching_acceptors(food_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    listing = db.query(FoodListing).filter(FoodListing.id == food_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Food listing not found.")

    acceptors = db.query(AcceptorProfile).join(User).filter(User.is_active == True).all()

    rankings = []
    for acc in acceptors:
        match_info = calculate_smart_match_score(listing, acc)
        rankings.append({
            "acceptor_id": acc.id,
            "organization_name": acc.organization_name,
            "organization_type": acc.organization_type,
            "contact_person": acc.contact_person,
            "phone": acc.user.phone or "N/A",
            "city": acc.city,
            "max_capacity": acc.max_capacity,
            "operating_hours": acc.operating_hours,
            "distance_km": match_info["distance_km"],
            "match_score": match_info["match_score"],
            "score_breakdown": match_info["breakdown"]
        })

    rankings.sort(key=lambda x: x["match_score"], reverse=True)
    return {
        "food_listing_id": listing.id,
        "food_name": listing.food_name,
        "quantity": listing.quantity,
        "category": listing.category,
        "donor_location": f"{listing.pickup_address}",
        "best_match": rankings[0] if rankings else None,
        "recommended_acceptors": rankings[:10]
    }
