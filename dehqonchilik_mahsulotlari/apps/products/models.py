from django.db import models
from core.models import BaseModel
from apps.shops.models import Shop

class Category(BaseModel):
    name     = models.CharField(max_length=200)
    slug     = models.SlugField(unique=True)
    parent   = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='children')
    icon     = models.ImageField(upload_to='categories/', null=True, blank=True)
    ordering = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['ordering', 'name']

    def __str__(self):
        return self.name

class Product(BaseModel):
    class Unit(models.TextChoices):
        KG    = 'kg',    'Kilogramm'
        GRAMM = 'gramm', 'Gramm'
        TONNA = 'tonna', 'Tonna'
        LITR  = 'litr',  'Litr'
        DONA  = 'dona',  'Dona'
        QUTI  = 'quti',  'Quti'

    class Status(models.TextChoices):
        DRAFT    = 'draft',    'Qoralama'
        PENDING  = 'pending',  'Moderatsiyada'
        ACTIVE   = 'active',   'Faol'
        REJECTED = 'rejected', 'Rad etilgan'
        HIDDEN   = 'hidden',   'Yashirilgan'

    shop           = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='products')
    category       = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    name_uz        = models.CharField(max_length=500)
    name_ru        = models.CharField(max_length=500, blank=True)
    description_uz = models.TextField()
    description_ru = models.TextField(blank=True)
    price          = models.DecimalField(max_digits=12, decimal_places=2)
    discount_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    unit           = models.CharField(max_length=10, choices=Unit.choices, default=Unit.KG)
    min_order_qty  = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    stock_qty      = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    origin_region  = models.CharField(max_length=100, blank=True)
    harvest_date   = models.DateField(null=True, blank=True)
    expiry_date    = models.DateField(null=True, blank=True)
    is_organic     = models.BooleanField(default=False)
    status         = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING)
    rating         = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    views_count    = models.PositiveIntegerField(default=0)
    sales_count    = models.PositiveIntegerField(default=0)
    slug           = models.SlugField(unique=True)

    class Meta:
        ordering = ['-created_at']
        indexes  = [
            models.Index(fields=['status', 'shop']),
            models.Index(fields=['category', 'status']),
        ]

    def __str__(self):
        return self.name_uz

class ProductImage(BaseModel):
    product  = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image    = models.ImageField(upload_to='products/')
    is_main  = models.BooleanField(default=False)
    ordering = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['ordering', '-created_at']

    def __str__(self):
        return f"Image for {self.product.name_uz}"
