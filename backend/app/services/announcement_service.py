"""
Announcement service.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from typing import Optional
from datetime import datetime
from app.models.announcement import Announcement, AnnouncementType, AnnouncementPriority
from app.schemas.announcement import AnnouncementCreate, AnnouncementUpdate


class AnnouncementService:
    """Service for announcement operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create(self, data: AnnouncementCreate, created_by: Optional[int] = None) -> Announcement:
        """Create a new announcement."""
        announcement = Announcement(
            title=data.title,
            content=data.content,
            announcement_type=data.announcement_type,
            priority=data.priority,
            is_active=data.is_active,
            is_public=data.is_public,
            is_pinned=data.is_pinned,
            start_date=data.start_date,
            end_date=data.end_date,
            created_by=created_by,
        )
        self.db.add(announcement)
        await self.db.flush()
        await self.db.refresh(announcement)
        return announcement
    
    async def get_by_id(self, id: int) -> Optional[Announcement]:
        """Get announcement by ID."""
        result = await self.db.execute(
            select(Announcement).where(Announcement.id == id)
        )
        return result.scalar_one_or_none()
    
    async def get_all(
        self,
        page: int = 1,
        page_size: int = 20,
        is_active: Optional[bool] = None,
    ) -> tuple[list[Announcement], int]:
        """Get paginated list of announcements (admin)."""
        query = select(Announcement)
        count_query = select(func.count(Announcement.id))
        
        if is_active is not None:
            query = query.where(Announcement.is_active == is_active)
            count_query = count_query.where(Announcement.is_active == is_active)
        
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()
        
        offset = (page - 1) * page_size
        query = query.order_by(
            Announcement.is_pinned.desc(),
            Announcement.created_at.desc()
        )
        query = query.offset(offset).limit(page_size)
        
        result = await self.db.execute(query)
        announcements = result.scalars().all()
        
        return list(announcements), total
    
    async def get_public(self, limit: int = 50) -> list[Announcement]:
        """
        Get published announcements for Qt WebView.
        Only returns active, public, non-expired announcements.
        """
        now = datetime.now()  # Use local time to match SQLite naive datetimes
        
        query = select(Announcement).where(
            Announcement.is_active == True,
            Announcement.is_public == True,
            or_(
                Announcement.start_date == None,
                Announcement.start_date <= now
            ),
            or_(
                Announcement.end_date == None,
                Announcement.end_date > now
            )
        ).order_by(
            Announcement.is_pinned.desc(),
            Announcement.priority.desc(),
            Announcement.start_date.desc().nulls_last(),
            Announcement.created_at.desc()
        ).limit(limit)
        
        result = await self.db.execute(query)
        return list(result.scalars().all())
    
    async def update(self, id: int, data: AnnouncementUpdate) -> Optional[Announcement]:
        """Update an announcement."""
        announcement = await self.get_by_id(id)
        if not announcement:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(announcement, field, value)
        
        await self.db.flush()
        await self.db.refresh(announcement)
        return announcement
    
    async def delete(self, id: int) -> bool:
        """Delete an announcement."""
        announcement = await self.get_by_id(id)
        if not announcement:
            return False
        
        await self.db.delete(announcement)
        await self.db.flush()
        return True
