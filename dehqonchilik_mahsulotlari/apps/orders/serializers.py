from rest_framework import serializers
from .models import Order, OrderItem
from apps.products.models import Product


class OrderItemSerializer(serializers.ModelSerializer):
    """Order item serializer"""
    product_name = serializers.CharField(source='product.name_uz', read_only=True)
    product_image = serializers.SerializerMethodField()
    
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'product_image', 'quantity', 'price']
    
    def get_product_image(self, obj):
        img = obj.product.images.filter(is_main=True).first()
        if img and self.context.get('request'):
            return self.context['request'].build_absolute_uri(img.image.url)
        return None


class OrderListSerializer(serializers.ModelSerializer):
    """Order list serializer"""
    shop_name = serializers.CharField(source='shop.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    items_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'shop_name', 'status', 'status_display', 'total_amount',
            'payment_method', 'payment_method_display', 'payment_status',
            'items_count', 'created_at'
        ]
    
    def get_items_count(self, obj):
        return obj.items.count()


class OrderDetailSerializer(serializers.ModelSerializer):
    """Order detail serializer"""
    items = OrderItemSerializer(many=True, read_only=True)
    buyer_name = serializers.CharField(source='buyer.get_full_name', read_only=True)
    buyer_phone = serializers.CharField(source='buyer.phone', read_only=True)
    shop_name = serializers.CharField(source='shop.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'buyer_name', 'buyer_phone', 'shop_name', 'status', 'status_display',
            'total_amount', 'delivery_fee', 'payment_method', 'payment_method_display',
            'payment_status', 'delivery_address', 'tracking_number', 'notes',
            'delivered_at', 'items', 'created_at'
        ]


class OrderCreateSerializer(serializers.ModelSerializer):
    """Order create serializer"""
    items = serializers.ListField(
        child=serializers.DictField(),
        write_only=True
    )
    
    class Meta:
        model = Order
        fields = [
            'shop', 'payment_method', 'delivery_address', 'notes', 'items'
        ]
    
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        validated_data['buyer'] = self.context['request'].user
        validated_data['total_amount'] = 0
        
        order = super().create(validated_data)
        
        total = 0
        for item_data in items_data:
            product = Product.objects.get(id=item_data['product_id'])
            quantity = item_data['quantity']
            price = product.discount_price if product.discount_price else product.price
            
            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=quantity,
                price=price
            )
            total += price * quantity
            
            # Update stock
            product.stock_qty -= quantity
            product.sales_count += 1
            product.save()
        
        order.total_amount = total
        order.save()
        
        # Update shop total sales
        shop = order.shop
        shop.total_sales += 1
        shop.save()
        
        return order


class OrderStatusUpdateSerializer(serializers.ModelSerializer):
    """Order status update serializer"""
    class Meta:
        model = Order
        fields = ['status']
