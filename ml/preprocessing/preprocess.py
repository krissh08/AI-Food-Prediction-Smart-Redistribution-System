import os
import joblib
import pandas as pd
import numpy as np
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.model_selection import train_test_split

NUMERICAL_FEATURES = [
    'Number of Guests',
    'Quantity of Food'
]

CATEGORICAL_FEATURES = [
    'Type of Food',
    'Event Type',
    'Storage Conditions',
    'Purchase History',
    'Seasonality',
    'Preparation Method',
    'Geographical Location',
    'Pricing'
]

# Explicit mapping of the dataset's target column to application surplus target
TARGET_COLUMN = 'Wastage Food Amount'
MAPPED_TARGET_NAME = 'predicted_surplus'

DEFAULT_DATASET_PATH = os.path.join(os.path.dirname(__file__), "..", "dataset", "food_surplus_data.csv")
DEFAULT_PREPROCESSOR_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "preprocessor.pkl")

def load_and_preprocess_data(
    dataset_path=DEFAULT_DATASET_PATH,
    preprocessor_save_path=DEFAULT_PREPROCESSOR_PATH
):
    """
    Loads the real food surplus dataset, cleans duplicate records,
    fits a ColumnTransformer on numerical and categorical features,
    and returns train/test splits for surplus prediction.
    
    IMPORTANT: Synthetic dataset fallback is strictly disabled.
    If the dataset file is missing, FileNotFoundError is raised.
    """
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(
            f"Primary training dataset not found at '{dataset_path}'. "
            "Synthetic fallback has been completely removed. Please provide the real dataset."
        )

    df_raw = pd.read_csv(dataset_path)
    initial_rows = len(df_raw)

    # Validate required columns
    expected_cols = NUMERICAL_FEATURES + CATEGORICAL_FEATURES + [TARGET_COLUMN]
    missing_cols = [c for c in expected_cols if c not in df_raw.columns]
    if missing_cols:
        raise ValueError(f"Dataset is missing required columns: {missing_cols}")

    # Remove exact duplicate rows from training data
    df_cleaned = df_raw.drop_duplicates().copy()
    duplicates_removed = initial_rows - len(df_cleaned)
    print(f"Dataset Inspection: {initial_rows} raw rows, {duplicates_removed} duplicates removed, {len(df_cleaned)} clean records remaining.")

    X = df_cleaned[NUMERICAL_FEATURES + CATEGORICAL_FEATURES]
    # The dataset target column 'Wastage Food Amount' is explicitly mapped to the surplus target
    y_surplus = df_cleaned[TARGET_COLUMN].values

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), NUMERICAL_FEATURES),
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), CATEGORICAL_FEATURES)
        ]
    )

    X_transformed = preprocessor.fit_transform(X)

    os.makedirs(os.path.dirname(preprocessor_save_path), exist_ok=True)
    joblib.dump(preprocessor, preprocessor_save_path)

    X_train, X_test, y_surplus_train, y_surplus_test = train_test_split(
        X_transformed, y_surplus, test_size=0.2, random_state=42
    )

    return (
        X_train, X_test,
        y_surplus_train, y_surplus_test,
        preprocessor,
        df_cleaned
    )

def transform_single_input(input_dict, preprocessor_path=DEFAULT_PREPROCESSOR_PATH):
    """
    Transforms a single input dictionary (supporting Daily Operations, Special Events,
    snake_case API fields, and dataset Title Case fields) into the preprocessed feature array.
    Preserves exact feature order, column names, categorical encodings, and types expected by the model.
    """
    if isinstance(preprocessor_path, str):
        preprocessor = joblib.load(preprocessor_path)
    else:
        preprocessor = preprocessor_path

    mode = str(input_dict.get('prediction_mode', 'special_events')).strip().lower()

    # Extract numerical features with mode-specific aliases and fallbacks
    if mode == 'daily_operations':
        num_guests = (
            input_dict.get('expected_customers') or
            input_dict.get('number_of_guests') or
            input_dict.get('Number of Guests') or
            300
        )
        food_qty = (
            input_dict.get('meals_planned') or
            input_dict.get('quantity_of_food') or
            input_dict.get('Quantity of Food') or
            400
        )
    else:
        num_guests = (
            input_dict.get('number_of_guests') or
            input_dict.get('expected_customers') or
            input_dict.get('Number of Guests') or
            300
        )
        food_qty = (
            input_dict.get('quantity_of_food') or
            input_dict.get('meals_planned') or
            input_dict.get('Quantity of Food') or
            400
        )

    # Extract categorical features
    food_type = (
        input_dict.get('type_of_food') or
        input_dict.get('Type of Food') or
        input_dict.get('food_category') or
        'Meat'
    )
    food_type_map = {
        'Cooked Meals': 'Meat',
        'Meat / Poultry': 'Meat',
        'Vegetarian Meals': 'Vegetables',
        'Vegetables / Salads': 'Vegetables',
        'Fresh Produce / Fruits': 'Fruits',
        'Bakery & Breads': 'Baked Goods',
        'Bakery': 'Baked Goods',
        'Dairy & Desserts': 'Dairy Products',
        'Buffet Items': 'Meat',
        'Packaged Food': 'Vegetables'
    }
    food_type = food_type_map.get(food_type, food_type)
    if food_type not in ['Meat', 'Vegetables', 'Fruits', 'Baked Goods', 'Dairy Products']:
        food_type = 'Meat'

    # Event Type handling
    if mode == 'daily_operations':
        # Daily operations does not involve an event.
        # To maintain model compatibility with the 10-feature training schema,
        # routine service maps to the institutional dining baseline ('Corporate').
        event_type = 'Corporate'
    else:
        event_type = (
            input_dict.get('event_type') or
            input_dict.get('Event Type') or
            input_dict.get('event_status') or
            'Corporate'
        )
        event_map = {
            'None': 'Corporate',
            'Corporate Gathering': 'Corporate',
            'Conference': 'Corporate',
            'Birthday Celebration': 'Birthday',
            'Wedding Reception': 'Wedding',
            'Social Gathering / Banquet': 'Social Gathering',
            'College Fest': 'Social Gathering',
            'Festival': 'Social Gathering'
        }
        event_type = event_map.get(event_type, event_type)
        if event_type not in ['Corporate', 'Birthday', 'Wedding', 'Social Gathering']:
            event_type = 'Corporate'

    storage = (
        input_dict.get('storage_conditions') or
        input_dict.get('Storage Conditions') or
        'Refrigerated'
    )
    if 'room' in str(storage).lower() or 'ambient' in str(storage).lower():
        storage = 'Room Temperature'
    else:
        storage = 'Refrigerated'

    purchase_hist = (
        input_dict.get('purchase_history') or
        input_dict.get('Purchase History') or
        input_dict.get('customer_pattern') or
        'Regular'
    )
    if 'occasional' in str(purchase_hist).lower() or 'walk-in' in str(purchase_hist).lower() or 'new' in str(purchase_hist).lower():
        purchase_hist = 'Occasional'
    else:
        purchase_hist = 'Regular'

    seasonality = (
        input_dict.get('seasonality') or
        input_dict.get('Seasonality') or
        input_dict.get('season') or
        'All Seasons'
    )
    if 'winter' in str(seasonality).lower():
        seasonality = 'Winter'
    elif 'summer' in str(seasonality).lower():
        seasonality = 'Summer'
    else:
        seasonality = 'All Seasons'

    prep_method = (
        input_dict.get('preparation_method') or
        input_dict.get('Preparation Method') or
        input_dict.get('service_style') or
        'Buffet'
    )
    prep_map = {
        'Buffet / Self-Service': 'Buffet',
        'Buffet Service': 'Buffet',
        'Sit-down Plated Dinner': 'Sit-down Dinner',
        'Plated / Table Service': 'Sit-down Dinner',
        'Plated Service': 'Sit-down Dinner',
        'Finger Food / Appetizers': 'Finger Food',
        'Counter Service / Quick Service': 'Finger Food',
        'Quick Service': 'Finger Food'
    }
    prep_method = prep_map.get(prep_method, prep_method)
    if prep_method not in ['Buffet', 'Finger Food', 'Sit-down Dinner']:
        prep_method = 'Buffet'

    geo_loc = (
        input_dict.get('geographical_location') or
        input_dict.get('Geographical Location') or
        'Urban'
    )
    if 'suburban' in str(geo_loc).lower():
        geo_loc = 'Suburban'
    elif 'rural' in str(geo_loc).lower():
        geo_loc = 'Rural'
    else:
        geo_loc = 'Urban'

    pricing = (
        input_dict.get('pricing') or
        input_dict.get('Pricing') or
        'Moderate'
    )
    if 'low' in str(pricing).lower() or 'economy' in str(pricing).lower():
        pricing = 'Low'
    elif 'high' in str(pricing).lower() or 'premium' in str(pricing).lower():
        pricing = 'High'
    else:
        pricing = 'Moderate'

    df_single = pd.DataFrame([{
        'Number of Guests': int(num_guests),
        'Quantity of Food': int(food_qty),
        'Type of Food': str(food_type),
        'Event Type': str(event_type),
        'Storage Conditions': str(storage),
        'Purchase History': str(purchase_hist),
        'Seasonality': str(seasonality),
        'Preparation Method': str(prep_method),
        'Geographical Location': str(geo_loc),
        'Pricing': str(pricing)
    }])

    return preprocessor.transform(df_single)
