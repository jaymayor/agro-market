from django.db import models
from core.models import BaseModel
from apps.accounts.models import User
from apps.products.models import Product

class Review(BaseModel):
    user    = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    rating  = models.PositiveSmallIntegerField()
    comment = models.TextField()
    reply   = models.TextField(blank=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('user', 'product')

    def __str__(self):
        return f"Review by {self.user.phone} for {self.product.name_uz}"
