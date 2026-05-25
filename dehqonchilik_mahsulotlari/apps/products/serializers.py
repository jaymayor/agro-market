from rest_framework import serializers
from .models import Category, Product, ProductImage


class CategorySerializer(serializers.ModelSerializer):
    """Category serializer"""
    children = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'parent', 'icon', 'ordering', 'children']
    
    def get_children(self, obj):
        if obj.children.exists():
            return CategorySerializer(obj.children.all(), many=True).data
        return []


class CategoryListSerializer(serializers.ModelSerializer):
    """Simple category list serializer"""
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon']


class ProductImageSerializer(serializers.ModelSerializer):
    """Product image serializer"""
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'is_main', 'ordering']


class ProductListSerializer(serializers.ModelSerializer):
    """Product list serializer"""
    main_image = serializers.SerializerMethodField()
    shop_name = serializers.CharField(source='shop.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    actual_price = serializers.SerializerMethodField()
    unit_display = serializers.CharField(source='get_unit_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name_uz', 'name_ru', 'slug', 'actual_price', 'price', 'discount_price',
            'unit', 'unit_display', 'rating', 'main_image', 'shop_name', 'category_name',
            'is_organic', 'stock_qty', 'origin_region', 'status', 'status_display',
            'views_count', 'sales_count', 'created_at'
        ]
    
    def get_main_image(self, obj):
        img = obj.images.filter(is_main=True).first()
        if img:
            return self.context['request'].build_absolute_uri(img.image.url) if 'request' in self.context else img.image.url
        return None
    
    def get_actual_price(self, obj):
        return obj.discount_price if obj.discount_price else obj.price


class ProductDetailSerializer(serializers.ModelSerializer):
    """Product detail serializer"""
    images = ProductImageSerializer(many=True, read_only=True)
    shop_name = serializers.CharField(source='shop.name', read_only=True)
    category = CategoryListSerializer(read_only=True)
    actual_price = serializers.SerializerMethodField()
    unit_display = serializers.CharField(source='get_unit_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name_uz', 'name_ru', 'slug', 'description_uz', 'description_ru',
            'price', 'discount_price', 'actual_price', 'unit', 'unit_display',
            'min_order_qty', 'stock_qty', 'origin_region', 'harvest_date', 'expiry_date',
            'is_organic', 'status', 'status_display', 'rating', 'views_count', 'sales_count',
            'images', 'shop_name', 'category', 'created_at', 'updated_at'
        ]
    
    def get_actual_price(self, obj):
        return obj.discount_price if obj.discount_price else obj.price


class ProductCreateSerializer(serializers.ModelSerializer):
    """Product create/update serializer"""
    class Meta:
        model = Product
        fields = [
            'id', 'category', 'name_uz', 'name_ru', 'description_uz', 'description_ru',
            'price', 'discount_price', 'unit', 'min_order_qty', 'stock_qty',
            'origin_region', 'harvest_date', 'expiry_date', 'is_organic', 'slug'
        ]
    
    def create(self, validated_data):
        validated_data['shop'] = self.context['request'].user.shop
        return super().create(validated_data)
