# Libro Web Platform - Backend

FastAPI backend for the Libro Library Management System ecosystem.

## Features

- 🔐 License activation and validation API (for Qt desktop app)
- 👥 Organization management
- 📢 Announcements system
- 📥 App release/download management (with resume support)
- 🤖 AI proxy (Gemini API)
- 🔑 JWT authentication for admin portal
- 📊 Payment tracking

## Quick Start

### 1. Prerequisites

- Python 3.11+
- PostgreSQL 14+
- Redis (optional, for rate limiting)

### 2. Setup

```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
# Copy example config
cp .env.example .env

# Edit .env with your settings
```

### 4. Setup Database

```bash
# Create PostgreSQL database
createdb libro_web

# Or using psql
psql -U postgres -c "CREATE DATABASE libro_web;"
```

### 5. Run the Server

```bash
# Development mode
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or using Python
python -m app.main
```

### 6. Access

- API Docs: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc
- Health Check: http://localhost:8000/health

## Default Admin

On first run, a default admin user is created:
- **Username:** admin
- **Password:** admin123

⚠️ **Change this password immediately in production!**

## API Endpoints

### Public (No Auth)
- `POST /api/v1/license/activate` - Qt app license activation
- `POST /api/v1/license/validate` - Qt app license validation
- `GET /api/v1/announcements/public` - Public announcements (for Qt WebView)
- `GET /api/v1/downloads/latest` - Latest release info
- `GET /api/v1/downloads/check-version` - Version check for Qt app
- `GET /api/v1/downloads/file/{version}` - Download installer
- `POST /api/v1/ai/chat` - AI chat proxy (for Qt WebView)

### Admin Portal (Auth Required)
- `/api/v1/auth/*` - Authentication
- `/api/v1/organizations/*` - Organization CRUD
- `/api/v1/license/*` - License management
- `/api/v1/announcements/*` - Announcement CRUD
- `/api/v1/downloads/*` - Release management
- `/api/v1/payments/*` - Payment tracking
- `/api/v1/admin-users/*` - Admin user management
- `/api/v1/tiers/*` - Subscription tier management

## Project Structure

```
backend/
├── app/
│   ├── main.py           # FastAPI application
│   ├── config.py         # Settings
│   ├── database.py       # Database connection
│   ├── models/           # SQLAlchemy models
│   ├── schemas/          # Pydantic schemas
│   ├── routers/          # API routes
│   ├── services/         # Business logic
│   └── utils/            # Utilities
├── uploads/              # File storage
├── requirements.txt
├── .env.example
└── README.md
```
