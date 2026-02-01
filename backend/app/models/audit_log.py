"""
Audit log model for tracking admin actions.
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class AuditLog(Base):
    """Audit log for admin actions."""
    
    __tablename__ = "audit_log"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    admin_user_id = Column(Integer, ForeignKey("admin_users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50))
    entity_id = Column(Integer)
    old_values = Column(JSON)
    new_values = Column(JSON)
    ip_address = Column(String(45))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    admin_user = relationship("AdminUser", back_populates="audit_logs")
    
    def __repr__(self):
        return f"<AuditLog {self.id} - {self.action}>"
