from rest_framework import serializers
from .models import Shop


class ShopListSerializer(serializers.ModelSerializer):
    """Shop list serializer"""
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    products_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Shop
        fields = [
            'id', 'name', 'slug', 'logo', 'banner', 'region', 'district',
            'status', 'status_display', 'rating', 'total_sales', 'is_verified',
            'owner_name', 'products_count', 'created_at'
        ]
    
    def get_products_count(self, obj):
        return obj.products.filter(status='active').count()


class ShopDetailSerializer(serializers.ModelSerializer):
    """Shop detail serializer"""
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Shop
        fields = [
            'id', 'name', 'slug', 'description', 'logo', 'banner',
            'region', 'district', 'address', 'latitude', 'longitude',
            'status', 'status_display', 'rating', 'total_sales', 'commission',
            'is_verified', 'owner_name', 'created_at'
        ]


class ShopCreateSerializer(serializers.ModelSerializer):
    """Shop create/update serializer"""
    class Meta:
        model = Shop
        fields = [
            'id', 'name', 'slug', 'description', 'logo', 'banner',
            'region', 'district', 'address', 'latitude', 'longitude'
        ]
    
    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)


class ShopStatusUpdateSerializer(serializers.ModelSerializer):
    """Shop status update serializer (admin)"""
    class Meta:
        model = Shop
        fields = ['status']
