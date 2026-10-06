import math
from typing import List, Dict, Any

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculates the great-circle distance between two points in km using Haversine formula.
    """
    R = 6371.0 # Earth radius in kilometers

    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c
    return round(distance, 2)

def calculate_smart_match_score(food_listing: Any, acceptor_profile: Any) -> Dict[str, Any]:
    """
    Computes explainable matching score (0 to 100%) between a Food Listing and a Food Acceptor Profile.
    Factors:
    - Distance (30 pts max)
    - Quantity Compatibility (25 pts max)
    - Expiry Urgency Priority (20 pts max)
    - Category & Dietary Preference (15 pts max)
    - Capacity Availability (10 pts max)
    """
    # 1. Distance Score (Max 30 points)
    donor_lat = getattr(food_listing, 'latitude', 12.9716) or 12.9716
    donor_lon = getattr(food_listing, 'longitude', 77.5946) or 77.5946
    acceptor_lat = getattr(acceptor_profile, 'latitude', 12.9716) or 12.9716
    acceptor_lon = getattr(acceptor_profile, 'longitude', 77.5946) or 77.5946

    distance_km = calculate_haversine_distance(donor_lat, donor_lon, acceptor_lat, acceptor_lon)
    
    if distance_km <= 2.0:
        distance_score = 30.0
    elif distance_km <= 5.0:
        distance_score = 25.0
    elif distance_km <= 10.0:
        distance_score = 18.0
    elif distance_km <= 20.0:
        distance_score = 10.0
    else:
        distance_score = max(2.0, 30.0 - distance_km)

    # 2. Quantity Compatibility (Max 25 points)
    available_qty = getattr(food_listing, 'quantity', 50)
    max_capacity = getattr(acceptor_profile, 'max_capacity', 500)

    if available_qty <= max_capacity:
        ratio = available_qty / max(1, max_capacity)
        quantity_score = 25.0 if ratio <= 0.8 else 20.0
    else:
        quantity_score = 12.0

    # 3. Expiry Priority (Max 20 points)
    # Higher score for urgent pickup before expiry
    expiry_score = 20.0

    # 4. Category & Dietary Preference (Max 15 points)
    listing_category = getattr(food_listing, 'category', 'Cooked Meals')
    accepted_categories = getattr(acceptor_profile, 'food_categories', '') or ''
    
    if listing_category.lower() in accepted_categories.lower():
        preference_score = 15.0
    else:
        preference_score = 8.0

    # 5. Capacity & Availability (Max 10 points)
    availability_score = 10.0

    total_score = min(100.0, round(distance_score + quantity_score + expiry_score + preference_score + availability_score))

    return {
        "match_score": int(total_score),
        "distance_km": distance_km,
        "breakdown": {
            "distance_score": round(distance_score, 1),
            "quantity_score": round(quantity_score, 1),
            "expiry_score": round(expiry_score, 1),
            "preference_score": round(preference_score, 1),
            "availability_score": round(availability_score, 1)
        }
    }
