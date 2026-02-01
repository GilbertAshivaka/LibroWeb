"""
Organization model - represents library customers.
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Organization(Base):
    """Organization/Library customer model."""
    
    __tablename__ = "organizations"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    organization_id = Column(String(50), unique=True, nullable=False, index=True)  # UUID
    name = Column(String(255), nullable=False)
    organization_type = Column(String(100))  # public, academic, school, special, etc.
    location = Column(String(255))
    address = Column(Text)
    phone = Column(String(50))
    email = Column(String(255), index=True)
    contact_email = Column(String(255))
    contact_phone = Column(String(50))
    contact_person = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True)
    notes = Column(Text)
    
    # Relationships
    licenses = relationship("License", back_populates="organization", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="organization")
    customer_accounts = relationship("CustomerAccount", back_populates="organization")
    
    def __repr__(self):
        return f"<Organization {self.organization_id}: {self.name}>"
