"""
Organization service for business logic.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import Optional
from app.models.organization import Organization
from app.schemas.organization import OrganizationCreate, OrganizationUpdate
from app.utils.license_utils import generate_organization_id


class OrganizationService:
    """Service for organization operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create(self, data: OrganizationCreate) -> Organization:
        """Create a new organization with auto-generated ID."""
        # Generate unique organization ID
        while True:
            org_id = generate_organization_id()
            existing = await self.get_by_organization_id(org_id)
            if not existing:
                break
        
        org = Organization(
            organization_id=org_id,
            name=data.name,
            location=data.location,
            address=data.address,
            phone=data.phone,
            email=data.email,
            contact_person=data.contact_person,
            notes=data.notes,
        )
        self.db.add(org)
        await self.db.flush()
        await self.db.refresh(org)
        return org
    
    async def get_by_id(self, id: int) -> Optional[Organization]:
        """Get organization by internal ID."""
        result = await self.db.execute(
            select(Organization).where(Organization.id == id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_organization_id(self, org_id: str) -> Optional[Organization]:
        """Get organization by organization_id (ORG-XXXXX)."""
        result = await self.db.execute(
            select(Organization).where(Organization.organization_id == org_id)
        )
        return result.scalar_one_or_none()
    
    async def get_all(
        self, 
        page: int = 1, 
        page_size: int = 20,
        search: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> tuple[list[Organization], int]:
        """Get paginated list of organizations."""
        query = select(Organization)
        count_query = select(func.count(Organization.id))
        
        # Apply filters
        if search:
            search_filter = f"%{search}%"
            query = query.where(
                (Organization.name.ilike(search_filter)) |
                (Organization.organization_id.ilike(search_filter)) |
                (Organization.email.ilike(search_filter))
            )
            count_query = count_query.where(
                (Organization.name.ilike(search_filter)) |
                (Organization.organization_id.ilike(search_filter)) |
                (Organization.email.ilike(search_filter))
            )
        
        if is_active is not None:
            query = query.where(Organization.is_active == is_active)
            count_query = count_query.where(Organization.is_active == is_active)
        
        # Get total count
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()
        
        # Apply pagination
        offset = (page - 1) * page_size
        query = query.order_by(Organization.created_at.desc())
        query = query.offset(offset).limit(page_size)
        
        result = await self.db.execute(query)
        organizations = result.scalars().all()
        
        return list(organizations), total
    
    async def update(self, id: int, data: OrganizationUpdate) -> Optional[Organization]:
        """Update an organization."""
        org = await self.get_by_id(id)
        if not org:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(org, field, value)
        
        await self.db.flush()
        await self.db.refresh(org)
        return org
    
    async def delete(self, id: int) -> bool:
        """Delete an organization."""
        org = await self.get_by_id(id)
        if not org:
            return False
        
        await self.db.delete(org)
        await self.db.flush()
        return True
