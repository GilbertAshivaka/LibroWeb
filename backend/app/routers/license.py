"""
License router - handles activation and validation from Qt app.
"""
from fastapi import APIRouter, Depends, Request
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
        from fastapi import HTTPException, status
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
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="License not found"
        )
    
    return LicenseResponse.model_validate(license)
