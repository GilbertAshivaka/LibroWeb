"""
License validation log model.
"""
from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class ValidationResult(str, enum.Enum):
    """Validation result enum."""
    VALID = "valid"
    EXPIRED = "expired"
    REVOKED = "revoked"
    INVALID = "invalid"


class LicenseValidation(Base):
    """License validation log entry."""
    
    __tablename__ = "license_validations"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    license_id = Column(Integer, ForeignKey("licenses.id", ondelete="CASCADE"), nullable=False)
    validation_time = Column(DateTime(timezone=True), server_default=func.now())
    ip_address = Column(String(45))
    validation_result = Column(Enum(ValidationResult), nullable=False)
    response_sent = Column(JSON)
    
    # Relationships
    license = relationship("License", back_populates="validations")
    
    def __repr__(self):
        return f"<LicenseValidation {self.id} - {self.validation_result}>"
