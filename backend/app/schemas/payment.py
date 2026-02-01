"""
Payment schemas.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal
from app.models.payment import PaymentStatus


class PaymentBase(BaseModel):
    """Base payment schema."""
    amount: Decimal = Field(..., gt=0)
    currency: str = "USD"
    payment_method: Optional[str] = None
    transaction_id: Optional[str] = None
    notes: Optional[str] = None


class PaymentCreate(PaymentBase):
    """Schema for creating a payment record."""
    organization_id: int
    license_id: Optional[int] = None
    status: PaymentStatus = PaymentStatus.COMPLETED


class PaymentUpdate(BaseModel):
    """Schema for updating a payment record."""
    status: Optional[PaymentStatus] = None
    notes: Optional[str] = None


class PaymentResponse(PaymentBase):
    """Schema for payment response."""
    id: int
    organization_id: int
    license_id: Optional[int]
    status: PaymentStatus
    payment_date: datetime
    
    class Config:
        from_attributes = True
