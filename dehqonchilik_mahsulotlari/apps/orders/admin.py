from django.contrib import admin
from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['product', 'quantity', 'price']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'buyer', 'shop', 'status', 'total_amount',
        'payment_method', 'payment_status', 'created_at'
    ]
    list_filter = ['status', 'payment_status', 'payment_method', 'created_at']
    search_fields = ['id', 'buyer__phone', 'shop__name', 'tracking_number']
    date_hierarchy = 'created_at'
    inlines = [OrderItemInline]
    
    fieldsets = (
        ('Asosiy', {
            'fields': ('buyer', 'shop', 'status')
        }),
        ('To\'lov', {
            'fields': ('total_amount', 'delivery_fee', 'payment_method', 'payment_status')
        }),
        ('Yetkazib berish', {
            'fields': ('delivery_address', 'tracking_number', 'delivered_at')
        }),
        ('Boshqa', {
            'fields': ('notes',)
        }),
    )
    readonly_fields = ['created_at', 'updated_at']


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['order', 'product', 'quantity', 'price']
    list_filter = ['order__status']
