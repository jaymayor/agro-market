from django.db import models
from core.models import BaseModel
from apps.accounts.models import User
from apps.shops.models import Shop
from apps.products.models import Product

class Order(BaseModel):
    class Status(models.TextChoices):
        NEW        = 'new',        'Yangi'
        CONFIRMED  = 'confirmed',  'Tasdiqlandi'
        PREPARING  = 'preparing',  'Tayyorlanmoqda'
        SHIPPED    = 'shipped',    "Yo'lda"
        DELIVERED  = 'delivered',  'Yetkazildi'
        COMPLETED  = 'completed',  'Yakunlandi'
        CANCELLED  = 'cancelled',  'Bekor qilindi'

    class PaymentMethod(models.TextChoices):
        CLICK  = 'click',  'Click'
        PAYME  = 'payme',  'Payme'
        UZCARD = 'uzcard', 'Uzcard'
        CASH   = 'cash',   'Naqd'
        CARD   = 'card',   'Karta'

    buyer            = models.ForeignKey(User, on_delete=models.PROTECT, related_name='orders')
    shop             = models.ForeignKey(Shop, on_delete=models.PROTECT, related_name='orders')
    status           = models.CharField(max_length=15, choices=Status.choices, default=Status.NEW)
    total_amount     = models.DecimalField(max_digits=12, decimal_places=2)
    delivery_fee     = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    payment_method   = models.CharField(max_length=10, choices=PaymentMethod.choices)
    payment_status   = models.CharField(max_length=20, default='pending')
    delivery_address = models.JSONField()
    tracking_number  = models.CharField(max_length=100, blank=True)
    notes            = models.TextField(blank=True)
    delivered_at     = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Order {self.id} by {self.buyer.phone}"

class OrderItem(BaseModel):
    order    = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product  = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    price    = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"{self.quantity} x {self.product.name_uz}"
