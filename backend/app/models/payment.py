"""
Payment/Transaction model.
"""
from sqlalchemy import Column, Integer, String, Text, Numeric, Enum, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class PaymentStatus(str, enum.Enum):
    """Payment status enum."""
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class Payment(Base):
    """Payment/transaction record."""
    
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    license_id = Column(Integer, ForeignKey("licenses.id"), nullable=True)
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), default="USD")
    payment_method = Column(String(50))
    transaction_id = Column(String(255))
    payment_date = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    notes = Column(Text)
    
    # Relationships
    organization = relationship("Organization", back_populates="payments")
    license = relationship("License", back_populates="payments")
    
    def __repr__(self):
        return f"<Payment {self.id} - {self.amount} {self.currency}>"
