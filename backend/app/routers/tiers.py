"""
Subscription tiers router.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, Any
from pydantic import BaseModel
from decimal import Decimal
from app.database import get_db
from app.models.subscription_tier import SubscriptionTier
from app.routers.deps import get_current_user, require_super_admin
from app.models.admin_user import AdminUser

router = APIRouter(prefix="/tiers", tags=["Subscription Tiers"])


class TierResponse(BaseModel):
    """Tier response schema."""
    id: int
    code: str
    name: str
    description: Optional[str] = None
    max_users: Optional[int] = None
    max_records: Optional[int] = None
    features: Optional[Any] = None
    price_monthly: Optional[Decimal] = None
    price_annual: Optional[Decimal] = None
    is_active: bool = True


class TierCreate(BaseModel):
    """Tier create schema."""
    code: str
    name: str
    description: Optional[str] = None
    max_users: Optional[int] = None
    max_records: Optional[int] = None
    features: Optional[Any] = None
    price_monthly: Optional[Decimal] = None
    price_annual: Optional[Decimal] = None


class TierUpdate(BaseModel):
    """Tier update schema."""
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    max_users: Optional[int] = None
    max_records: Optional[int] = None
    features: Optional[Any] = None
    price_monthly: Optional[Decimal] = None
    price_annual: Optional[Decimal] = None
    is_active: Optional[bool] = None


def _tier_to_response(t: SubscriptionTier) -> TierResponse:
    """Convert a SubscriptionTier model to a TierResponse."""
    return TierResponse(
        id=t.id,
        code=t.tier_code,
        name=t.tier_name,
        description=t.description,
        max_users=t.max_users,
        max_records=t.max_books,
        features=t.features,
        price_monthly=t.monthly_price,
        price_annual=t.annual_price,
        is_active=t.is_active,
    )


@router.get("/", response_model=list[TierResponse])
async def list_tiers(
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """
    List all subscription tiers.
    """
    result = await db.execute(
        select(SubscriptionTier).order_by(SubscriptionTier.id)
    )
    tiers = result.scalars().all()
    return [_tier_to_response(t) for t in tiers]


@router.post("/", response_model=TierResponse, status_code=status.HTTP_201_CREATED)
async def create_tier(
    data: TierCreate,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(require_super_admin)
):
    """
    Create a new subscription tier (super admin only).
    """
    # Check if tier_code exists
    result = await db.execute(
        select(SubscriptionTier).where(SubscriptionTier.tier_code == data.code)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tier code already exists"
        )
    
    tier = SubscriptionTier(
        tier_code=data.code,
        tier_name=data.name,
        description=data.description,
        max_users=data.max_users,
        max_books=data.max_records,
        features=data.features,
        monthly_price=data.price_monthly,
        annual_price=data.price_annual,
    )
    db.add(tier)
    await db.flush()
    await db.refresh(tier)
    return _tier_to_response(tier)


@router.get("/{tier_id}", response_model=TierResponse)
async def get_tier(
    tier_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """
    Get tier by ID.
    """
    result = await db.execute(
        select(SubscriptionTier).where(SubscriptionTier.id == tier_id)
    )
    tier = result.scalar_one_or_none()
    
    if not tier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tier not found"
        )
    
    return _tier_to_response(tier)


@router.patch("/{tier_id}", response_model=TierResponse)
async def update_tier(
    tier_id: int,
    data: TierUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(require_super_admin)
):
    """
    Update a subscription tier (super admin only).
    """
    result = await db.execute(
        select(SubscriptionTier).where(SubscriptionTier.id == tier_id)
    )
    tier = result.scalar_one_or_none()
    
    if not tier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tier not found"
        )
    
    # Map frontend field names to model field names
    field_map = {
        'name': 'tier_name',
        'code': 'tier_code',
        'max_records': 'max_books',
        'price_monthly': 'monthly_price',
        'price_annual': 'annual_price',
    }
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        model_field = field_map.get(field, field)
        setattr(tier, model_field, value)
    
    await db.flush()
    await db.refresh(tier)
    return _tier_to_response(tier)


@router.delete("/{tier_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tier(
    tier_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(require_super_admin)
):
    """
    Delete a subscription tier (super admin only).
    """
    result = await db.execute(
        select(SubscriptionTier).where(SubscriptionTier.id == tier_id)
    )
    tier = result.scalar_one_or_none()
    
    if not tier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tier not found"
        )
    
    await db.delete(tier)
    await db.flush()
