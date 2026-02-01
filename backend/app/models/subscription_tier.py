"""
Subscription tier model - defines pricing tiers.
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, Numeric, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class SubscriptionTier(Base):
    """Subscription tier definition."""
    
    __tablename__ = "subscription_tiers"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    tier_code = Column(String(20), unique=True, nullable=False)  # 'trial', 'basic', 'premium'
    tier_name = Column(String(50), nullable=False)
    description = Column(Text)
    max_users = Column(Integer, nullable=True)  # NULL = unlimited
    max_books = Column(Integer, nullable=True)  # NULL = unlimited
    features = Column(JSON)  # Feature flags as JSON
    monthly_price = Column(Numeric(10, 2))
    annual_price = Column(Numeric(10, 2))
    is_active = Column(Boolean, default=True)
    
    # Relationships
    licenses = relationship("License", back_populates="tier")
    
    def __repr__(self):
        return f"<SubscriptionTier {self.tier_code}: {self.tier_name}>"
