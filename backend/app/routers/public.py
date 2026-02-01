"""
Public API Router - Registration and public endpoints
No authentication required
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from typing import Optional
import uuid
import secrets
from datetime import datetime, timedelta

from app.database import get_db
from app.models import Organization, License, SubscriptionTier, CustomerAccount
from app.core.security import get_password_hash

router = APIRouter(prefix="/public", tags=["Public"])


class RegistrationRequest(BaseModel):
    """Registration request schema"""
    # Organization details
    organization_name: str
    organization_type: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    location: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    
    # Account details
    full_name: str
    email: EmailStr
    password: str
    
    # Plan
    plan: str = "trial"  # trial, basic, professional, enterprise


class RegistrationResponse(BaseModel):
    """Registration response with credentials"""
    success: bool
    message: str
    organization_id: str
    organization_name: str
    license_key: str
    license_expiry: datetime
    is_trial: bool
    email: str


class TierResponse(BaseModel):
    """Tier response for public display"""
    id: int
    name: str
    code: str
    description: Optional[str]
    max_items: Optional[int]
    max_users: Optional[int]
    price_monthly: Optional[float]
    price_yearly: Optional[float]
    features: Optional[dict]


@router.post("/register", response_model=RegistrationResponse)
async def register_organization(
    request: RegistrationRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new organization and create trial/paid license.
    Returns organization ID and license key for desktop app.
    """
    # Check if email already exists
    existing = await db.execute(
        select(CustomerAccount).where(CustomerAccount.email == request.email)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if organization name already exists
    existing_org = await db.execute(
        select(Organization).where(Organization.name == request.organization_name)
    )
    if existing_org.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization name already taken"
        )
    
    # Get tier based on plan
    tier_code_map = {
        "trial": "trial",
        "starter": "basic",
        "basic": "basic",
        "professional": "premium",
        "enterprise": "premium"
    }
    tier_code = tier_code_map.get(request.plan, "trial")
    
    tier_result = await db.execute(
        select(SubscriptionTier).where(SubscriptionTier.tier_code == tier_code)
    )
    tier = tier_result.scalar_one_or_none()
    
    # If no tier exists, create a basic one
    if not tier:
        tier = SubscriptionTier(
            tier_code=tier_code,
            tier_name=tier_code.title(),
            description=f"{tier_code.title()} plan",
            max_users=3 if tier_code == "basic" else 10,
            max_books=10000 if tier_code == "basic" else 100000,
            monthly_price=29.99 if tier_code == "basic" else 79.99,
            annual_price=299.99 if tier_code == "basic" else 799.99
        )
        db.add(tier)
        await db.flush()
    
    # Generate organization ID
    org_id = str(uuid.uuid4())
    
    # Create organization
    organization = Organization(
        name=request.organization_name,
        organization_id=org_id,
        organization_type=request.organization_type,
        contact_email=request.contact_email or request.email,
        contact_phone=request.contact_phone or request.phone,
        location=request.location,
        address=request.address,
        phone=request.phone,
        is_active=True
    )
    db.add(organization)
    await db.flush()
    
    # Create customer account
    hashed_password = get_password_hash(request.password)
    customer = CustomerAccount(
        email=request.email,
        hashed_password=hashed_password,
        full_name=request.full_name,
        organization_id=organization.id,
        is_active=True
    )
    db.add(customer)
    await db.flush()
    
    # Generate license key
    license_key = f"LIBRO-{secrets.token_hex(4).upper()}-{secrets.token_hex(4).upper()}-{secrets.token_hex(4).upper()}-{secrets.token_hex(4).upper()}"
    
    # Set expiry based on plan
    is_trial = request.plan == "trial"
    if is_trial:
        expiry_date = datetime.utcnow() + timedelta(days=30)  # 30 day trial
    else:
        expiry_date = datetime.utcnow() + timedelta(days=365)  # 1 year
    
    # Create license
    license = License(
        license_key=license_key,
        organization_id=organization.id,
        tier_id=tier.id,
        expiry_date=expiry_date,
        max_activations=tier.max_users or 3,
        is_trial=is_trial,
        is_revoked=False
    )
    db.add(license)
    
    await db.commit()
    await db.refresh(organization)
    await db.refresh(license)
    
    return RegistrationResponse(
        success=True,
        message="Registration successful! Use the credentials below in your desktop app.",
        organization_id=org_id,
        organization_name=organization.name,
        license_key=license_key,
        license_expiry=expiry_date,
        is_trial=is_trial,
        email=request.email
    )


@router.get("/tiers", response_model=list[TierResponse])
async def get_public_tiers(db: AsyncSession = Depends(get_db)):
    """Get available subscription tiers for public display"""
    result = await db.execute(
        select(SubscriptionTier)
        .where(SubscriptionTier.is_active == True)
        .order_by(SubscriptionTier.annual_price)
    )
    tiers = result.scalars().all()
    
    # If no tiers exist, return default ones
    if not tiers:
        return [
            TierResponse(
                id=1,
                name="Basic",
                code="basic",
                description="For small libraries",
                max_items=10000,
                max_users=3,
                price_monthly=29.99,
                price_yearly=299.99,
                features={"cataloging": True, "patron_management": True}
            ),
            TierResponse(
                id=2,
                name="Professional",
                code="premium",
                description="For medium libraries",
                max_items=100000,
                max_users=10,
                price_monthly=79.99,
                price_yearly=799.99,
                features={"cataloging": True, "patron_management": True, "marc_support": True, "reports": True}
            ),
            TierResponse(
                id=3,
                name="Enterprise",
                code="enterprise",
                description="For large library networks",
                max_items=-1,
                max_users=-1,
                price_monthly=199.99,
                price_yearly=1999.99,
                features={"cataloging": True, "patron_management": True, "marc_support": True, "reports": True, "api_access": True, "multi_branch": True}
            )
        ]
    
    return [
        TierResponse(
            id=t.id,
            name=t.tier_name,
            code=t.tier_code,
            description=t.description,
            max_items=t.max_books,
            max_users=t.max_users,
            price_monthly=float(t.monthly_price) if t.monthly_price else None,
            price_yearly=float(t.annual_price) if t.annual_price else None,
            features=t.features
        )
        for t in tiers
    ]
