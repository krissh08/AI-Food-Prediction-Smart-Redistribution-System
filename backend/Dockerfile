FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements
COPY backend/app/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy ML and backend code
COPY ml /app/ml
COPY backend /app/backend

# Train ML models if missing during build
RUN python -m ml.training.train

EXPOSE 8000

ENV DATABASE_URL=sqlite:///./food_surplus.db
ENV JWT_SECRET=super_secret_devops_food_surplus_key_2026

CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
