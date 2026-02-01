"""
Dashboard router - provides statistics for admin dashboard.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel
from typing import Optional
from decimal import Decimal

from app.database import get_db
from app.models.organization import Organization
from app.models.license import License
from app.models.payment import Payment, PaymentStatus
from app.models.license_activation import LicenseActivation
from app.models.app_release import AppRelease
from app.routers.deps import get_current_user
from app.models.admin_user import AdminUser

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


class DashboardStats(BaseModel):
    """Dashboard statistics response."""
    total_organizations: int
    active_organizations: int
    total_licenses: int
    active_licenses: int
    expiring_soon: int  # Licenses expiring in 30 days
    total_revenue: Decimal
    revenue_this_month: Decimal
    activations_today: int
    activations_this_week: int
    total_downloads: int


class RecentActivity(BaseModel):
    """Recent activity item."""
    type: str  # 'activation', 'payment', 'organization', 'license'
    description: str
    timestamp: datetime


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """
    Get dashboard statistics.
    """
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=7)
    month_start = today_start.replace(day=1)
    thirty_days_from_now = (now + timedelta(days=30)).date()
    
    # Organization stats
    total_orgs = await db.execute(select(func.count(Organization.id)))
    total_organizations = total_orgs.scalar() or 0
    
    active_orgs = await db.execute(
        select(func.count(Organization.id)).where(Organization.is_active == True)
    )
    active_organizations = active_orgs.scalar() or 0
    
    # License stats
    total_lic = await db.execute(select(func.count(License.id)))
    total_licenses = total_lic.scalar() or 0
    
    active_lic = await db.execute(
        select(func.count(License.id)).where(
            License.is_active == True,
            License.is_revoked == False
        )
    )
    active_licenses = active_lic.scalar() or 0
    
    expiring = await db.execute(
        select(func.count(License.id)).where(
            License.is_active == True,
            License.expiry_date <= thirty_days_from_now,
            License.expiry_date >= now.date()
        )
    )
    expiring_soon = expiring.scalar() or 0
    
    # Revenue stats
    total_rev = await db.execute(
        select(func.sum(Payment.amount)).where(Payment.status == PaymentStatus.COMPLETED)
    )
    total_revenue = total_rev.scalar() or Decimal("0.00")
    
    month_rev = await db.execute(
        select(func.sum(Payment.amount)).where(
            Payment.status == PaymentStatus.COMPLETED,
            Payment.payment_date >= month_start
        )
    )
    revenue_this_month = month_rev.scalar() or Decimal("0.00")
    
    # Activation stats
    today_acts = await db.execute(
        select(func.count(LicenseActivation.id)).where(
            LicenseActivation.activation_time >= today_start,
            LicenseActivation.success == True
        )
    )
    activations_today = today_acts.scalar() or 0
    
    week_acts = await db.execute(
        select(func.count(LicenseActivation.id)).where(
            LicenseActivation.activation_time >= week_start,
            LicenseActivation.success == True
        )
    )
    activations_this_week = week_acts.scalar() or 0
    
    # Download stats
    downloads = await db.execute(
        select(func.sum(AppRelease.download_count))
    )
    total_downloads = downloads.scalar() or 0
    
    return DashboardStats(
        total_organizations=total_organizations,
        active_organizations=active_organizations,
        total_licenses=total_licenses,
        active_licenses=active_licenses,
        expiring_soon=expiring_soon,
        total_revenue=total_revenue,
        revenue_this_month=revenue_this_month,
        activations_today=activations_today,
        activations_this_week=activations_this_week,
        total_downloads=total_downloads
    )


@router.get("/recent-activations")
async def get_recent_activations(
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """
    Get recent license activations.
    """
    from sqlalchemy.orm import selectinload
    
    result = await db.execute(
        select(LicenseActivation)
        .options(selectinload(LicenseActivation.license))
        .order_by(LicenseActivation.activation_time.desc())
        .limit(limit)
    )
    activations = result.scalars().all()
    
    return [
        {
            "id": a.id,
            "license_key": a.license.license_key if a.license else None,
            "success": a.success,
            "ip_address": a.ip_address,
            "failure_reason": a.failure_reason,
            "timestamp": a.activation_time
        }
        for a in activations
    ]


@router.get("/expiring-licenses")
async def get_expiring_licenses(
    days: int = 30,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """
    Get licenses expiring within specified days.
    """
    from sqlalchemy.orm import selectinload
    
    now = datetime.now(timezone.utc)
    future_date = (now + timedelta(days=days)).date()
    
    result = await db.execute(
        select(License)
        .options(
            selectinload(License.organization),
            selectinload(License.tier)
        )
        .where(
            License.is_active == True,
            License.expiry_date <= future_date,
            License.expiry_date >= now.date()
        )
        .order_by(License.expiry_date.asc())
    )
    licenses = result.scalars().all()
    
    return [
        {
            "id": l.id,
            "license_key": l.license_key,
            "organization_name": l.organization.name if l.organization else None,
            "tier_name": l.tier.tier_name if l.tier else None,
            "expiry_date": l.expiry_date,
            "days_remaining": (l.expiry_date - now.date()).days
        }
        for l in licenses
    ]
