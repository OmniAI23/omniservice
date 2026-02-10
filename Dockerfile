# --- Stage 1: Build the Frontend ---
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
# Explicitly set Next.js to export mode
ENV NEXT_OUTPUT_EXPORT=true
RUN npm run build

# --- Stage 2: Final Image (Python + Frontend Assets) ---
FROM python:3.11-slim
WORKDIR /app

# Environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH" \
    PORT=8080

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Setup Python environment
RUN python -m venv /opt/venv && pip install --no-cache-dir --upgrade pip
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy Backend code
COPY backend/ ./

# Copy Built Frontend from Stage 1
# Ensure the folder exists if Next.js export was successful
COPY --from=frontend-builder /app/frontend/out ./static

# Create non-root user
RUN useradd --create-home appuser && chown -R appuser /app
USER appuser

EXPOSE 8080

# Use JSON array for CMD as recommended by Docker
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
