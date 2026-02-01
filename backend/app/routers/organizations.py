"""
Organizations router.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.database import get_db
from app.schemas.organization import (
    OrganizationCreate, OrganizationUpdate, OrganizationResponse, OrganizationList
)
from app.services.organization_service import OrganizationService
from app.routers.deps import get_current_user, require_admin
from app.models.admin_user import AdminUser

router = APIRouter(prefix="/organizations", tags=["Organizations"])


@router.get("/", response_model=OrganizationList)
async def list_organizations(
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """
    List all organizations with pagination and search.
    """
    org_service = OrganizationService(db)
    organizations, total = await org_service.get_all(
        page=page,
        page_size=page_size,
        search=search,
        is_active=is_active
    )
    
    return OrganizationList(
        items=[OrganizationResponse.model_validate(o) for o in organizations],
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size
    )


@router.post("/", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
async def create_organization(
    data: OrganizationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(require_admin)
):
    """
    Create a new organization (admin only).
    """
    org_service = OrganizationService(db)
    organization = await org_service.create(data)
    return OrganizationResponse.model_validate(organization)


@router.get("/{org_id}", response_model=OrganizationResponse)
async def get_organization(
    org_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """
    Get organization by ID.
    """
    org_service = OrganizationService(db)
    organization = await org_service.get_by_id(org_id)
    
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    return OrganizationResponse.model_validate(organization)


@router.patch("/{org_id}", response_model=OrganizationResponse)
async def update_organization(
    org_id: int,
    data: OrganizationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(require_admin)
):
    """
    Update an organization (admin only).
    """
    org_service = OrganizationService(db)
    organization = await org_service.update(org_id, data)
    
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    return OrganizationResponse.model_validate(organization)


@router.delete("/{org_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_organization(
    org_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(require_admin)
):
    """
    Delete an organization (admin only).
    Warning: This will also delete all associated licenses.
    """
    org_service = OrganizationService(db)
    deleted = await org_service.delete(org_id)
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
