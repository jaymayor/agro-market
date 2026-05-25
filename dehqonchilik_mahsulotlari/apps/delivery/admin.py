from django.contrib import admin
from .models import DeliveryZone, DeliveryOrder


@admin.register(DeliveryZone)
class DeliveryZoneAdmin(admin.ModelAdmin):
    list_display = ['name', 'fee']
    search_fields = ['name']


@admin.register(DeliveryOrder)
class DeliveryOrderAdmin(admin.ModelAdmin):
    list_display = ['order', 'driver_name', 'driver_phone']
    search_fields = ['order__id', 'driver_name', 'driver_phone']
