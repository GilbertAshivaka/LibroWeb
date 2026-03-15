"""
License service for activation and validation.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import Optional
from datetime import date, datetime, timezone
from app.models.license import License
from app.models.organization import Organization
from app.models.subscription_tier import SubscriptionTier
from app.models.license_activation import LicenseActivation
from app.models.license_validation import LicenseValidation, ValidationResult
from app.schemas.license import (
    LicenseCreate, LicenseUpdate, 
    LicenseActivateResponse, LicenseValidateResponse,
    LicenseTierInfo, OrganizationInfo
)
from app.utils.license_utils import generate_license_key


class LicenseService:
    """Service for license operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create(self, data: LicenseCreate) -> License:
        """Create a new license with auto-generated key."""
        # Generate unique license key
        while True:
            license_key = generate_license_key()
            existing = await self.get_by_license_key(license_key)
            if not existing:
                break
        
        license = License(
            organization_id=data.organization_id,
            license_key=license_key,
            tier_id=data.tier_id,
            expiry_date=data.expiry_date,
            max_activations=data.max_activations,
            is_trial=data.is_trial,
        )
        self.db.add(license)
        await self.db.flush()
        return await self.get_by_id(license.id)
    
    async def get_by_id(self, id: int) -> Optional[License]:
        """Get license by ID with relationships."""
        result = await self.db.execute(
            select(License)
            .options(
                selectinload(License.organization),
                selectinload(License.tier)
            )
            .where(License.id == id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_license_key(self, key: str) -> Optional[License]:
        """Get license by license key."""
        result = await self.db.execute(
            select(License)
            .options(
                selectinload(License.organization),
                selectinload(License.tier)
            )
            .where(License.license_key == key)
        )
        return result.scalar_one_or_none()
    
    async def get_all(
        self,
        page: int = 1,
        page_size: int = 20,
        organization_id: Optional[int] = None,
        is_active: Optional[bool] = None,
    ) -> tuple[list[License], int]:
        """Get paginated list of licenses."""
        query = select(License).options(
            selectinload(License.organization),
            selectinload(License.tier)
        )
        count_query = select(func.count(License.id))
        
        if organization_id:
            query = query.where(License.organization_id == organization_id)
            count_query = count_query.where(License.organization_id == organization_id)
        
        if is_active is not None:
            query = query.where(License.is_active == is_active)
            count_query = count_query.where(License.is_active == is_active)
        
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()
        
        offset = (page - 1) * page_size
        query = query.order_by(License.created_at.desc())
        query = query.offset(offset).limit(page_size)
        
        result = await self.db.execute(query)
        licenses = result.scalars().all()
        
        return list(licenses), total
    
    async def update(self, id: int, data: LicenseUpdate) -> Optional[License]:
        """Update a license."""
        license = await self.get_by_id(id)
        if not license:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(license, field, value)
        
        await self.db.flush()
        return await self.get_by_id(id)
    
    async def activate(
        self, 
        org_id: str, 
        license_key: str, 
        ip_address: Optional[str] = None,
        machine_id: Optional[str] = None
    ) -> LicenseActivateResponse:
        """
        Activate a license from the Qt desktop app.
        Called via POST /license/activate
        """
        # Find organization
        org_result = await self.db.execute(
            select(Organization).where(Organization.organization_id == org_id)
        )
        org = org_result.scalar_one_or_none()
        
        if not org:
            return LicenseActivateResponse(
                success=False,
                message="The Organization ID or License Key is incorrect. Please check and try again.",
                error="invalid_credentials"
            )
        
        # Find license
        license_result = await self.db.execute(
            select(License)
            .options(selectinload(License.tier))
            .where(
                License.license_key == license_key,
                License.organization_id == org.id
            )
        )
        license = license_result.scalar_one_or_none()
        
        if not license:
            # Log failed activation
            await self._log_activation(None, ip_address, machine_id, False, "Invalid credentials")
            return LicenseActivateResponse(
                success=False,
                message="The Organization ID or License Key is incorrect. Please check and try again.",
                error="invalid_credentials"
            )
        
        # Check if revoked
        if license.is_revoked:
            await self._log_activation(license.id, ip_address, machine_id, False, "License revoked")
            return LicenseActivateResponse(
                success=False,
                message="This license has been revoked. Please contact support.",
                error="license_revoked",
                reason=license.revoked_reason
            )
        
        # Check if expired
        today = date.today()
        if license.expiry_date < today:
            await self._log_activation(license.id, ip_address, machine_id, False, "License expired")
            return LicenseActivateResponse(
                success=False,
                message="This license has expired. Please renew your subscription.",
                error="license_expired",
                expiry_date=license.expiry_date.isoformat()
            )
        
        # Check if inactive
        if not license.is_active:
            await self._log_activation(license.id, ip_address, machine_id, False, "License inactive")
            return LicenseActivateResponse(
                success=False,
                message="This license is not active. Please contact support.",
                error="license_inactive"
            )
        
        # Activate license
        if not license.activation_date:
            license.activation_date = today
        
        await self._log_activation(license.id, ip_address, machine_id, True, None)
        await self.db.flush()
        
        # Build response
        tier_info = LicenseTierInfo(
            tier=license.tier.tier_code,
            tier_name=license.tier.tier_name,
            activation_date=license.activation_date.isoformat() if license.activation_date else None,
            expiry_date=license.expiry_date.isoformat(),
            features=license.tier.features or {}
        )
        
        org_info = OrganizationInfo(
            name=org.name,
            location=org.location,
            address=org.address,
            phone=org.phone,
            email=org.email
        )
        
        return LicenseActivateResponse(
            success=True,
            message="License activated successfully",
            license=tier_info,
            organization=org_info
        )
    
    async def validate(
        self,
        org_id: str,
        license_key: str,
        ip_address: Optional[str] = None
    ) -> LicenseValidateResponse:
        """
        Validate a license from the Qt desktop app.
        Called via POST /license/validate
        """
        # Find organization and license
        org_result = await self.db.execute(
            select(Organization).where(Organization.organization_id == org_id)
        )
        org = org_result.scalar_one_or_none()
        
        if not org:
            return LicenseValidateResponse(
                success=False,
                valid=False,
                error="invalid_credentials",
                message="Invalid organization ID"
            )
        
        license_result = await self.db.execute(
            select(License)
            .options(selectinload(License.tier))
            .where(
                License.license_key == license_key,
                License.organization_id == org.id
            )
        )
        license = license_result.scalar_one_or_none()
        
        if not license:
            await self._log_validation(None, ip_address, ValidationResult.INVALID)
            return LicenseValidateResponse(
                success=False,
                valid=False,
                error="invalid_credentials",
                message="Invalid license key"
            )
        
        today = date.today()
        
        # Check revoked
        if license.is_revoked:
            await self._log_validation(license.id, ip_address, ValidationResult.REVOKED)
            return LicenseValidateResponse(
                success=False,
                valid=False,
                error="license_revoked",
                message="License has been revoked"
            )
        
        # Check expired
        if license.expiry_date < today:
            await self._log_validation(license.id, ip_address, ValidationResult.EXPIRED)
            return LicenseValidateResponse(
                success=False,
                valid=False,
                error="license_expired",
                message="License has expired",
                expiry_date=license.expiry_date.isoformat()
            )
        
        # Valid license
        await self._log_validation(license.id, ip_address, ValidationResult.VALID)
        
        days_remaining = (license.expiry_date - today).days
        
        tier_info = LicenseTierInfo(
            tier=license.tier.tier_code,
            tier_name=license.tier.tier_name,
            activation_date=license.activation_date.isoformat() if license.activation_date else None,
            expiry_date=license.expiry_date.isoformat(),
            features=license.tier.features or {}
        )
        
        return LicenseValidateResponse(
            success=True,
            valid=True,
            license=tier_info,
            days_remaining=days_remaining
        )
    
    async def _log_activation(
        self,
        license_id: Optional[int],
        ip_address: Optional[str],
        machine_id: Optional[str],
        success: bool,
        failure_reason: Optional[str]
    ):
        """Log an activation attempt."""
        if license_id:
            activation = LicenseActivation(
                license_id=license_id,
                ip_address=ip_address,
                machine_identifier=machine_id,
                success=success,
                failure_reason=failure_reason
            )
            self.db.add(activation)
    
    async def _log_validation(
        self,
        license_id: Optional[int],
        ip_address: Optional[str],
        result: ValidationResult
    ):
        """Log a validation attempt."""
        if license_id:
            validation = LicenseValidation(
                license_id=license_id,
                ip_address=ip_address,
                validation_result=result
            )
            self.db.add(validation)
