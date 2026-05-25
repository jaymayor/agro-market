from django.db import models
from core.models import BaseModel
from apps.orders.models import Order

class DeliveryZone(BaseModel):
    name = models.CharField(max_length=100)
    fee  = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return self.name

class DeliveryOrder(BaseModel):
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='delivery')
    driver_name = models.CharField(max_length=100, blank=True)
    driver_phone = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return f"Delivery for Order {self.order.id}"
