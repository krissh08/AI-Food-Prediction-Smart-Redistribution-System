import os
import json
import numpy as np
import joblib

from ml.preprocessing.preprocess import transform_single_input

MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models"))

def load_models():
    """
    Loads the saved Food Surplus Random Forest model and preprocessor.
    Trains them if missing.
    """
    surplus_path = os.path.join(MODELS_DIR, "surplus_model.pkl")
    preprocessor_path = os.path.join(MODELS_DIR, "preprocessor.pkl")

    if not (os.path.exists(surplus_path) and os.path.exists(preprocessor_path)):
        print("Model artifacts missing. Triggering training pipeline...")
        from ml.training.train import train_models
        train_models(models_dir=MODELS_DIR)

    surplus_model = joblib.load(surplus_path)
    preprocessor = joblib.load(preprocessor_path)

    metrics_path = os.path.join(MODELS_DIR, "metrics.json")
    metrics = {}
    if os.path.exists(metrics_path):
        with open(metrics_path, "r") as f:
            metrics = json.load(f)

    return surplus_model, preprocessor, metrics

def predict_food_surplus(input_data: dict):
    """
    Predicts Food Surplus using the trained Random Forest model.
    Supports both 'daily_operations' (routine food prep) and 'special_events' (catered events).

    The target predicted by the model represents the unconsumed surplus food amount.
    Derived quantities (estimated consumption and recommended preparation)
    are calculated transparently with documented assumptions.
    Clearly distinguishes predicted unconsumed food from redistribution-safe food.
    """
    surplus_model, preprocessor, metrics = load_models()

    prediction_mode = str(input_data.get('prediction_mode', 'special_events')).strip().lower()
    if prediction_mode not in ['daily_operations', 'special_events']:
        prediction_mode = 'special_events'

    features = transform_single_input(input_data, preprocessor_path=preprocessor)
    pred_surplus = float(surplus_model.predict(features)[0])

    # Extract input quantities with mode-specific aliases for compatibility
    if prediction_mode == 'daily_operations':
        quantity_of_food = int(
            input_data.get('meals_planned') or
            input_data.get('quantity_of_food') or
            input_data.get('Quantity of Food') or
            400
        )
        number_of_guests = int(
            input_data.get('expected_customers') or
            input_data.get('number_of_guests') or
            input_data.get('Number of Guests') or
            300
        )
    else:
        quantity_of_food = int(
            input_data.get('quantity_of_food') or
            input_data.get('meals_planned') or
            input_data.get('Quantity of Food') or
            400
        )
        number_of_guests = int(
            input_data.get('number_of_guests') or
            input_data.get('expected_customers') or
            input_data.get('Number of Guests') or
            300
        )

    food_type = str(
        input_data.get('type_of_food') or
        input_data.get('Type of Food') or
        input_data.get('food_category') or
        'Meat'
    )
    storage_conditions = str(
        input_data.get('storage_conditions') or
        input_data.get('Storage Conditions') or
        'Refrigerated'
    )
    prep_method = str(
        input_data.get('preparation_method') or
        input_data.get('Preparation Method') or
        input_data.get('service_style') or
        'Buffet'
    )
    event_type = input_data.get('event_type') if prediction_mode == 'special_events' else None
    meal_period = input_data.get('meal_period') if prediction_mode == 'daily_operations' else None

    # Bound predicted surplus logically within [0, quantity_of_food]
    pred_surplus = max(0.0, min(float(quantity_of_food), round(pred_surplus, 1)))
    pred_surplus_int = int(round(pred_surplus))

    # Transparently derived estimates
    # Estimated consumption = Quantity prepared - Predicted surplus
    estimated_consumption = max(0, quantity_of_food - pred_surplus_int)
    # Recommended preparation = Estimated consumption + 5% safety buffer
    recommended_preparation = int(round(estimated_consumption * 1.05))

    # Actual mathematical ratio: percentage of food surplus relative to total prepared
    surplus_ratio_pct = round((pred_surplus / max(1, quantity_of_food)) * 100, 1)

    # Anomaly Detection: Flag if surplus exceeds 25% of prepared food
    is_anomaly = False
    anomaly_message = None
    if surplus_ratio_pct > 25.0:
        is_anomaly = True
        context_str = f"routine {meal_period or 'service'}" if prediction_mode == "daily_operations" else f"{event_type or 'event'}"
        anomaly_message = (
            f"High Surplus Alert: Predicted surplus represents {surplus_ratio_pct}% of total food prepared "
            f"({pred_surplus_int} of {quantity_of_food} units) for this {context_str}. Pre-arrange redistribution with local food acceptors."
        )

    # Mode Metadata and Clear Technical Disclosures
    if prediction_mode == "daily_operations":
        mode_label = "Daily Operations (Routine Food Service)"
        model_mode_note = (
            "Operational Mapping Proxy: Evaluated on the baseline Random Forest model "
            "(trained on 1,618 Kaggle food wastage records). Routine service is mapped to institutional "
            "baseline parameters without requiring an event type. For production deployment, a dedicated "
            "daily restaurant/cafeteria dataset is recommended."
        )
    else:
        mode_label = "Special Events (Catered Gatherings)"
        model_mode_note = (
            "Native Event Model: Supported natively by the verified 1,618-record event surplus dataset."
        )

    food_safety_notice = (
        "Surplus vs. Waste Notice: The model predicts unconsumed surplus food volume based on training data. "
        "Surplus food is only eligible for redistribution to food banks if it complies with safe food handling "
        "standards (unserved kitchen reserves, maintained under safe temperatures < 4°C). Plate scrapings, customer "
        "leftovers, or temperature-abused items represent spoiled waste and must never be redistributed."
    )

    # Tailored Recommendations based on prediction mode and operational factors
    recommendations = []
    if prediction_mode == "daily_operations":
        period_label = meal_period or "routine service"
        recommendations.append(
            f"Daily Operations ({period_label}): Consider preparing in staggered cooking batches "
            f"during peak dining hours to prevent unnecessary end-of-shift unconsumed food."
        )
        if 'room' in storage_conditions.lower() or 'ambient' in storage_conditions.lower():
            recommendations.append(
                "Ambient holding: Cooked items at room temperature must be consumed or safely transferred to chilled storage within 2 hours."
            )
        else:
            recommendations.append(
                "Commercial refrigeration (< 4°C): Unserved kitchen reserves can be safely maintained for scheduled evening NGO redistribution."
            )
        if pred_surplus_int > 15:
            recommendations.append(
                f"Expected daily surplus of {pred_surplus_int} food units: Notify partnered local shelters before the end of the shift for same-day collection."
            )
        else:
            recommendations.append(
                f"Low predicted daily surplus ({pred_surplus_int} units): Production volume is tightly aligned with projected customer demand."
            )
    else:
        # Special Events recommendations
        event_name = event_type or "catered event"
        recommendations.append(
            f"Special Event ({event_name}): Confirm RSVP headcount 24 hours prior to final food production to minimize initial over-preparation."
        )
        if 'room' in storage_conditions.lower() or 'ambient' in storage_conditions.lower():
            recommendations.append(
                f"Room temperature storage detected for {food_type}: Schedule NGO pickup within 2 hours of event conclusion."
            )
        else:
            recommendations.append(
                "Refrigerated holding: Maintains surplus freshness up to 24-48 hours. Store below 4°C."
            )
        if 'buffet' in prep_method.lower():
            recommendations.append(
                "Buffet service style: Keep back-up replenishment pans in the kitchen rather than putting all food out at once to ensure leftover portions remain safe to donate."
            )
        elif 'sit-down' in prep_method.lower():
            recommendations.append(
                "Plated sit-down service: Unplated kitchen reserves are protected from contamination and ideal for clean redistribution."
            )
        if pred_surplus_int > 20:
            recommendations.append(
                f"Expected surplus of {pred_surplus_int} food units can feed approximately {pred_surplus_int} people through registered food banks."
            )

    return {
        # Prediction Mode & Disclosures
        "prediction_mode": prediction_mode,
        "mode_label": mode_label,
        "model_mode_note": model_mode_note,
        "food_safety_notice": food_safety_notice,

        # Core Features
        "quantity_of_food": quantity_of_food,
        "number_of_guests": number_of_guests,
        "type_of_food": food_type,
        "event_type": event_type,
        "meal_period": meal_period,
        "storage_conditions": storage_conditions,
        "preparation_method": prep_method,

        # Machine Learning Prediction
        "predicted_surplus": pred_surplus_int,
        "surplus_unit": "food units",

        # Derived Estimates (Transparently calculated)
        "estimated_consumption": estimated_consumption,
        "recommended_preparation": recommended_preparation,
        "surplus_ratio_pct": surplus_ratio_pct,

        # Compatibility Aliases for existing frontend components
        "meals_planned": quantity_of_food,
        "expected_customers": number_of_guests,
        "expected_demand": estimated_consumption,
        "surplus_probability": int(round(surplus_ratio_pct)),

        # Alerts & Insights
        "is_anomaly": is_anomaly,
        "anomaly_message": anomaly_message,
        "insights_and_recommendations": recommendations,
        "model_evaluation": metrics.get("evaluation", {})
    }

if __name__ == "__main__":
    sample = {
        "Number of Guests": 350,
        "Quantity of Food": 450,
        "Type of Food": "Meat",
        "Event Type": "Corporate",
        "Storage Conditions": "Refrigerated",
        "Purchase History": "Regular",
        "Seasonality": "Winter",
        "Preparation Method": "Buffet",
        "Geographical Location": "Urban",
        "Pricing": "High"
    }
    res = predict_food_surplus(sample)
    print("Sample Prediction Result:")
    print(json.dumps(res, indent=2))
