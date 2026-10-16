from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import datetime
import json

from backend.app.database.database import get_db
from backend.app.models.models import User, DonorProfile, FoodListing, DonationRequest, Pickup, AIPrediction
from backend.app.schemas.schemas import FoodListingCreate, FoodListingResponse
from backend.app.auth.auth import require_donor

router = APIRouter(prefix="/api/donor", tags=["Donor Management"])

@router.get("/dashboard")
def get_donor_dashboard(current_user: User = Depends(require_donor), db: Session = Depends(get_db)):
    donor_profile = current_user.donor_profile
    if not donor_profile:
        raise HTTPException(status_code=404, detail="Donor profile not found.")

    listings = db.query(FoodListing).filter(FoodListing.donor_id == donor_profile.id).all()
    listing_ids = [l.id for l in listings]

    active_donations = len([l for l in listings if l.status in ['AVAILABLE', 'REQUESTED', 'APPROVED', 'PICKUP_SCHEDULED']])
    completed_donations = len([l for l in listings if l.status == 'COMPLETED'])
    
    total_food_saved_meals = sum([l.quantity for l in listings if l.status == 'COMPLETED'])

    # Recent AI Predictions from trained model
    latest_pred = db.query(AIPrediction).filter(AIPrediction.donor_id == donor_profile.id).order_by(AIPrediction.id.desc()).first()
    recent_preds_db = db.query(AIPrediction).filter(AIPrediction.donor_id == donor_profile.id).order_by(AIPrediction.id.desc()).limit(5).all()

    predicted_demand = latest_pred.predicted_demand if latest_pred else 0
    predicted_surplus = latest_pred.predicted_surplus if latest_pred else 0
    todays_prepared = (latest_pred.predicted_demand + latest_pred.predicted_surplus) if latest_pred else 0

    recent_predictions = []
    for p in recent_preds_db:
        try:
            inp = json.loads(p.input_data)
        except Exception:
            inp = {}
        recent_predictions.append({
            "id": p.id,
            "quantity_of_food": inp.get("quantity_of_food") or inp.get("meals_planned", 0),
            "number_of_guests": inp.get("number_of_guests") or inp.get("expected_customers", 0),
            "type_of_food": inp.get("type_of_food") or inp.get("food_category", "Standard"),
            "predicted_surplus": p.predicted_surplus,
            "estimated_consumption": p.predicted_demand,
            "created_at": p.created_at.strftime("%Y-%m-%d %H:%M")
        })

    # Pending Requests
    pending_requests_db = db.query(DonationRequest).filter(
        DonationRequest.food_listing_id.in_(listing_ids),
        DonationRequest.status == 'REQUESTED'
    ).all() if listing_ids else []

    pending_requests = []
    for r in pending_requests_db:
        pending_requests.append({
            "request_id": r.id,
            "food_listing_id": r.food_listing_id,
            "food_name": r.food_listing.food_name,
            "requested_quantity": r.requested_quantity,
            "acceptor_name": r.acceptor.organization_name,
            "requested_at": r.requested_at.strftime("%Y-%m-%d %H:%M")
        })

    # Upcoming Pickups
    upcoming_pickups_db = db.query(Pickup).join(DonationRequest).filter(
        DonationRequest.food_listing_id.in_(listing_ids),
        Pickup.pickup_status == 'SCHEDULED'
    ).all() if listing_ids else []

    upcoming_pickups = []
    for p in upcoming_pickups_db:
        upcoming_pickups.append({
            "pickup_id": p.id,
            "food_name": p.donation_request.food_listing.food_name,
            "acceptor_name": p.donation_request.acceptor.organization_name,
            "pickup_time": p.pickup_time,
            "contact_phone": p.donation_request.acceptor.user.phone or "N/A"
        })

    # Authentic Surplus by Food Category from this donor's actual listings
    category_counts = {}
    for l in listings:
        cat = l.category or "Other"
        category_counts[cat] = category_counts.get(cat, 0) + l.quantity

    total_listed_qty = sum(category_counts.values())
    surplus_by_category = []
    if total_listed_qty > 0:
        for cat, qty in category_counts.items():
            pct = round((qty / total_listed_qty) * 100, 1)
            saved = sum([l.quantity for l in listings if l.category == cat and l.status == 'COMPLETED'])
            surplus_by_category.append({
                "category": cat,
                "surplus_pct": pct,
                "units_saved": saved
            })

    # Authentic Monthly Surplus Redistribution Trend for this donor
    now = datetime.datetime.now()
    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    months_map = {}
    for i in range(5, -1, -1):
        m_idx = (now.month - 1 - i) % 12
        m_name = month_names[m_idx]
        months_map[m_name] = {
            "month": m_name,
            "prepared": 0,
            "consumed": 0,
            "surplus_saved": 0,
            "surplus_uncollected": 0,
            "wasted": 0
        }

    for l in listings:
        m_name = l.created_at.strftime("%b")
        if m_name in months_map:
            months_map[m_name]["prepared"] += l.quantity
            if l.status == 'COMPLETED':
                months_map[m_name]["surplus_saved"] += l.quantity
            elif l.status in ['EXPIRED', 'CANCELLED']:
                months_map[m_name]["surplus_uncollected"] += l.quantity
                months_map[m_name]["wasted"] += l.quantity

    curr_month = now.strftime("%b")
    if latest_pred and curr_month in months_map:
        months_map[curr_month]["consumed"] = latest_pred.predicted_demand

    monthly_trend = list(months_map.values())

    return {
        "donor_name": current_user.name,
        "organization_name": donor_profile.organization_name,
        "kpi_cards": {
            "todays_prepared_meals": todays_prepared,
            "predicted_demand": predicted_demand,
            "predicted_surplus": predicted_surplus,
            "ai_predicted_surplus": predicted_surplus,
            "available_food_listings": active_donations,
            "active_donations": active_donations,
            "completed_donations": completed_donations,
            "food_saved_meals": total_food_saved_meals,
            "total_surplus_redistributed": total_food_saved_meals
        },
        "recent_listings": [
            {
                "id": l.id,
                "food_name": l.food_name,
                "quantity": l.quantity,
                "unit": l.unit,
                "category": l.category,
                "status": l.status,
                "expiry_time": l.expiry_time
            } for l in sorted(listings, key=lambda x: x.id, reverse=True)[:5]
        ],
        "recent_predictions": recent_predictions,
        "surplus_by_category": surplus_by_category,
        "pending_requests": pending_requests,
        "upcoming_pickups": upcoming_pickups,
        "monthly_trend": monthly_trend
    }

@router.post("/food", response_model=FoodListingResponse)
def create_food_listing(req: FoodListingCreate, current_user: User = Depends(require_donor), db: Session = Depends(get_db)):
    donor_profile = current_user.donor_profile
    if not donor_profile:
        raise HTTPException(status_code=404, detail="Donor profile not found.")

    listing = FoodListing(
        donor_id=donor_profile.id,
        food_name=req.food_name,
        category=req.category,
        quantity=req.quantity,
        unit=req.unit or "meals",
        preparation_time=req.preparation_time,
        expiry_time=req.expiry_time,
        dietary_type=req.dietary_type or "Vegetarian",
        pickup_address=req.pickup_address,
        latitude=req.latitude or donor_profile.latitude,
        longitude=req.longitude or donor_profile.longitude,
        notes=req.notes,
        status="AVAILABLE"
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)

    return FoodListingResponse(
        id=listing.id,
        donor_id=listing.donor_id,
        food_name=listing.food_name,
        category=listing.category,
        quantity=listing.quantity,
        unit=listing.unit,
        preparation_time=listing.preparation_time,
        expiry_time=listing.expiry_time,
        dietary_type=listing.dietary_type,
        status=listing.status,
        pickup_address=listing.pickup_address,
        latitude=listing.latitude,
        longitude=listing.longitude,
        notes=listing.notes,
        created_at=listing.created_at,
        donor_organization=donor_profile.organization_name
    )

@router.get("/food", response_model=List[FoodListingResponse])
def get_donor_food_listings(current_user: User = Depends(require_donor), db: Session = Depends(get_db)):
    donor_profile = current_user.donor_profile
    listings = db.query(FoodListing).filter(FoodListing.donor_id == donor_profile.id).order_by(FoodListing.id.desc()).all()

    res = []
    for l in listings:
        res.append(FoodListingResponse(
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
            donor_organization=donor_profile.organization_name
        ))
    return res

@router.delete("/food/{listing_id}")
def delete_food_listing(listing_id: int, current_user: User = Depends(require_donor), db: Session = Depends(get_db)):
    donor_profile = current_user.donor_profile
    listing = db.query(FoodListing).filter(FoodListing.id == listing_id, FoodListing.donor_id == donor_profile.id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Food listing not found or unauthorized.")

    listing.status = "CANCELLED"
    db.commit()
    return {"message": "Food listing cancelled successfully."}
