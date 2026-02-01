"""
Announcements router.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.database import get_db
from app.schemas.announcement import (
    AnnouncementCreate, AnnouncementUpdate, AnnouncementResponse, AnnouncementPublic
)
from app.services.announcement_service import AnnouncementService
from app.routers.deps import get_current_user, require_admin
from app.models.admin_user import AdminUser

router = APIRouter(prefix="/announcements", tags=["Announcements"])


# ============================================
# Public Endpoint (For Qt WebView - No Auth)
# ============================================

@router.get("/public", response_model=list[AnnouncementPublic])
async def get_public_announcements(
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """
    Get published announcements for Qt WebView.
    No authentication required.
    """
    announcement_service = AnnouncementService(db)
    announcements = await announcement_service.get_public(limit=limit)
    return [AnnouncementPublic.model_validate(a) for a in announcements]


# ============================================
# Admin Endpoints (Auth Required)
# ============================================

@router.get("/", response_model=dict)
async def list_announcements(
    page: int = 1,
    page_size: int = 20,
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """
    List all announcements (admin view).
    """
    announcement_service = AnnouncementService(db)
    announcements, total = await announcement_service.get_all(
        page=page,
        page_size=page_size,
        is_active=is_active
    )
    
    return {
        "items": [AnnouncementResponse.model_validate(a) for a in announcements],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size
    }


@router.post("/", response_model=AnnouncementResponse, status_code=status.HTTP_201_CREATED)
async def create_announcement(
    data: AnnouncementCreate,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(require_admin)
):
    """
    Create a new announcement (admin only).
    """
    announcement_service = AnnouncementService(db)
    announcement = await announcement_service.create(data, created_by=current_user.id)
    return AnnouncementResponse.model_validate(announcement)


@router.get("/{announcement_id}", response_model=AnnouncementResponse)
async def get_announcement(
    announcement_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """
    Get a specific announcement.
    """
    announcement_service = AnnouncementService(db)
    announcement = await announcement_service.get_by_id(announcement_id)
    
    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found"
        )
    
    return AnnouncementResponse.model_validate(announcement)


@router.patch("/{announcement_id}", response_model=AnnouncementResponse)
async def update_announcement(
    announcement_id: int,
    data: AnnouncementUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(require_admin)
):
    """
    Update an announcement (admin only).
    """
    announcement_service = AnnouncementService(db)
    announcement = await announcement_service.update(announcement_id, data)
    
    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found"
        )
    
    return AnnouncementResponse.model_validate(announcement)


@router.delete("/{announcement_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_announcement(
    announcement_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(require_admin)
):
    """
    Delete an announcement (admin only).
    """
    announcement_service = AnnouncementService(db)
    deleted = await announcement_service.delete(announcement_id)
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found"
        )
