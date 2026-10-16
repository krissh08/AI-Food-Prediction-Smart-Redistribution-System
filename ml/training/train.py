import os
import json
import datetime
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score

from ml.preprocessing.preprocess import (
    load_and_preprocess_data,
    NUMERICAL_FEATURES,
    CATEGORICAL_FEATURES,
    TARGET_COLUMN,
    MAPPED_TARGET_NAME,
    DEFAULT_DATASET_PATH
)

MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models"))

def train_models(
    dataset_path=DEFAULT_DATASET_PATH,
    models_dir=MODELS_DIR
):
    """
    Trains the Food Surplus Prediction Model using RandomForestRegressor baseline.
    Evaluates MAE, RMSE, and R² on held-out test data (20%).
    Saves model artifacts and performance metadata to metrics.json.
    """
    os.makedirs(models_dir, exist_ok=True)
    preprocessor_path = os.path.join(models_dir, "preprocessor.pkl")
    surplus_path = os.path.join(models_dir, "surplus_model.pkl")
    metrics_path = os.path.join(models_dir, "metrics.json")

    print(f"Loading and preprocessing primary dataset from: {dataset_path}")
    (
        X_train, X_test,
        y_surplus_train, y_surplus_test,
        preprocessor,
        df_cleaned
    ) = load_and_preprocess_data(
        dataset_path=dataset_path,
        preprocessor_save_path=preprocessor_path
    )

    print(f"Training Random Forest Regressor baseline on {len(X_train)} samples...")
    # Baseline Random Forest Regressor with reproducible random seed
    surplus_model = RandomForestRegressor(
        n_estimators=100,
        max_depth=12,
        random_state=42
    )
    surplus_model.fit(X_train, y_surplus_train)

    # Held-out evaluation
    surplus_preds = surplus_model.predict(X_test)
    surplus_mae = float(mean_absolute_error(y_surplus_test, surplus_preds))
    surplus_rmse = float(root_mean_squared_error(y_surplus_test, surplus_preds))
    surplus_r2 = float(r2_score(y_surplus_test, surplus_preds))

    print("\n--- Food Surplus Prediction Model Evaluation ---")
    print(f"Target Column (Dataset) : '{TARGET_COLUMN}' -> mapped to '{MAPPED_TARGET_NAME}'")
    print(f"Cleaned Dataset Size    : {len(df_cleaned)} records (train: {len(X_train)}, test: {len(X_test)})")
    print(f"Mean Absolute Error (MAE): {surplus_mae:.2f} food units")
    print(f"Root Mean Squared Error (RMSE): {surplus_rmse:.2f} food units")
    print(f"Coefficient of Determination (R²): {surplus_r2:.4f}")
    print("------------------------------------------------\n")

    # Serialize trained model
    joblib.dump(surplus_model, surplus_path)

    # Document all training metadata and performance metrics
    metrics = {
        "model_name": "RandomForestRegressor",
        "dataset_path": "ml/dataset/food_surplus_data.csv",
        "dataset_provenance": "User-supplied food wastage dataset (1,782 raw records, unverified external source)",
        "target_column": TARGET_COLUMN,
        "target_interpretation": "Food Surplus Amount (units as recorded in dataset)",
        "training_date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "random_seed": 42,
        "raw_samples": 1782,
        "duplicates_removed": 164,
        "clean_samples": len(df_cleaned),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "features": {
            "numerical": NUMERICAL_FEATURES,
            "categorical": CATEGORICAL_FEATURES
        },
        "evaluation": {
            "mae": round(surplus_mae, 2),
            "rmse": round(surplus_rmse, 2),
            "r2": round(surplus_r2, 4)
        },
        "metric_definitions": {
            "mae": "Mean Absolute Error: Average absolute difference between predicted and actual surplus units.",
            "rmse": "Root Mean Squared Error: Square root of mean squared error, penalizing larger deviations.",
            "r2": "R-squared: Proportion of surplus variance explained by the features."
        }
    }

    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=4)

    print(f"Artifacts successfully saved to: {models_dir}")
    return metrics

if __name__ == "__main__":
    train_models()
