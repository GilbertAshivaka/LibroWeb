"""
Admin user model for web portal authentication.
"""
from sqlalchemy import Column, Integer, String, Boolean, Enum, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class AdminRole(str, enum.Enum):
    """Admin role enum."""
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    SUPPORT = "support"


class AdminUser(Base):
    """Admin user for the web portal."""
    
    __tablename__ = "admin_users"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255))
    role = Column(Enum(AdminRole), default=AdminRole.ADMIN)
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    audit_logs = relationship("AuditLog", back_populates="admin_user")
    
    def __repr__(self):
        return f"<AdminUser {self.username}>"
