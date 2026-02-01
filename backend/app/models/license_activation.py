"""
License activation log model.
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class LicenseActivation(Base):
    """License activation log entry."""
    
    __tablename__ = "license_activations"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    license_id = Column(Integer, ForeignKey("licenses.id", ondelete="CASCADE"), nullable=False)
    activation_time = Column(DateTime(timezone=True), server_default=func.now())
    ip_address = Column(String(45))
    machine_identifier = Column(String(255))
    success = Column(Boolean, nullable=False)
    failure_reason = Column(Text)
    request_data = Column(JSON)
    
    # Relationships
    license = relationship("License", back_populates="activations")
    
    def __repr__(self):
        return f"<LicenseActivation {self.id} - {'Success' if self.success else 'Failed'}>"
