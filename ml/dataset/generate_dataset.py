import os
import random
import pandas as pd
import numpy as np

def generate_synthetic_dataset(output_path="ml/dataset/dataset.csv", num_samples=800):
    """
    Generates synthetic historical food preparation and wastage data
    for training the AI Surplus & Demand Prediction model.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    np.random.seed(42)
    random.seed(42)
    
    days_of_week = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    event_statuses = ['None', 'Conference', 'Wedding', 'College Fest', 'Corporate Lunch', 'Festival']
    weather_conditions = ['Sunny', 'Rainy', 'Cloudy', 'Hot']
    food_categories = ['Cooked Meals', 'Bakery', 'Buffet Items', 'Packaged Food', 'Dairy & Drinks']
    meal_types = ['Breakfast', 'Lunch', 'Dinner']
    seasons = ['Winter', 'Spring', 'Summer', 'Monsoon']
    
    records = []
    
    for i in range(num_samples):
        day = random.choice(days_of_week)
        is_weekend = 1 if day in ['Saturday', 'Sunday'] else 0
        event = random.choice(event_statuses)
        has_event = 0 if event == 'None' else 1
        weather = random.choice(weather_conditions)
        category = random.choice(food_categories)
        meal = random.choice(meal_types)
        season = random.choice(seasons)
        
        # Base planned meals based on event & day
        base_meals = random.randint(150, 800)
        if has_event:
            base_meals += random.randint(100, 350)
            
        meals_planned = base_meals
        
        # Customer attendance factor
        attendance_rate = random.uniform(0.70, 0.95)
        if weather == 'Rainy':
            attendance_rate -= random.uniform(0.08, 0.15)
        if is_weekend and not has_event:
            attendance_rate -= random.uniform(0.05, 0.10)
        if has_event:
            attendance_rate += random.uniform(0.05, 0.10)
            
        attendance_rate = max(0.45, min(0.98, attendance_rate))
        expected_customers = int(meals_planned * attendance_rate)
        
        # Actual customer attendance (slight noise)
        actual_customers = int(expected_customers * random.uniform(0.92, 1.05))
        
        # Previous average waste
        previous_avg_waste = int(meals_planned * random.uniform(0.08, 0.18))
        
        # Actual consumption
        actual_consumption = min(actual_customers, meals_planned)
        
        # Actual surplus (meals remaining)
        actual_surplus = max(0, meals_planned - actual_consumption)
        
        records.append({
            "meals_planned": meals_planned,
            "expected_customers": expected_customers,
            "day_of_week": day,
            "is_weekend": is_weekend,
            "event_status": event,
            "has_event": has_event,
            "weather_condition": weather,
            "food_category": category,
            "meal_type": meal,
            "season": season,
            "previous_avg_waste": previous_avg_waste,
            "actual_consumption": actual_consumption,
            "actual_surplus": actual_surplus
        })

    df = pd.DataFrame(records)
    df.to_csv(output_path, index=False)
    print(f"Dataset successfully generated with {len(df)} records at: {output_path}")
    return df

if __name__ == "__main__":
    generate_synthetic_dataset()
