"""
App release schemas.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class AppReleaseBase(BaseModel):
    """Base app release schema."""
    version: str = Field(..., min_length=1, max_length=20)
    release_name: Optional[str] = None
    release_notes: Optional[str] = None
    platform: str = "windows"
    min_os_version: Optional[str] = None
    is_beta: bool = False


class AppReleaseCreate(AppReleaseBase):
    """Schema for creating an app release (file uploaded separately)."""
    pass


class AppReleaseUpdate(BaseModel):
    """Schema for updating an app release."""
    release_name: Optional[str] = None
    release_notes: Optional[str] = None
    min_os_version: Optional[str] = None
    is_beta: Optional[bool] = None
    is_latest: Optional[bool] = None
    is_active: Optional[bool] = None


class AppReleaseResponse(AppReleaseBase):
    """Schema for app release response (admin)."""
    id: int
    file_name: str
    file_path: str
    file_size: int
    checksum_sha256: Optional[str]
    is_latest: bool
    is_active: bool
    download_count: int
    release_date: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True


class AppReleasePublic(BaseModel):
    """Schema for public app release (download page)."""
    version: str
    release_name: Optional[str]
    release_notes: Optional[str]
    file_name: str
    file_size: int
    checksum_sha256: Optional[str]
    platform: str
    min_os_version: Optional[str]
    is_beta: bool
    release_date: datetime
    
    class Config:
        from_attributes = True


class VersionCheck(BaseModel):
    """Schema for version check response (Qt app)."""
    latest_version: str
    current_version_supported: bool
    download_url: str
    file_size: int
    checksum_sha256: Optional[str]
    release_notes: Optional[str]
    is_mandatory_update: bool = False
