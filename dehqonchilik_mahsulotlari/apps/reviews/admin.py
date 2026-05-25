from django.contrib import admin
from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'product', 'rating', 'comment', 'reply', 'created_at'
    ]
    list_filter = ['rating', 'created_at']
    search_fields = ['user__phone', 'product__name_uz', 'comment']
    date_hierarchy = 'created_at'
    readonly_fields = ['created_at', 'updated_at']
