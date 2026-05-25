from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid

class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN   = 'admin',  'Admin'
        SELLER  = 'seller', 'Sotuvchi'
        BUYER   = 'buyer',  'Xaridor'
        
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4)
    phone       = models.CharField(max_length=15, unique=True)
    role        = models.CharField(max_length=10, choices=Role.choices, default=Role.BUYER)
    is_verified = models.BooleanField(default=False)
    avatar      = models.ImageField(upload_to='avatars/', null=True, blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD  = 'phone'
    REQUIRED_FIELDS = ['username']
    
    def __str__(self):
        return f"{self.phone} - {self.get_role_display()}"
