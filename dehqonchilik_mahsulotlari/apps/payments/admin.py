from django.contrib import admin
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'order', 'amount', 'provider', 'status', 'transaction_id', 'created_at'
    ]
    list_filter = ['provider', 'status', 'created_at']
    search_fields = ['order__id', 'transaction_id']
    date_hierarchy = 'created_at'
    readonly_fields = ['created_at', 'updated_at']
