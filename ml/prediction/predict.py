import os
import json
import numpy as np
import joblib

from ml.preprocessing.preprocess import transform_single_input

MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models"))

def load_models():
    """
    Loads saved models and preprocessor. Trains them automatically if missing.
    """
    demand_path = os.path.join(MODELS_DIR, "demand_model.pkl")
    surplus_path = os.path.join(MODELS_DIR, "surplus_model.pkl")
    preprocessor_path = os.path.join(MODELS_DIR, "preprocessor.pkl")

    if not (os.path.exists(demand_path) and os.path.exists(surplus_path) and os.path.exists(preprocessor_path)):
        print("Model artifacts missing. Triggering training pipeline...")
        from ml.training.train import train_models
        train_models(models_dir=MODELS_DIR)

    demand_model = joblib.load(demand_path)
    surplus_model = joblib.load(surplus_path)
    preprocessor = joblib.load(preprocessor_path)

    metrics_path = os.path.join(MODELS_DIR, "metrics.json")
    metrics = {}
    if os.path.exists(metrics_path):
        with open(metrics_path, "r") as f:
            metrics = json.load(f)

    return demand_model, surplus_model, preprocessor, metrics

def predict_food_surplus(input_data: dict):
    """
    Performs AI prediction for expected demand, expected surplus,
    recommended preparation quantity, surplus probability, and waste anomaly detection.
    """
    demand_model, surplus_model, preprocessor, metrics = load_models()

    features = transform_single_input(input_data, preprocessor_path=preprocessor)

    pred_demand = float(demand_model.predict(features)[0])
    pred_surplus = float(surplus_model.predict(features)[0])

    meals_planned = float(input_data.get('meals_planned', 500))
    expected_customers = float(input_data.get('expected_customers', 450))
    previous_avg_waste = float(input_data.get('previous_avg_waste', 40))

    # Clean & bound predictions logically
    pred_demand = max(10, min(meals_planned * 1.05, round(pred_demand)))
    pred_surplus = max(0, min(meals_planned * 0.70, round(pred_surplus)))

    # Recommended preparation quantity (Demand + 5% buffer to prevent shortage while minimizing waste)
    recommended_preparation = int(round(pred_demand * 1.05))

    # Calculate estimated probability of surplus
    surplus_ratio = pred_surplus / max(1, meals_planned)
    surplus_probability = int(round(min(99, max(5, surplus_ratio * 150 + 20))))

    # Waste Anomaly Detection: Compare expected surplus against normal baseline
    normal_waste_threshold = max(20, previous_avg_waste * 1.4)
    is_anomaly = False
    anomaly_message = None

    if pred_surplus > normal_waste_threshold:
        pct_higher = int(round(((pred_surplus - previous_avg_waste) / max(1, previous_avg_waste)) * 100))
        if pct_higher > 30:
            is_anomaly = True
            anomaly_message = f"Unusual food waste detected: {pct_higher}% higher than your historical baseline average ({previous_avg_waste} meals)."

    # High waste trend analysis insights
    recommendations = []
    if input_data.get('event_status', 'None') != 'None':
        recommendations.append("Event day detected: Consider batching food preparation to match attendee influx.")
    if input_data.get('weather_condition') == 'Rainy':
        recommendations.append("Rainy weather expected: Customer walk-ins typically drop by 10-20%. Reduce fresh prep.")
    if input_data.get('day_of_week') in ['Friday', 'Saturday', 'Sunday']:
        recommendations.append("Weekend demand variance detected: Monitor buffet counters closely.")
    if pred_surplus > 50:
        recommendations.append(f"Predicted surplus of {int(pred_surplus)} meals can feed up to {int(pred_surplus)} people through local NGO redistribution.")

    return {
        "meals_planned": int(meals_planned),
        "expected_customers": int(expected_customers),
        "expected_demand": int(pred_demand),
        "predicted_surplus": int(pred_surplus),
        "recommended_preparation": int(recommended_preparation),
        "surplus_probability": surplus_probability,
        "is_anomaly": is_anomaly,
        "anomaly_message": anomaly_message,
        "insights_and_recommendations": recommendations,
        "model_evaluation": metrics
    }

if __name__ == "__main__":
    test_input = {
        "meals_planned": 700,
        "expected_customers": 600,
        "previous_avg_waste": 70,
        "event_status": "College Fest",
        "day_of_week": "Friday",
        "weather_condition": "Sunny",
        "food_category": "Cooked Meals",
        "meal_type": "Lunch",
        "season": "Spring"
    }
    result = predict_food_surplus(test_input)
    print("Prediction Output:", json.dumps(result, indent=2))
