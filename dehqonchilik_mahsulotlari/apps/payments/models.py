from django.db import models
from core.models import BaseModel
from apps.orders.models import Order

class Payment(BaseModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    provider = models.CharField(max_length=50)
    transaction_id = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=50, default='pending')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.provider} payment for Order {self.order.id}"
