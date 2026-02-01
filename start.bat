@echo off
echo.
echo ========================================
echo   Libro Web Platform - Quick Start
echo ========================================
echo.

:: Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

echo [1/4] Starting services with Docker Compose...
docker-compose up -d

echo.
echo [2/4] Waiting for services to be ready...
timeout /t 10 /nobreak >nul

echo.
echo [3/4] Initializing database...
docker exec libro_backend python -m app.utils.init_db

echo.
echo [4/4] Creating sample data...
docker exec libro_backend python -m app.utils.seed_data

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Now create an admin user:
echo   docker exec -it libro_backend python -m app.utils.create_admin
echo.
echo Access the platform:
echo   - Admin Portal: http://localhost:5173
echo   - API Docs:     http://localhost:8000/docs
echo   - Qt AI Page:   http://localhost:5173/embed/ai
echo.
pause
