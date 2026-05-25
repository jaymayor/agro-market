from rest_framework import serializers
from .models import Review
from apps.accounts.models import User


class ReviewSerializer(serializers.ModelSerializer):
    """Review serializer"""
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_avatar = serializers.SerializerMethodField()
    
    class Meta:
        model = Review
        fields = ['id', 'user_name', 'user_avatar', 'rating', 'comment', 'reply', 'created_at']
    
    def get_user_avatar(self, obj):
        if obj.user.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.user.avatar.url)
            return obj.user.avatar.url
        return None


class ReviewCreateSerializer(serializers.ModelSerializer):
    """Review create serializer"""
    class Meta:
        model = Review
        fields = ['product', 'rating', 'comment']
    
    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError('Reyting 1 dan 5 gacha bo\'lishi kerak')
        return value
    
    def validate(self, data):
        user = self.context['request'].user
        product = data['product']
        
        # Check if user has ordered this product
        has_ordered = user.orders.filter(
            items__product=product,
            status='completed'
        ).exists()
        
        if not has_ordered:
            raise serializers.ValidationError(
                {'product': 'Siz faqat sotib olgan mahsulotlar uchun sharh yozishingiz mumkin'}
            )
        
        # Check if already reviewed
        if Review.objects.filter(user=user, product=product).exists():
            raise serializers.ValidationError(
                {'product': 'Siz allaqachon bu mahsulot uchun sharh yozgansiz'}
            )
        
        return data


class ReviewReplySerializer(serializers.ModelSerializer):
    """Review reply serializer (for seller)"""
    class Meta:
        model = Review
        fields = ['reply']
