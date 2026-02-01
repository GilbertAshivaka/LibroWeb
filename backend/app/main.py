"""
Libro Web Platform - Main FastAPI Application
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.config import settings
from app.database import init_db, close_db
from app.routers import (
    auth_router,
    license_router,
    organizations_router,
    announcements_router,
    downloads_router,
    ai_router,
    admin_users_router,
    payments_router,
    tiers_router,
    dashboard_router,
    audit_router,
)
from app.routers.public import router as public_router
from app.routers.portal import router as portal_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    print(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    
    # Initialize database
    await init_db()
    
    # Create default admin user
    from app.database import async_session_factory
    from app.services.auth_service import create_default_admin
    async with async_session_factory() as session:
        await create_default_admin(session)
    
    # Ensure upload directories exist
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(os.path.join(settings.UPLOAD_DIR, "releases"), exist_ok=True)
    
    # Create default subscription tiers
    from app.database import async_session_factory
    from sqlalchemy import select
    from app.models.subscription_tier import SubscriptionTier
    
    async with async_session_factory() as session:
        result = await session.execute(select(SubscriptionTier))
        if not result.scalars().first():
            # Insert default tiers
            tiers = [
                SubscriptionTier(
                    tier_code="trial",
                    tier_name="Trial",
                    description="7-day free trial with full features",
                    max_users=None,
                    max_books=None,
                    monthly_price=0.00,
                    annual_price=0.00,
                    features={"all_features": True, "support": "email"}
                ),
                SubscriptionTier(
                    tier_code="basic",
                    tier_name="Basic",
                    description="Essential library management features",
                    max_users=50,
                    max_books=10000,
                    monthly_price=29.99,
                    annual_price=299.99,
                    features={
                        "circulation": True,
                        "catalog": True,
                        "reports_basic": True,
                        "opac": True,
                        "support": "email"
                    }
                ),
                SubscriptionTier(
                    tier_code="premium",
                    tier_name="Premium",
                    description="Full-featured library management",
                    max_users=None,
                    max_books=None,
                    monthly_price=79.99,
                    annual_price=799.99,
                    features={
                        "circulation": True,
                        "catalog": True,
                        "reports_advanced": True,
                        "opac": True,
                        "email_notifications": True,
                        "api_access": True,
                        "support": "priority"
                    }
                ),
            ]
            for tier in tiers:
                session.add(tier)
            await session.commit()
            print("Default subscription tiers created")
    
    yield
    
    # Shutdown
    print("Shutting down...")
    await close_db()


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for Libro Library Management System ecosystem",
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routes
API_PREFIX = "/api/v1"

app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(license_router, prefix=API_PREFIX)
app.include_router(organizations_router, prefix=API_PREFIX)
app.include_router(announcements_router, prefix=API_PREFIX)
app.include_router(downloads_router, prefix=API_PREFIX)
app.include_router(ai_router, prefix=API_PREFIX)
app.include_router(admin_users_router, prefix=API_PREFIX)
app.include_router(payments_router, prefix=API_PREFIX)
app.include_router(tiers_router, prefix=API_PREFIX)
app.include_router(dashboard_router, prefix=API_PREFIX)
app.include_router(audit_router, prefix=API_PREFIX)
app.include_router(public_router, prefix=API_PREFIX)
app.include_router(portal_router, prefix=API_PREFIX)


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION
    }


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint - API information."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/api/docs",
        "health": "/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
