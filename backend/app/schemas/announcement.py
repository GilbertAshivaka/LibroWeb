"""
Announcement schemas.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.announcement import AnnouncementType, AnnouncementPriority


class AnnouncementBase(BaseModel):
    """Base announcement schema."""
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1)
    announcement_type: AnnouncementType = AnnouncementType.INFO
    priority: AnnouncementPriority = AnnouncementPriority.NORMAL
    is_pinned: bool = False
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class AnnouncementCreate(AnnouncementBase):
    """Schema for creating an announcement."""
    is_active: bool = True
    is_public: bool = True


class AnnouncementUpdate(BaseModel):
    """Schema for updating an announcement."""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[str] = None
    announcement_type: Optional[AnnouncementType] = None
    priority: Optional[AnnouncementPriority] = None
    is_active: Optional[bool] = None
    is_public: Optional[bool] = None
    is_pinned: Optional[bool] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class AnnouncementResponse(AnnouncementBase):
    """Schema for announcement response (admin)."""
    id: int
    is_active: bool
    is_public: bool
    created_at: datetime
    updated_at: datetime
    created_by: Optional[int]
    
    class Config:
        from_attributes = True


class AnnouncementPublic(BaseModel):
    """Schema for public announcement (Qt WebView)."""
    id: int
    title: str
    content: str
    announcement_type: AnnouncementType
    priority: AnnouncementPriority
    is_pinned: bool
    start_date: Optional[datetime]
    
    class Config:
        from_attributes = True
