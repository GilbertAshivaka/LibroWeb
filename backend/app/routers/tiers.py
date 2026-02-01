"""
Subscription tiers router.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
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
    tier_code: str
    tier_name: str
    description: Optional[str]
    max_users: Optional[int]
    max_books: Optional[int]
    features: Optional[dict]
    monthly_price: Optional[Decimal]
    annual_price: Optional[Decimal]
    is_active: bool
    
    class Config:
        from_attributes = True


class TierCreate(BaseModel):
    """Tier create schema."""
    tier_code: str
    tier_name: str
    description: Optional[str] = None
    max_users: Optional[int] = None
    max_books: Optional[int] = None
    features: Optional[dict] = None
    monthly_price: Optional[Decimal] = None
    annual_price: Optional[Decimal] = None


class TierUpdate(BaseModel):
    """Tier update schema."""
    tier_name: Optional[str] = None
    description: Optional[str] = None
    max_users: Optional[int] = None
    max_books: Optional[int] = None
    features: Optional[dict] = None
    monthly_price: Optional[Decimal] = None
    annual_price: Optional[Decimal] = None
    is_active: Optional[bool] = None


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
    return [TierResponse.model_validate(t) for t in tiers]


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
        select(SubscriptionTier).where(SubscriptionTier.tier_code == data.tier_code)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tier code already exists"
        )
    
    tier = SubscriptionTier(
        tier_code=data.tier_code,
        tier_name=data.tier_name,
        description=data.description,
        max_users=data.max_users,
        max_books=data.max_books,
        features=data.features,
        monthly_price=data.monthly_price,
        annual_price=data.annual_price,
    )
    db.add(tier)
    await db.flush()
    await db.refresh(tier)
    return TierResponse.model_validate(tier)


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
    
    return TierResponse.model_validate(tier)


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
    
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(tier, field, value)
    
    await db.flush()
    await db.refresh(tier)
    return TierResponse.model_validate(tier)
