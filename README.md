# Libro Web Platform

A complete web ecosystem for **Libro ILMS** (Integrated Library Management System) - the business administration side including license management, AI assistant, announcements, and app distribution.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Libro Web Platform                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Frontend   │    │   Backend    │    │   Database   │  │
│  │  React+Vite  │◄──►│   FastAPI    │◄──►│  PostgreSQL  │  │
│  │  TailwindCSS │    │   Python     │    │              │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                             │                               │
│                             ▼                               │
│                      ┌──────────────┐                       │
│                      │    Redis     │                       │
│                      │    Cache     │                       │
│                      └──────────────┘                       │
│                             │                               │
│                             ▼                               │
│                      ┌──────────────┐                       │
│                      │  Gemini AI   │                       │
│                      │    Proxy     │                       │
│                      └──────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

## ✨ Features

### License Management
- Generate unique license keys for organizations
- Activation/validation API for Qt desktop app
- License renewal and revocation
- Multi-activation support with device tracking
- Expiration monitoring and alerts

### Organization Management
- Full CRUD for library customers
- Contact information tracking
- License association and history

### AI Assistant (Libro AI)
- Gemini AI proxy for Qt WebView
- Context-aware library assistance
- Session-based conversation history
- Embedded chat interface

### Announcements
- HTML-formatted announcements
- Priority levels (critical, high, normal, low)
- Date-range scheduling
- Public API for Qt WebView

### App Distribution
- Large file downloads (~3GB) with resume support
- SHA256 checksums for integrity
- Version tracking and release notes
- Download statistics

### Admin Portal
- Modern React dashboard
- Role-based access (Super Admin, Admin, Viewer)
- Payment recording (external payments)
- Subscription tier management
- Audit logging

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)
- Python 3.11+ (for local development)

### Using Docker (Recommended)

1. **Clone and configure**
   ```bash
   cd LibroWeb
   cp backend/.env.example backend/.env
   # Edit .env with your settings
   ```

2. **Start services**
   ```bash
   docker-compose up -d
   ```

3. **Initialize database**
   ```bash
   docker exec -it libro_backend python -c "
   from app.database import engine, Base
   from app.models import *
   import asyncio
   asyncio.run(Base.metadata.create_all(bind=engine))
   "
   ```

4. **Create admin user**
   ```bash
   docker exec -it libro_backend python -m app.utils.create_admin
   ```

5. **Access the platform**
   - Admin Portal: http://localhost:5173
   - API Docs: http://localhost:8000/docs
   - Qt Embed AI: http://localhost:5173/embed/ai
   - Qt Announcements: http://localhost:5173/embed/announcements

### Local Development

**Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 📁 Project Structure

```
LibroWeb/
├── backend/
│   ├── app/
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── routers/         # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Helpers (security, license gen)
│   │   ├── config.py        # Settings
│   │   ├── database.py      # DB connection
│   │   └── main.py          # FastAPI app
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── admin/       # Admin dashboard pages
│   │   │   └── embed/       # Qt WebView pages
│   │   ├── layouts/         # Page layouts
│   │   ├── store/           # Zustand state
│   │   ├── api/             # API client
│   │   └── App.jsx          # Routes
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
└── docker-compose.yml
```

## 🔌 API Endpoints

### Public (No Auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/license/activate` | Activate license (Qt app) |
| POST | `/api/v1/license/validate` | Validate license (Qt app) |
| POST | `/api/v1/ai/chat` | AI chat proxy |
| GET | `/api/v1/announcements/public` | Get public announcements |
| GET | `/api/v1/downloads/latest` | Get latest release info |
| GET | `/api/v1/downloads/file/{id}` | Download installer (with resume) |

### Admin (Auth Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Admin login |
| GET | `/api/v1/dashboard/stats` | Dashboard statistics |
| CRUD | `/api/v1/organizations/` | Organization management |
| CRUD | `/api/v1/license/` | License management |
| CRUD | `/api/v1/announcements/` | Announcement management |
| CRUD | `/api/v1/downloads/` | Release management |
| CRUD | `/api/v1/payments/` | Payment records |
| CRUD | `/api/v1/tiers/` | Subscription tiers |
| CRUD | `/api/v1/admin-users/` | Admin user management |

## 🔧 Configuration

### Environment Variables

```env
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/libro_web

# Redis
REDIS_URL=redis://localhost:6379/0

# Security
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-here
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# AI
GEMINI_API_KEY=your-gemini-api-key

# App
DEBUG=false
CORS_ORIGINS=["http://localhost:5173"]
```

## 🎨 Theme

The platform uses warm, cozy colors matching the Libro desktop app:

- **Primary (Coral):** `#ec6b5b`
- **Background (Cream):** `#faf8f5`
- **Text (Warm Gray):** `#44403c`

## 📱 Qt WebView Integration

### AI Page
```cpp
// In your Qt application
QWebEngineView *webView = new QWebEngineView(this);
webView->load(QUrl("https://your-domain.com/embed/ai"));
```

### Announcements Page
```cpp
QWebEngineView *webView = new QWebEngineView(this);
webView->load(QUrl("https://your-domain.com/embed/announcements"));
```

### License Activation
```cpp
// POST to /api/v1/license/activate
QJsonObject payload;
payload["license_key"] = "LIBRO-XXXX-XXXX-XXXX";
payload["hardware_id"] = getHardwareId();
payload["app_version"] = APP_VERSION;
```

## 📝 License

Proprietary - Libro ILMS

## 🤝 Contributing & Local Development

See [CONTRIBUTING.md](CONTRIBUTING.md) for a step-by-step guide on:
- Cloning the repository
- **Pulling the latest changes from GitHub into VS Code**
- Updating dependencies after a pull
- Running the project locally
- Troubleshooting common issues

## 🤝 Support

For support, contact the Libro development team.
