from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from core.permissions import IsAdminUser
from apps.accounts.models import User
from .models import Order
from .serializers import (
    OrderListSerializer, OrderDetailSerializer, OrderCreateSerializer,
    OrderStatusUpdateSerializer
)


class OrderViewSet(viewsets.ModelViewSet):
    """Order viewset"""
    queryset = Order.objects.select_related('buyer', 'shop').prefetch_related('items', 'items__product')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return OrderListSerializer
        if self.action == 'create':
            return OrderCreateSerializer
        if self.action == 'partial_update' and 'status' in self.request.data:
            return OrderStatusUpdateSerializer
        return OrderDetailSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == User.Role.ADMIN:
            return self.queryset.all()
        elif user.role == User.Role.SELLER:
            return self.queryset.filter(shop=user.shop)
        else:  # buyer
            return self.queryset.filter(buyer=user)
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        return Response(
            OrderDetailSerializer(order).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Update order status"""
        order = self.get_object()
        user = request.user
        
        # Only seller (own shop) or admin can update status
        if user.role == User.Role.SELLER and order.shop.owner != user:
            return Response({'error': 'Ruxsat yo\'q'}, status=status.HTTP_403_FORBIDDEN)
        if user.role == User.Role.BUYER:
            return Response({'error': 'Ruxsat yo\'q'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = OrderStatusUpdateSerializer(order, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel order (buyer only)"""
        order = self.get_object()
        
        if order.buyer != request.user:
            return Response({'error': 'Ruxsat yo\'q'}, status=status.HTTP_403_FORBIDDEN)
        
        if order.status not in ['new', 'confirmed']:
            return Response(
                {'error': 'Bu holatda buyurtmani bekor qilib bo\'lmaydi'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = 'cancelled'
        order.save()
        
        # Restore stock
        for item in order.items.all():
            product = item.product
            product.stock_qty += item.quantity
            product.sales_count -= 1
            product.save()
        
        return Response({'message': 'Buyurtma bekor qilindi'})
    
    @action(detail=False, methods=['get'])
    def seller_orders(self, request):
        """Get seller orders"""
        if request.user.role != User.Role.SELLER:
            return Response({'error': 'Ruxsat yo\'q'}, status=status.HTTP_403_FORBIDDEN)
        
        orders = self.get_queryset().filter(shop=request.user.shop)
        page = self.paginate_queryset(orders)
        if page is not None:
            serializer = OrderListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = OrderListSerializer(orders, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def all_orders(self, request):
        """Get all orders (admin)"""
        orders = Order.objects.all()
        page = self.paginate_queryset(orders)
        if page is not None:
            serializer = OrderListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = OrderListSerializer(orders, many=True)
        return Response(serializer.data)
