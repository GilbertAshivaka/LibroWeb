#!/bin/bash

echo ""
echo "========================================"
echo "  Libro Web Platform - Quick Start"
echo "========================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "[ERROR] Docker is not running. Please start Docker first."
    exit 1
fi

echo "[1/4] Starting services with Docker Compose..."
docker-compose up -d

echo ""
echo "[2/4] Waiting for services to be ready..."
sleep 10

echo ""
echo "[3/4] Initializing database..."
docker exec libro_backend python -m app.utils.init_db

echo ""
echo "[4/4] Creating sample data..."
docker exec libro_backend python -m app.utils.seed_data

echo ""
echo "========================================"
echo "  Setup Complete!"
echo "========================================"
echo ""
echo "Now create an admin user:"
echo "  docker exec -it libro_backend python -m app.utils.create_admin"
echo ""
echo "Access the platform:"
echo "  - Admin Portal: http://localhost:5173"
echo "  - API Docs:     http://localhost:8000/docs"
echo "  - Qt AI Page:   http://localhost:5173/embed/ai"
echo ""
