"""
Organization schemas.
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class OrganizationBase(BaseModel):
    """Base organization schema."""
    name: str = Field(..., min_length=1, max_length=255)
    location: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    contact_person: Optional[str] = None
    notes: Optional[str] = None


class OrganizationCreate(OrganizationBase):
    """Schema for creating an organization."""
    pass


class OrganizationUpdate(BaseModel):
    """Schema for updating an organization."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    location: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    contact_person: Optional[str] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class OrganizationResponse(OrganizationBase):
    """Schema for organization response."""
    id: int
    organization_id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class OrganizationList(BaseModel):
    """Schema for paginated organization list."""
    items: list[OrganizationResponse]
    total: int
    page: int
    page_size: int
    pages: int
