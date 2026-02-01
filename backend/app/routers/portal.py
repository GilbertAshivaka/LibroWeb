"""
Customer Portal API Router
Authentication and management for organization customers (not admin users)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt

from app.database import get_db
from app.models import Organization, License, SubscriptionTier, CustomerAccount, Payment
from app.core.security import verify_password
from app.core.config import settings

router = APIRouter(prefix="/portal", tags=["Customer Portal"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/portal/login", auto_error=False)


class PortalLoginRequest(BaseModel):
    """Customer login request"""
    email: EmailStr
    password: str


class PortalLoginResponse(BaseModel):
    """Customer login response with token"""
    access_token: str
    token_type: str = "bearer"


class CustomerInfo(BaseModel):
    """Customer information"""
    id: int
    email: str
    full_name: Optional[str]
    is_active: bool


class OrganizationInfo(BaseModel):
    """Organization information for customer"""
    id: int
    name: str
    organization_id: str
    organization_type: Optional[str]
    contact_email: Optional[str]
    location: Optional[str]
    is_active: bool


class LicenseInfo(BaseModel):
    """License information for customer"""
    id: int
    license_key: str
    expiry_date: datetime
    max_activations: int
    activation_count: int
    is_trial: bool
    is_revoked: bool
    tier: Optional[dict]


class PortalMeResponse(BaseModel):
    """Response for /me endpoint with all customer data"""
    customer: CustomerInfo
    organization: OrganizationInfo
    license: Optional[LicenseInfo]


class PaymentRecordRequest(BaseModel):
    """Request to record a payment"""
    plan: str
    payment_method: str
    reference: str
    amount: float


async def get_current_customer(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> CustomerAccount:
    """Get current authenticated customer from JWT token"""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    result = await db.execute(
        select(CustomerAccount)
        .options(selectinload(CustomerAccount.organization))
        .where(CustomerAccount.email == email)
    )
    customer = result.scalar_one_or_none()
    
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Customer not found"
        )
    
    if not customer.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account deactivated"
        )
    
    return customer


@router.post("/login", response_model=PortalLoginResponse)
async def portal_login(
    request: PortalLoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """Customer login - returns JWT token"""
    result = await db.execute(
        select(CustomerAccount).where(CustomerAccount.email == request.email)
    )
    customer = result.scalar_one_or_none()
    
    if not customer or not verify_password(request.password, customer.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not customer.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account deactivated"
        )
    
    # Create JWT token
    access_token_expires = timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {
        "sub": customer.email,
        "type": "customer",
        "exp": datetime.utcnow() + access_token_expires
    }
    access_token = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    
    return PortalLoginResponse(access_token=access_token)


@router.get("/me", response_model=PortalMeResponse)
async def get_portal_me(
    customer: CustomerAccount = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db)
):
    """Get current customer data including organization and license"""
    # Get organization
    org_result = await db.execute(
        select(Organization).where(Organization.id == customer.organization_id)
    )
    organization = org_result.scalar_one_or_none()
    
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    # Get license
    license_result = await db.execute(
        select(License)
        .options(selectinload(License.tier))
        .where(License.organization_id == organization.id)
        .where(License.is_revoked == False)
        .order_by(License.expiry_date.desc())
    )
    license = license_result.scalar_one_or_none()
    
    license_info = None
    if license:
        tier_dict = None
        if license.tier:
            tier_dict = {
                "id": license.tier.id,
                "name": license.tier.tier_name,
                "description": license.tier.description
            }
        
        license_info = LicenseInfo(
            id=license.id,
            license_key=license.license_key,
            expiry_date=license.expiry_date,
            max_activations=license.max_activations,
            activation_count=license.activation_count or 0,
            is_trial=license.is_trial or False,
            is_revoked=license.is_revoked or False,
            tier=tier_dict
        )
    
    return PortalMeResponse(
        customer=CustomerInfo(
            id=customer.id,
            email=customer.email,
            full_name=customer.full_name,
            is_active=customer.is_active
        ),
        organization=OrganizationInfo(
            id=organization.id,
            name=organization.name,
            organization_id=organization.organization_id,
            organization_type=organization.organization_type,
            contact_email=organization.contact_email,
            location=organization.location,
            is_active=organization.is_active
        ),
        license=license_info
    )


@router.post("/payments")
async def record_portal_payment(
    request: PaymentRecordRequest,
    customer: CustomerAccount = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db)
):
    """Record a payment from customer (pending verification)"""
    # Get organization
    org_result = await db.execute(
        select(Organization).where(Organization.id == customer.organization_id)
    )
    organization = org_result.scalar_one_or_none()
    
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    # Create pending payment record
    payment = Payment(
        organization_id=organization.id,
        amount=request.amount,
        currency="USD",
        payment_method=request.payment_method,
        transaction_ref=request.reference,
        status="pending",
        notes=f"Customer submitted: {request.plan} plan"
    )
    db.add(payment)
    await db.commit()
    
    return {"success": True, "message": "Payment recorded, pending verification"}


@router.get("/payments")
async def get_portal_payments(
    customer: CustomerAccount = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db)
):
    """Get payment history for customer's organization"""
    result = await db.execute(
        select(Payment)
        .where(Payment.organization_id == customer.organization_id)
        .order_by(Payment.created_at.desc())
    )
    payments = result.scalars().all()
    
    return [
        {
            "id": p.id,
            "amount": p.amount,
            "currency": p.currency,
            "status": p.status,
            "payment_method": p.payment_method,
            "created_at": p.created_at
        }
        for p in payments
    ]
