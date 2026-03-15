"""
License router - handles activation and validation from Qt app.
"""
from fastapi import APIRouter, Depends, Request, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.license import (
    LicenseActivateRequest, LicenseActivateResponse,
    LicenseValidateRequest, LicenseValidateResponse,
    LicenseCreate, LicenseUpdate, LicenseResponse
)
from app.services.license_service import LicenseService
from app.routers.deps import get_current_user, require_admin
from app.models.admin_user import AdminUser
from typing import Optional

router = APIRouter(prefix="/license", tags=["License"])


# ============================================
# Qt Desktop App Endpoints (No Auth Required)
# ============================================

@router.post("/activate", response_model=LicenseActivateResponse)
async def activate_license(
    data: LicenseActivateRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Activate a license from the Qt desktop application.
    Called when user enters their Organization ID and License Key.
    """
    ip_address = request.client.host if request.client else None
    
    license_service = LicenseService(db)
    response = await license_service.activate(
        org_id=data.organization_id,
        license_key=data.license_key,
        ip_address=ip_address
    )
    
    return response


@router.post("/validate", response_model=LicenseValidateResponse)
async def validate_license(
    data: LicenseValidateRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Validate a license from the Qt desktop application.
    Called on app startup and periodically.
    """
    ip_address = request.client.host if request.client else None
    
    license_service = LicenseService(db)
    response = await license_service.validate(
        org_id=data.organization_id,
        license_key=data.license_key,
        ip_address=ip_address
    )
    
    return response


# ============================================
# Admin Portal Endpoints (Auth Required)
# ============================================

@router.get("/", response_model=dict)
async def list_licenses(
    page: int = 1,
    page_size: int = 20,
    organization_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(require_admin)
):
    """
    List all licenses (admin only).
    """
    license_service = LicenseService(db)
    licenses, total = await license_service.get_all(
        page=page,
        page_size=page_size,
        organization_id=organization_id,
        is_active=is_active
    )
    
    return {
        "items": [LicenseResponse.model_validate(l) for l in licenses],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size
    }


@router.post("/generate", response_model=LicenseResponse)
async def generate_license(
    data: LicenseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(require_admin)
):
    """
    Generate a new license for an organization (admin only).
    """
    license_service = LicenseService(db)
    license = await license_service.create(data)
    return LicenseResponse.model_validate(license)


@router.get("/{license_id}", response_model=LicenseResponse)
async def get_license(
    license_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """
    Get a specific license by ID.
    """
    license_service = LicenseService(db)
    license = await license_service.get_by_id(license_id)
    
    if not license:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="License not found"
        )
    
    return LicenseResponse.model_validate(license)


@router.patch("/{license_id}", response_model=LicenseResponse)
async def update_license(
    license_id: int,
    data: LicenseUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(require_admin)
):
    """
    Update a license (admin only).
    """
    license_service = LicenseService(db)
    license = await license_service.update(license_id, data)
    
    if not license:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="License not found"
        )
    
    return LicenseResponse.model_validate(license)


class LicenseRenewRequest(BaseModel):
    """Request to renew/extend a license."""
    days: int


@router.post("/{license_id}/revoke", response_model=LicenseResponse)
async def revoke_license(
    license_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(require_admin)
):
    """
    Revoke a license (admin only).
    """
    license_service = LicenseService(db)
    license = await license_service.get_by_id(license_id)
    
    if not license:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="License not found"
        )
    
    license.is_revoked = True
    license.is_active = False
    await db.flush()
    license = await license_service.get_by_id(license_id)
    return LicenseResponse.model_validate(license)


@router.post("/{license_id}/renew", response_model=LicenseResponse)
async def renew_license(
    license_id: int,
    data: LicenseRenewRequest,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(require_admin)
):
    """
    Renew/extend a license by a number of days (admin only).
    """
    from datetime import date as date_type, timedelta
    
    license_service = LicenseService(db)
    license = await license_service.get_by_id(license_id)
    
    if not license:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="License not found"
        )
    
    # Extend from today or current expiry, whichever is later
    base_date = max(license.expiry_date, date_type.today())
    license.expiry_date = base_date + timedelta(days=data.days)
    license.is_active = True
    license.is_revoked = False
    await db.flush()
    license = await license_service.get_by_id(license_id)
    return LicenseResponse.model_validate(license)
