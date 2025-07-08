from BackEnd.models.base_model import BaseModel
import peewee as pw
from BackEnd.models.user import User

class StripePayment(BaseModel):
    user = pw.ForeignKeyField(User, backref='stripe_payments')
    amount = pw.DecimalField(max_digits=10, decimal_places=2)
    description = pw.CharField(max_length=255)
    stripe_charge_id = pw.CharField(max_length=255, unique=True)
