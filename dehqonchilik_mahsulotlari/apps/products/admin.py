from django.contrib import admin
from .models import Category, Product, ProductImage


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'parent', 'ordering']
    list_filter = ['parent']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}
    ordering = ['ordering', 'name']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = [
        'name_uz', 'shop', 'category', 'price', 'stock_qty',
        'status', 'is_organic', 'rating', 'created_at'
    ]
    list_filter = ['status', 'is_organic', 'category', 'shop', 'unit']
    search_fields = ['name_uz', 'name_ru', 'description_uz', 'slug']
    prepopulated_fields = {'slug': ('name_uz',)}
    date_hierarchy = 'created_at'
    inlines = [ProductImageInline]
    
    fieldsets = (
        ('Asosiy', {
            'fields': ('shop', 'category', 'status', 'slug')
        }),
        ('Nomi', {
            'fields': ('name_uz', 'name_ru')
        }),
        ('Tavsif', {
            'fields': ('description_uz', 'description_ru')
        }),
        ('Narx va o\'lchov', {
            'fields': ('price', 'discount_price', 'unit', 'min_order_qty', 'stock_qty')
        }),
        ('Qo\'shimcha', {
            'fields': ('origin_region', 'harvest_date', 'expiry_date', 'is_organic')
        }),
        ('Statistika', {
            'fields': ('rating', 'views_count', 'sales_count')
        }),
    )


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ['product', 'is_main', 'ordering', 'created_at']
    list_filter = ['is_main']
