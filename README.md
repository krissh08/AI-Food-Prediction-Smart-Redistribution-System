# 🌿 AI-Driven Food Surplus Prediction and Smart Redistribution System

> *Production-grade full-stack web application integrating Scikit-Learn Machine Learning, FastAPI, React 18 + Vite, PostgreSQL, Leaflet OpenStreetMap, Docker, and GitHub Actions CI/CD pipelines.*

---

## 📌 Problem Statement

Global food wastage is a major social, environmental, and economic crisis. Millions of tons of edible food prepared by restaurants, hotels, canteen cafeterias, and banquet organizers end up in landfills, while community shelters, food banks, and charitable NGOs struggle with food insecurity. 

Key challenges include:
1. **Unpredictable Prep Quantities**: Establishments over-prepare meals due to lack of predictive analytics.
2. **Delayed Redistribution**: Surplus food expires rapidly before NGOs can be identified and notified.
3. **Lack of Role Isolation & Transparency**: Donors and acceptors require tailored workflows, distance-based matching, and real-time pickup tracking.

---

## 🚀 Proposed Solution

**NourishSync** is an end-to-end AI-driven platform that:
- **Predicts Food Surplus & Demand**: Utilizes trained **Random Forest Regressor** and **Gradient Boosting Regressor** models to forecast consumption and recommend ideal cooking quantities.
- **Flags Waste Anomalies**: Automatically detects unusual food waste spikes (>60% above normal baseline).
- **Smart Matching Algorithm**: Computes transparent match scores (0-100%) ranking nearby NGOs based on distance (Haversine formula), capacity, expiry priority, and dietary preferences.
- **Strict Role Separation**: Provides completely isolated portals for **Food Donors**, **Food Acceptors**, and **System Administrators**.

---

## 🌟 Key Features

### 🏢 1. Food Donor Portal
- **Interactive AI Prediction Dashboard**: Input planned meals, event status, weather, and customer count to receive instant ML demand forecasts.
- **Surplus Food Listings**: Publish active food listings with preparation time, expiry countdown, quantity, and pickup address.
- **Request Management**: Approve or reject NGO requests and schedule collection windows.
- **Pickup Tracking & CSR Analytics**: Monitor active pickups, meals saved, and monthly waste reduction trends.

### 🤝 2. Food Acceptor Portal (NGOs & Food Banks)
- **Geographic Food Map**: OpenStreetMap Leaflet integration showing active listings within radius circles.
- **Filterable Catalog**: Search by distance (5km - 50km), food category, dietary type (Veg/Non-Veg/Vegan), and expiry.
- **Explainable Smart Match Scores**: View breakdown scores (Distance, Capacity, Expiry Urgency, Dietary Preference).
- **Pickup Confirmation**: Mark food as collected and update community distribution records.

### 🛡️ 3. Admin & Security
- **Role-Based Access Control (RBAC)**: Strict JWT authorization preventing Donors from accessing Acceptor APIs and vice-versa.
- **Account Status Control**: Enable/disable fraudulent or inactive accounts.
- **Platform Analytics**: Total meals saved, CO₂ emissions prevented, and active donor/acceptor counts.

---

## 🤖 AI / Machine Learning Pipeline (`/ml`)

The machine learning pipeline is housed in `/ml` and contains:
1. **Dataset Generation (`generate_dataset.py`)**: Generates 800 synthetic historical records (`dataset.csv`) modeling real-world meal prep, attendance, weather, events, and wastage.
2. **Preprocessing (`preprocess.py`)**: Feature scaling (`StandardScaler`) for numerical variables and one-hot encoding (`OneHotEncoder`) for categorical variables.
3. **Model Training (`train.py`)**:
   - **Demand Predictor**: `RandomForestRegressor` (R² ≈ 0.98, MAE ≈ 20 meals)
   - **Surplus Predictor**: `GradientBoostingRegressor` (R² ≈ 0.75, MAE ≈ 24 meals)
4. **Inference & Anomaly Engine (`predict.py`)**: Generates real predictions, preparation recommendations, surplus probabilities, and anomaly alerts.

---

## 🗄️ Database Architecture (PostgreSQL / SQLite)

```
  +------------------+         +----------------------+
  |      USERS       | 1----1  |    DONOR_PROFILES    |
  +------------------+         +----------------------+
  | id (PK)          |         | id (PK)              |
  | email (Unique)   |         | user_id (FK)         |
  | password_hash    |         | organization_name    |
  | role             |         | organization_type    |
  | phone            |         | latitude, longitude  |
  +------------------+         +----------------------+
          | 1                           | 1
          |                             |
          | 1                           | *
  +------------------+         +----------------------+
  | ACCEPTOR_PROFILES|         |    FOOD_LISTINGS     |
  +------------------+         +----------------------+
  | id (PK)          |         | id (PK)              |
  | user_id (FK)     |         | donor_id (FK)        |
  | max_capacity     |         | food_name, category  |
  | operating_hours  |         | quantity, unit       |
  +------------------+         | status, expiry_time  |
          | 1                  +----------------------+
          |                             | 1
          | *                           | *
          +--------------+--------------+
                         |
               +-------------------+
               | DONATION_REQUESTS |
               +-------------------+
               | id (PK)           |
               | food_listing_id   |
               | acceptor_id (FK)  |
               | requested_qty     |
               | status, pickup_time|
               +-------------------+
                         | 1
                         | 1
               +-------------------+
               |      PICKUPS      |
               +-------------------+
               | id (PK)           |
               | donation_req_id   |
               | pickup_status     |
               | confirmed_at      |
               +-------------------+
```

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons, Leaflet Maps, Recharts |
| **Backend** | Python 3.11, FastAPI, Pydantic v2, SQLAlchemy ORM, PyJWT |
| **Machine Learning** | Scikit-Learn, Pandas, NumPy, Joblib |
| **Database** | PostgreSQL (Production Docker) / SQLite (Local Dev Fallback) |
| **DevOps & CI/CD** | Docker, Docker Compose, Nginx, GitHub Actions, Pytest |

---

## ⚡ Quick Start & Local Running

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm
- Git

### 1. Backend & ML Setup
```bash
# Clone Repository
git clone https://github.com/krissh08/Code_Alpha_AI_FAQ_Chatbot.git
cd Code_Alpha_AI_FAQ_Chatbot

# Install Backend & ML Dependencies
python -m pip install -r backend/app/requirements.txt

# Train ML Model Pipeline
python -m ml.training.train

# Start FastAPI Backend Server
python -m uvicorn backend.app.main:app --reload --port 8000
```
*API Swagger Documentation will be available at: `http://localhost:8000/docs`*

### 2. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install Node Packages
npm install

# Start Vite Development Server
npm run dev
```
*Open `http://localhost:5173` in your web browser.*

---

## 🐳 Docker Deployment Instructions

Run the entire stack (PostgreSQL + FastAPI Backend + React Nginx Frontend) with one command:

```bash
# Build and launch all services
docker-compose up --build -d

# Check running container status
docker-compose ps
```

- **Frontend App**: `http://localhost:80`
- **Backend API**: `http://localhost:8000`
- **PostgreSQL Database**: `localhost:5432`

---

## 🧪 Automated Testing

Run the comprehensive Pytest backend test suite covering Auth, Role RBAC, AI Endpoint Inference, Food Listings, and Smart Matching:

```bash
python -m pytest backend/tests/test_backend.py -v
```

---

## 👥 Engineering Team & Git Branch Structure

Project architecture and feature branch breakdown:

| Member Name | Role & Primary Responsibility | Git Feature Branch |
|---|---|---|
| **Member 1** | **DevOps Lead & CI/CD Engineer**: Dockerfile creation, Docker Compose orchestration, GitHub Actions CI/CD workflow setup. | `feature/devops-ci-cd` |
| **Member 2** | **AI/ML Engineer**: Synthetic dataset generation, Random Forest & Gradient Boosting model training, evaluation metrics, anomaly detection. | `feature/ml-pipeline` |
| **Member 3** | **Backend Developer**: FastAPI REST endpoints, SQLAlchemy ORM models, PostgreSQL database schema, JWT auth. | `feature/backend-api` |
| **Member 4** | **Frontend UI/UX Lead**: React Vite single-page app, Tailwind CSS design system, Leaflet OpenStreetMap, Recharts graphs. | `feature/frontend-ui` |
| **Member 5** | **QA & Security Tester**: Role-based access control (RBAC) test suite, Pytest automation, Smart Food Matching algorithm verification. | `feature/qa-security-tests` |

---

## 🔑 Demo Account Credentials

For evaluation and demonstration purposes, the system pre-seeds these accounts on startup:

| Role | Email | Password | Organization Name |
|---|---|---|---|
| **Food Donor** | `donor@demo.com` | `password123` | Grand Palace Hotel & Canteen |
| **Food Acceptor** | `acceptor@demo.com` | `password123` | Hope Community Food Bank |
| **Administrator** | `admin@demo.com` | `admin123` | System Administrator |

---

## 📄 License
Licensed under the MIT License. Developed for educational purposes.
