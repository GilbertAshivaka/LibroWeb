"""
License schemas.
"""
from pydantic import BaseModel, Field, model_validator
from typing import Optional, Any
from datetime import date, datetime


class LicenseBase(BaseModel):
    """Base license schema."""
    tier_id: int
    expiry_date: date


class LicenseCreate(LicenseBase):
    """Schema for creating a license."""
    organization_id: int
    max_activations: int = 1
    is_trial: bool = False


class LicenseUpdate(BaseModel):
    """Schema for updating a license."""
    tier_id: Optional[int] = None
    expiry_date: Optional[date] = None
    is_active: Optional[bool] = None
    is_revoked: Optional[bool] = None
    revoked_reason: Optional[str] = None


class OrganizationBrief(BaseModel):
    """Brief organization info for license response."""
    id: int
    name: str
    organization_id: str
    
    class Config:
        from_attributes = True


class TierBrief(BaseModel):
    """Brief tier info for license response."""
    id: int
    name: str
    code: str
    
    class Config:
        from_attributes = True
    
    @model_validator(mode='before')
    @classmethod
    def map_tier_fields(cls, data):
        """Map SubscriptionTier model fields to brief response fields."""
        if hasattr(data, 'tier_name'):
            return {'id': data.id, 'name': data.tier_name, 'code': data.tier_code}
        return data


class LicenseResponse(BaseModel):
    """Schema for license response."""
    id: int
    organization_id: int
    license_key: str
    tier_id: int
    activation_date: Optional[date]
    expiry_date: date
    is_active: bool
    is_revoked: bool
    is_trial: bool = False
    revoked_reason: Optional[str]
    max_activations: int = 3
    activation_count: int = 0
    created_at: datetime
    updated_at: datetime
    organization: Optional[OrganizationBrief] = None
    tier: Optional[TierBrief] = None
    
    class Config:
        from_attributes = True


# --- Desktop App Activation/Validation Schemas ---

class LicenseActivateRequest(BaseModel):
    """Request from Qt desktop app for activation."""
    organization_id: str = Field(..., description="Organization ID (ORG-XXXXX)")
    license_key: str = Field(..., description="License key (XXXX-XXXX-XXXX-XXXX)")


class LicenseTierInfo(BaseModel):
    """License tier information in response."""
    tier: str
    tier_name: str
    activation_date: Optional[str]
    expiry_date: str
    features: dict[str, Any]


class OrganizationInfo(BaseModel):
    """Organization information in response."""
    name: str
    location: Optional[str]
    address: Optional[str]
    phone: Optional[str]
    email: Optional[str]


class LicenseActivateResponse(BaseModel):
    """Response to Qt desktop app for activation."""
    success: bool
    message: str
    license: Optional[LicenseTierInfo] = None
    organization: Optional[OrganizationInfo] = None
    error: Optional[str] = None
    expiry_date: Optional[str] = None
    reason: Optional[str] = None


class LicenseValidateRequest(BaseModel):
    """Request from Qt desktop app for validation."""
    organization_id: str = Field(..., description="Organization ID (ORG-XXXXX)")
    license_key: str = Field(..., description="License key (XXXX-XXXX-XXXX-XXXX)")


class LicenseValidateResponse(BaseModel):
    """Response to Qt desktop app for validation."""
    success: bool
    valid: Optional[bool] = None
    message: Optional[str] = None
    license: Optional[LicenseTierInfo] = None
    days_remaining: Optional[int] = None
    error: Optional[str] = None
    expiry_date: Optional[str] = None
