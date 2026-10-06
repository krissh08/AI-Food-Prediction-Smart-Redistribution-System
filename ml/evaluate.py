import os
import json
import joblib
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score
from ml.preprocessing.preprocess import load_and_preprocess_data

def evaluate_models(models_dir="ml/models", dataset_path="ml/dataset/dataset.csv"):
    demand_path = os.path.join(models_dir, "demand_model.pkl")
    surplus_path = os.path.join(models_dir, "surplus_model.pkl")
    preprocessor_path = os.path.join(models_dir, "preprocessor.pkl")

    if not (os.path.exists(demand_path) and os.path.exists(surplus_path)):
        print("Models not found for evaluation. Training first...")
        from ml.training.train import train_models
        return train_models(dataset_path=dataset_path, models_dir=models_dir)

    demand_model = joblib.load(demand_path)
    surplus_model = joblib.load(surplus_path)

    (
        _, X_test,
        _, y_demand_test,
        _, y_surplus_test,
        _
    ) = load_and_preprocess_data(dataset_path=dataset_path, preprocessor_save_path=preprocessor_path)

    demand_preds = demand_model.predict(X_test)
    surplus_preds = surplus_model.predict(X_test)

    results = {
        "demand": {
            "mae": round(float(mean_absolute_error(y_demand_test, demand_preds)), 2),
            "rmse": round(float(root_mean_squared_error(y_demand_test, demand_preds)), 2),
            "r2": round(float(r2_score(y_demand_test, demand_preds)), 4)
        },
        "surplus": {
            "mae": round(float(mean_absolute_error(y_surplus_test, surplus_preds)), 2),
            "rmse": round(float(root_mean_squared_error(y_surplus_test, surplus_preds)), 2),
            "r2": round(float(r2_score(y_surplus_test, surplus_preds)), 4)
        }
    }
    print("Model Evaluation Summary:")
    print(json.dumps(results, indent=2))
    return results

if __name__ == "__main__":
    evaluate_models()
