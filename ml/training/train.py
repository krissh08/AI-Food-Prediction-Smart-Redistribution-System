import os
import json
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score
import joblib

from ml.preprocessing.preprocess import load_and_preprocess_data

def train_models(
    dataset_path="ml/dataset/dataset.csv",
    models_dir="ml/models"
):
    """
    Trains Demand and Surplus Prediction Models using Random Forest and Gradient Boosting.
    Evaluates metrics (MAE, RMSE, R²) and exports artifacts.
    """
    os.makedirs(models_dir, exist_ok=True)
    
    preprocessor_path = os.path.join(models_dir, "preprocessor.pkl")
    
    (
        X_train, X_test,
        y_demand_train, y_demand_test,
        y_surplus_train, y_surplus_test,
        preprocessor
    ) = load_and_preprocess_data(dataset_path=dataset_path, preprocessor_save_path=preprocessor_path)

    print("Training Demand Prediction Model (RandomForestRegressor)...")
    demand_model = RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42)
    demand_model.fit(X_train, y_demand_train)

    demand_preds = demand_model.predict(X_test)
    demand_mae = mean_absolute_error(y_demand_test, demand_preds)
    demand_rmse = root_mean_squared_error(y_demand_test, demand_preds)
    demand_r2 = r2_score(y_demand_test, demand_preds)

    print(f"Demand Model Performance: MAE={demand_mae:.2f}, RMSE={demand_rmse:.2f}, R²={demand_r2:.4f}")

    print("Training Surplus Prediction Model (GradientBoostingRegressor)...")
    surplus_model = GradientBoostingRegressor(n_estimators=100, learning_rate=0.08, max_depth=6, random_state=42)
    surplus_model.fit(X_train, y_surplus_train)

    surplus_preds = surplus_model.predict(X_test)
    surplus_mae = mean_absolute_error(y_surplus_test, surplus_preds)
    surplus_rmse = root_mean_squared_error(y_surplus_test, surplus_preds)
    surplus_r2 = r2_score(y_surplus_test, surplus_preds)

    print(f"Surplus Model Performance: MAE={surplus_mae:.2f}, RMSE={surplus_rmse:.2f}, R²={surplus_r2:.4f}")

    demand_path = os.path.join(models_dir, "demand_model.pkl")
    surplus_path = os.path.join(models_dir, "surplus_model.pkl")
    metrics_path = os.path.join(models_dir, "metrics.json")

    joblib.dump(demand_model, demand_path)
    joblib.dump(surplus_model, surplus_path)

    metrics = {
        "demand": {
            "mae": round(float(demand_mae), 2),
            "rmse": round(float(demand_rmse), 2),
            "r2": round(float(demand_r2), 4)
        },
        "surplus": {
            "mae": round(float(surplus_mae), 2),
            "rmse": round(float(surplus_rmse), 2),
            "r2": round(float(surplus_r2), 4)
        },
        "training_samples": len(X_train) + len(X_test)
    }

    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=4)

    print(f"Models successfully saved to {models_dir}")
    return metrics

if __name__ == "__main__":
    train_models()
