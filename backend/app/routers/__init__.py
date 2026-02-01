"""
API routers for Libro Web Platform.
"""
from app.routers.auth import router as auth_router
from app.routers.license import router as license_router
from app.routers.organizations import router as organizations_router
from app.routers.announcements import router as announcements_router
from app.routers.downloads import router as downloads_router
from app.routers.ai_proxy import router as ai_router
from app.routers.admin_users import router as admin_users_router
from app.routers.payments import router as payments_router
from app.routers.tiers import router as tiers_router
from app.routers.dashboard import router as dashboard_router
from app.routers.audit import router as audit_router

__all__ = [
    "auth_router",
    "license_router",
    "organizations_router",
    "announcements_router",
    "downloads_router",
    "ai_router",
    "admin_users_router",
    "payments_router",
    "tiers_router",
    "dashboard_router",
    "audit_router",
]
