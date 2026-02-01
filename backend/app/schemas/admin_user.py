"""
Admin user schemas.
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from app.models.admin_user import AdminRole


class AdminUserBase(BaseModel):
    """Base admin user schema."""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: Optional[str] = None
    role: AdminRole = AdminRole.ADMIN


class AdminUserCreate(AdminUserBase):
    """Schema for creating an admin user."""
    password: str = Field(..., min_length=8)


class AdminUserUpdate(BaseModel):
    """Schema for updating an admin user."""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[AdminRole] = None
    is_active: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=8)


class AdminUserResponse(BaseModel):
    """Schema for admin user response."""
    id: int
    username: str
    email: str
    full_name: Optional[str]
    role: AdminRole
    is_active: bool
    last_login: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True


class AdminUserLogin(BaseModel):
    """Schema for login request."""
    username: str
    password: str


class Token(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"
    user: AdminUserResponse
