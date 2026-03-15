"""
License model - tracks software licenses.
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class License(Base):
    """Software license model."""
    
    __tablename__ = "licenses"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    license_key = Column(String(100), unique=True, nullable=False, index=True)  # LIBRO-XXXX-XXXX-XXXX-XXXX
    tier_id = Column(Integer, ForeignKey("subscription_tiers.id"), nullable=False)
    activation_date = Column(Date, nullable=True)
    expiry_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True)
    is_revoked = Column(Boolean, default=False)
    is_trial = Column(Boolean, default=False)
    revoked_reason = Column(Text)
    max_activations = Column(Integer, default=1)
    activation_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    organization = relationship("Organization", back_populates="licenses")
    tier = relationship("SubscriptionTier", back_populates="licenses")
    activations = relationship("LicenseActivation", back_populates="license", cascade="all, delete-orphan")
    validations = relationship("LicenseValidation", back_populates="license", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="license")
    
    def __repr__(self):
        return f"<License {self.license_key}>"
