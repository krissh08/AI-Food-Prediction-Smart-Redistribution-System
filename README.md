# 🌿 AI-Driven Food Surplus Prediction and Smart Redistribution System

> *Production-grade full-stack web application integrating Scikit-Learn Machine Learning, FastAPI, React 18 + Vite, PostgreSQL / SQLite, Leaflet OpenStreetMap, Docker, and GitHub Actions CI/CD pipelines.*

---

## 📌 Problem Statement

Food surplus management is a critical social, environmental, and economic priority. Significant quantities of edible food prepared by restaurants, hotels, canteens, and event banquets go unutilized when prep planning lacks predictive analytics, while community shelters and food banks face food deficits.

Key challenges include:
1. **Uncertain Prep Volume**: Donors over-prepare food due to lack of predictive surplus forecasting.
2. **Redistribution Coordination Latency**: Surplus food requires rapid pre-matching before freshness windows lapse.
3. **Role Separation & Traceability**: Donors and acceptors need distinct portals, distance-based matching, and real-time pickup lifecycle verification.

---

## 🚀 Solution Overview

**Food Surplus Redistribution Platform** is an end-to-end AI-powered platform providing:
- **Food Surplus Prediction**: Uses a baseline **Random Forest Regressor** trained on the validated surplus dataset to estimate surplus food units based on 10 event and meal parameters.
- **Transparent Derived Estimates**: Transparently derives expected consumption (`Quantity Prepared - Predicted Surplus`) and recommended batch prep (`Estimated Consumption + 5%`) without fabricating unverified target outputs.
- **Surplus Proportion & Anomaly Warnings**: Calculates exact mathematical surplus ratios (`predicted_surplus / quantity_of_food`) and alerts donors when surplus exceeds 25%.
- **Smart Donor-Acceptor Matching**: Ranks nearby registered NGOs using the Haversine distance formula, capacity limits, dietary requirements, and expiry priority.
- **Strict Role Separation**: Provides distinct, role-authenticated dashboards for **Food Donors** and **Food Acceptors (NGOs)**.

---

## 📊 Dataset Inspection, Provenance & Validation

The machine learning pipeline trains exclusively on the primary dataset: `ml/dataset/food_surplus_data.csv` (provided as `food_wastage_data.csv`). All legacy synthetic datasets and generators have been decommissioned.

### 1. Dataset Provenance & Characteristics
- **Supplied File**: `food_wastage_data.csv` → copied to `ml/dataset/food_surplus_data.csv`
- **Authentication Note**: The dataset was provided directly for model training. Its external origin and ground-truth measurement procedures have not been independently audited; it is treated rigorously as the primary supplied training dataset.
- **Raw Dimensions**: 1,782 records across 11 columns.
- **Duplicate Analysis**: Exactly **164 duplicate records** were detected and removed in preprocessing.
- **Clean Training Dimensions**: **1,618 unique records** (80% train = 1,294, 20% held-out test = 324).
- **Missing Values**: 0 missing values across all features.

### 2. Feature Schema & Column Definitions

| Column Name | Type | Categories / Value Range | Role |
|---|---|---|---|
| `Quantity of Food` | Numerical (int64) | 280 to 500 units | Feature (Total food prepared/ordered) |
| `Number of Guests` | Numerical (int64) | 207 to 491 guests | Feature (Attendee count) |
| `Type of Food` | Categorical (object) | `Meat`, `Vegetables`, `Fruits`, `Baked Goods`, `Dairy Products` | Feature |
| `Event Type` | Categorical (object) | `Corporate`, `Birthday`, `Wedding`, `Social Gathering` | Feature |
| `Storage Conditions` | Categorical (object) | `Refrigerated`, `Room Temperature` | Feature |
| `Purchase History` | Categorical (object) | `Regular`, `Occasional` | Feature |
| `Seasonality` | Categorical (object) | `All Seasons`, `Winter`, `Summer` | Feature |
| `Preparation Method` | Categorical (object) | `Buffet`, `Finger Food`, `Sit-down Dinner` | Feature |
| `Geographical Location` | Categorical (object) | `Urban`, `Suburban`, `Rural` | Feature |
| `Pricing` | Categorical (object) | `Low`, `Moderate`, `High` | Feature |
| `Wastage Food Amount` | Numerical (int64) | 10 to 63 food units (Mean: 28.54, Std: 10.46) | **Target Variable** (Explicitly mapped to `predicted_surplus`) |

### 3. Explicit Target Mapping & Interpretation
The dataset provides a ground-truth target column titled `Wastage Food Amount`. In our preprocessing pipeline:
- This column is explicitly mapped to the model target: `predicted_surplus`.
- Units are documented as **food units / meals** as recorded by the dataset without fabricating unverified units.
- The model predicts the surplus quantity remaining after event consumption.

---

## 🤖 Machine Learning Pipeline (`/ml`)

```
ml/
├── dataset/
│   └── food_surplus_data.csv     # Validated 1,618 clean record dataset
├── preprocessing/
│   └── preprocess.py             # ColumnTransformer (StandardScaler + OneHotEncoder)
├── training/
│   └── train.py                  # Random Forest Regressor baseline trainer
├── prediction/
│   └── predict.py                # Inference pipeline with transparent derived estimates
├── models/
│   ├── surplus_model.pkl         # Trained Random Forest Regressor artifact
│   ├── preprocessor.pkl          # Fitted ColumnTransformer artifact
│   └── metrics.json              # Documented evaluation metrics & feature metadata
└── evaluate.py                   # Standalone held-out test evaluation script
```

### Model Selection & Evaluation
- **Algorithm**: Baseline `RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42)`
- **Evaluation Split**: 20% held-out test set (324 records), evaluated using reproducible random seed `42`.

#### Verified Test Metrics:
- **Mean Absolute Error (MAE)**: **1.83 food units** (Average deviation between prediction and ground truth)
- **Root Mean Squared Error (RMSE)**: **2.92 food units** (Robust fit without severe outlier errors)
- **Coefficient of Determination ($R^2$)**: **0.9209** (~92.1% of surplus variance explained by features)

### Honest Prediction Architecture
The model predicts only what the dataset target directly supports: `predicted_surplus`. Additional metrics shown on the dashboard are explicitly labelled, derived calculations:
- **Estimated Consumption**: `Quantity of Food - predicted_surplus`
- **Recommended Preparation**: `Estimated Consumption * 1.05` (5% safety buffer)
- **Surplus Proportion**: `(predicted_surplus / Quantity of Food) * 100`% (Mathematical ratio; no fabricated probabilities)

---

## 🌟 Application Features & Portals

### 🏢 1. Food Donor Portal
- **AI Food Surplus Prediction**: Input the 10 verified parameters to forecast surplus amount and receive storage-specific redistribution recommendations.
- **Distinct Quantities**: Clearly distinguishes **Predicted Surplus** (expected future quantity) from **Available Food for Redistribution** (actual listings published for pickup).
- **Surplus by Food Category**: Breakdown across Meat, Vegetables, Baked Goods, Dairy Products, and Fruits.
- **Donation Request Management**: Approve/reject incoming NGO requests and schedule collection windows.
- **Surplus Redistribution Analytics**: Monthly trends of prepared, consumed, and successfully redistributed food.

### 🤝 2. Food Acceptor Portal (NGOs & Food Banks)
- **Real-Time Available Food Catalog**: Browse actual available surplus listings published by verified donors.
- **Geographic Radius Map**: Leaflet OpenStreetMap visualizer with distance filters.
- **Request & Pickup Flow**: Request exact quantities, monitor approval status, view donor pickup address and contact details, and confirm completed pickups.
- **Donation History**: Track cumulative meals received and community redistribution logs.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons, Leaflet Maps, Recharts |
| **Backend** | Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy ORM, PyJWT |
| **Machine Learning** | Scikit-Learn 1.4+, Pandas 2.2+, NumPy, Joblib |
| **Database** | PostgreSQL (Production Docker) / SQLite (Local Dev Fallback) |
| **DevOps & CI/CD** | Docker, Docker Compose, GitHub Actions, Pytest |

---

## ⚡ Quick Start & Local Execution

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ & npm
- Git

### 2. Backend & ML Setup
```bash
# Clone Repository
git clone https://github.com/krissh08/Code_Alpha_AI_FAQ_Chatbot.git
cd Code_Alpha_AI_FAQ_Chatbot

# Install Python Dependencies
pip install -r backend/app/requirements.txt

# Train the Random Forest Surplus Model on food_surplus_data.csv
python -m ml.training.train

# Evaluate on Held-Out Test Data
python -m ml.evaluate

# Run Inference Smoke Test
python -m ml.prediction.predict

# Start FastAPI Backend Server
uvicorn backend.app.main:app --reload --port 8000
```
*API Swagger Documentation: `http://localhost:8000/docs`*

### 3. Frontend Setup
```bash
cd frontend

# Install Dependencies
npm install

# Build Production Bundle
npm run build

# Start Vite Development Server
npm run dev
```
*Frontend runs at: `http://localhost:5173`*

---

## 🐳 Docker Deployment Instructions

Run the entire system with Docker Compose:

```bash
# Build and launch all containers
docker-compose up --build -d

# Check service status
docker-compose ps
```

- **Frontend Application**: `http://localhost:80`
- **FastAPI Backend**: `http://localhost:8000`
- **PostgreSQL Database**: `localhost:5432`

---

## 🧪 Automated Testing

Run the automated Pytest test suite covering authentication, RBAC role separation, dataset loading, deduplication, 10-feature surplus prediction, and donor/acceptor endpoints:

```bash
python -m pytest backend/tests/test_backend.py -v
```

All 11 tests pass with zero failures.

---

## 📧 Email Verification & Authentic User Accounts

The platform implements authentic account verification and zero mock-data leakage for newly created users:

1. **Email Verification Flow**:
   - When a new Food Donor or Acceptor registers, an account is created with `is_verified = False`.
   - A signed verification JWT token is generated (24-hour expiration) and dispatched via email (`/verify-email?token=...`).
   - In development mode or when SMTP is unconfigured, the verification link is logged cleanly to the backend console and displayed directly on the registration success screen for seamless 1-click verification.
   - For live email delivery, configure standard SMTP credentials (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`) in `.env`.
   - Unverified accounts cannot sign in (`403 Forbidden: Email not verified`). The login screen provides an immediate 1-click option to resend the verification link.

2. **Strict Dataset & Mock Data Isolation**:
   - The primary dataset (`ml/dataset/food_surplus_data.csv`) is strictly and exclusively used for training the Random Forest machine learning model. No rows, training samples, or mock data from the dataset are displayed in user portals.
   - When a new user creates an account, all dashboards, predictions history, published food listings, and analytics start completely blank and authentic (0 meals prepared, 0 surplus predicted, 0 listings, 0 pickups).
   - Only the public landing page retains platform-wide demo metrics.

---

## 🔑 Demo Account Credentials

| Role | Email | Password | Organization Name | Verification Status |
|---|---|---|---|---|
| **Food Donor** | `donor@demo.com` | `password123` | Grand Palace Hotel & Canteen | Verified |
| **Food Acceptor** | `acceptor@demo.com` | `password123` | Hope Community Food Bank | Verified |
| **Administrator** | `admin@demo.com` | `admin123` | System Administrator | Verified |

---

## 📄 License
Licensed under the MIT License. Developed for educational and production surplus redistribution purposes.
