from BackEnd.models.base_model import BaseModel, Base
from sqlalchemy import Column, String, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from BackEnd.models.user import User

class StripePayment(BaseModel, Base):
    """StripePayment Representation"""
    __tablename__ = 'stripe_payments'
    user_id = Column(String(60), ForeignKey('users.id'), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    description = Column(String(255))
    stripe_charge_id = Column(String(255), unique=True, nullable=False)
    user = relationship("User", backref="stripe_payments")
