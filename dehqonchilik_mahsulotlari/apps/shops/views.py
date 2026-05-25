from rest_framework import viewsets, permissions, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from core.permissions import IsAdminUser
from apps.accounts.models import User
from .models import Shop
from .serializers import ShopListSerializer, ShopDetailSerializer, ShopCreateSerializer, ShopStatusUpdateSerializer


class ShopViewSet(viewsets.ModelViewSet):
    """Shop viewset"""
    queryset = Shop.objects.select_related('owner').prefetch_related('products')
    lookup_field = 'slug'
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ShopListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return ShopCreateSerializer
        return ShopDetailSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        if self.action == 'create':
            return [permissions.IsAuthenticated()]
        if self.action in ['update', 'partial_update']:
            return [permissions.IsAuthenticated()]
        if self.action == 'destroy':
            return [IsAdminUser()]
        return [permissions.AllowAny()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Only show active shops for non-admins
        user = self.request.user
        if not user.is_authenticated or user.role != 'admin':
            queryset = queryset.filter(status='active')
        return queryset
    
    def perform_create(self, serializer):
        user = self.request.user
        # Check if user already has a shop
        if hasattr(user, 'shop'):
            raise serializers.ValidationError({'error': 'Sizda allaqachon do\'kon mavjud'})
        # Set role to seller
        user.role = User.Role.SELLER
        user.save()
        serializer.save(owner=user)
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAdminUser])
    def update_status(self, request, slug=None):
        """Update shop status (admin only)"""
        shop = self.get_object()
        serializer = ShopStatusUpdateSerializer(shop, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def products(self, request, slug=None):
        """Get shop products"""
        shop = self.get_object()
        products = shop.products.filter(status='active')
        from apps.products.serializers import ProductListSerializer
        serializer = ProductListSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_shop(self, request):
        """Get current user's shop"""
        if not request.user.is_authenticated or request.user.role != 'seller':
            return Response({'error': 'Ruxsat yo\'q'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            shop = request.user.shop
            serializer = ShopDetailSerializer(shop)
            return Response(serializer.data)
        except Shop.DoesNotExist:
            return Response({'error': 'Do\'kon topilmadi'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def pending(self, request):
        """Get pending shops for admin"""
        shops = Shop.objects.filter(status='pending')
        serializer = ShopListSerializer(shops, many=True)
        return Response(serializer.data)
