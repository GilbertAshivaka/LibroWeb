"""
Announcement model for the announcements page.
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Enum
from sqlalchemy.sql import func
from app.database import Base
import enum


class AnnouncementType(str, enum.Enum):
    """Announcement type enum."""
    INFO = "info"
    UPDATE = "update"
    MAINTENANCE = "maintenance"
    FEATURE = "feature"
    ALERT = "alert"


class AnnouncementPriority(str, enum.Enum):
    """Announcement priority enum."""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class Announcement(Base):
    """Announcement for Qt WebView and admin portal."""
    
    __tablename__ = "announcements"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)  # HTML content
    announcement_type = Column(Enum(AnnouncementType), default=AnnouncementType.INFO)
    priority = Column(Enum(AnnouncementPriority), default=AnnouncementPriority.NORMAL)
    is_active = Column(Boolean, default=True)  # Active/Inactive status
    is_public = Column(Boolean, default=True)  # Public/Internal visibility
    is_pinned = Column(Boolean, default=False)
    start_date = Column(DateTime(timezone=True), nullable=True)  # Publish start date
    end_date = Column(DateTime(timezone=True), nullable=True)  # Expiration date
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(Integer, nullable=True)  # Admin user ID
    
    def __repr__(self):
        return f"<Announcement {self.id}: {self.title}>"
