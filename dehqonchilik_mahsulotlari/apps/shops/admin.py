from django.contrib import admin
from .models import Shop


@admin.register(Shop)
class ShopAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'owner', 'region', 'district', 'status',
        'rating', 'total_sales', 'is_verified', 'created_at'
    ]
    list_filter = ['status', 'is_verified', 'region']
    search_fields = ['name', 'slug', 'owner__phone', 'address']
    prepopulated_fields = {'slug': ('name',)}
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Asosiy', {
            'fields': ('owner', 'name', 'slug', 'description')
        }),
        ('Rasmlar', {
            'fields': ('logo', 'banner')
        }),
        ('Manzil', {
            'fields': ('region', 'district', 'address', 'latitude', 'longitude')
        }),
        ('Holat', {
            'fields': ('status', 'is_verified', 'commission')
        }),
        ('Statistika', {
            'fields': ('rating', 'total_sales')
        }),
    )
    readonly_fields = ['created_at', 'updated_at']
