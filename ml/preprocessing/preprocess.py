import os
import pandas as pd
import numpy as np
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.model_selection import train_test_split
import joblib

NUMERICAL_FEATURES = [
    'meals_planned',
    'expected_customers',
    'previous_avg_waste',
    'is_weekend',
    'has_event'
]

CATEGORICAL_FEATURES = [
    'day_of_week',
    'event_status',
    'weather_condition',
    'food_category',
    'meal_type',
    'season'
]

def load_and_preprocess_data(dataset_path="ml/dataset/dataset.csv", preprocessor_save_path="ml/models/preprocessor.pkl"):
    """
    Loads dataset, transforms numerical and categorical features using ColumnTransformer,
    and returns split train/test sets for demand and surplus targets.
    """
    if not os.path.exists(dataset_path):
        from ml.dataset.generate_dataset import generate_synthetic_dataset
        generate_synthetic_dataset(dataset_path)

    df = pd.read_csv(dataset_path)

    X = df[NUMERICAL_FEATURES + CATEGORICAL_FEATURES]
    y_demand = df['actual_consumption']
    y_surplus = df['actual_surplus']

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), NUMERICAL_FEATURES),
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), CATEGORICAL_FEATURES)
        ]
    )

    X_transformed = preprocessor.fit_transform(X)

    os.makedirs(os.path.dirname(preprocessor_save_path), exist_ok=True)
    joblib.dump(preprocessor, preprocessor_save_path)

    # Split for Demand
    X_train, X_test, y_demand_train, y_demand_test = train_test_split(
        X_transformed, y_demand, test_size=0.2, random_state=42
    )

    # Split for Surplus
    _, _, y_surplus_train, y_surplus_test = train_test_split(
        X_transformed, y_surplus, test_size=0.2, random_state=42
    )

    return (
        X_train, X_test,
        y_demand_train, y_demand_test,
        y_surplus_train, y_surplus_test,
        preprocessor
    )

def transform_single_input(input_dict, preprocessor_path="ml/models/preprocessor.pkl"):
    """
    Transforms a single input dictionary into preprocessed feature array.
    """
    if isinstance(preprocessor_path, str):
        preprocessor = joblib.load(preprocessor_path)
    else:
        preprocessor = preprocessor_path

    # Fill default values if missing
    df_single = pd.DataFrame([{
        'meals_planned': int(input_dict.get('meals_planned', 500)),
        'expected_customers': int(input_dict.get('expected_customers', 450)),
        'previous_avg_waste': int(input_dict.get('previous_avg_waste', 40)),
        'is_weekend': 1 if input_dict.get('day_of_week') in ['Saturday', 'Sunday'] else 0,
        'has_event': 0 if input_dict.get('event_status', 'None') == 'None' else 1,
        'day_of_week': str(input_dict.get('day_of_week', 'Wednesday')),
        'event_status': str(input_dict.get('event_status', 'None')),
        'weather_condition': str(input_dict.get('weather_condition', 'Sunny')),
        'food_category': str(input_dict.get('food_category', 'Cooked Meals')),
        'meal_type': str(input_dict.get('meal_type', 'Lunch')),
        'season': str(input_dict.get('season', 'Spring'))
    }])

    return preprocessor.transform(df_single)
