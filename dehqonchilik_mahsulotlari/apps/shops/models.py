from django.db import models
from core.models import BaseModel
from apps.accounts.models import User

class Shop(BaseModel):
    class Status(models.TextChoices):
        PENDING   = 'pending',   'Kutilmoqda'
        ACTIVE    = 'active',    'Faol'
        SUSPENDED = 'suspended', "To'xtatilgan"
        CLOSED    = 'closed',    'Yopilgan'

    owner         = models.OneToOneField(User, on_delete=models.CASCADE, related_name='shop')
    name          = models.CharField(max_length=255)
    slug          = models.SlugField(unique=True)
    description   = models.TextField(blank=True)
    logo          = models.ImageField(upload_to='shops/logos/')
    banner        = models.ImageField(upload_to='shops/banners/', null=True, blank=True)
    region        = models.CharField(max_length=100)
    district      = models.CharField(max_length=100)
    address       = models.TextField()
    latitude      = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude     = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    status        = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING)
    rating        = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    total_sales   = models.PositiveIntegerField(default=0)
    commission    = models.DecimalField(max_digits=5, decimal_places=2, default=5.00)
    is_verified   = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name
