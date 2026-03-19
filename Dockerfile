# Unified dev image to run both backend and frontend via start.py

FROM node:18-bullseye

# Install Python, build tools, and Tor (for IP rotation on Open-Meteo sync)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       python3 \
       python3-pip \
       python-is-python3 \
       build-essential \
       git \
       ca-certificates \
       curl \
       tor \
    && rm -rf /var/lib/apt/lists/*

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Backend deps (leverage layer caching)
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Frontend deps (leverage layer caching)
COPY frontend/package*.json /app/frontend/
RUN bash -lc 'cd /app/frontend && if [ -f package-lock.json ]; then npm ci; else npm install; fi'

# App source
COPY . /app

EXPOSE 8000 5173

# Default command launches both servers (FastAPI + Vite) via the launcher
CMD ["python", "start.py"]
