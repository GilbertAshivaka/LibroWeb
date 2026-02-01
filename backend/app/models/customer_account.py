"""
Customer Account model for organization customers (not admin users)
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.database import Base


class CustomerAccount(Base):
    """
    Customer accounts - users who manage their organization's subscription.
    Separate from admin users who manage the entire platform.
    """
    __tablename__ = "customer_accounts"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    
    # Link to organization
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_login = Column(DateTime(timezone=True))
    
    # Relationships
    organization = relationship("Organization", back_populates="customer_accounts")
