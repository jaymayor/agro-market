from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import F
from core.permissions import IsSellerOwner, IsAdminUser
from .models import Category, Product, ProductImage
from .serializers import (
    CategorySerializer, ProductListSerializer, ProductDetailSerializer,
    ProductCreateSerializer, ProductImageSerializer
)
from .filters import ProductFilter


class CategoryViewSet(viewsets.ModelViewSet):
    """Category viewset"""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    lookup_field = 'slug'
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsAdminUser()]
    
    @action(detail=False, methods=['get'])
    def tree(self, request):
        """Get category tree (root categories only)"""
        root_categories = Category.objects.filter(parent__isnull=True)
        serializer = self.get_serializer(root_categories, many=True)
        return Response(serializer.data)


class ProductViewSet(viewsets.ModelViewSet):
    """Product viewset"""
    queryset = Product.objects.select_related('shop', 'category').prefetch_related('images')
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['name_uz', 'name_ru', 'description_uz']
    ordering_fields = ['price', 'rating', 'created_at', 'sales_count']
    lookup_field = 'slug'
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return ProductCreateSerializer
        return ProductDetailSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        if self.action == 'create':
            return [permissions.IsAuthenticated(), IsSellerOwner()]
        if self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsSellerOwner()]
        return [permissions.AllowAny()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Only show active products for non-sellers
        user = self.request.user
        if not user.is_authenticated or user.role not in ['admin', 'seller']:
            queryset = queryset.filter(status='active')
        return queryset
    
    def retrieve(self, request, *args, **kwargs):
        """Increment view count on retrieve"""
        instance = self.get_object()
        # Use F() to avoid race conditions
        instance.views_count = F('views_count') + 1
        instance.save(update_fields=['views_count'])
        instance.refresh_from_db()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsSellerOwner])
    def upload_image(self, request, slug=None):
        """Upload product image"""
        product = self.get_object()
        image = request.FILES.get('image')
        is_main = request.data.get('is_main', False)
        
        if not image:
            return Response({'error': 'Rasm yuklanmadi'}, status=status.HTTP_400_BAD_REQUEST)
        
        # If this is main image, unset other main images
        if is_main:
            ProductImage.objects.filter(product=product, is_main=True).update(is_main=False)
        
        product_image = ProductImage.objects.create(
            product=product,
            image=image,
            is_main=is_main
        )
        
        serializer = ProductImageSerializer(product_image)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['delete'], permission_classes=[permissions.IsAuthenticated, IsSellerOwner])
    def delete_image(self, request, slug=None):
        """Delete product image"""
        product = self.get_object()
        image_id = request.data.get('image_id')
        
        try:
            image = ProductImage.objects.get(id=image_id, product=product)
            image.delete()
            return Response({'message': 'Rasm o\'chirildi'})
        except ProductImage.DoesNotExist:
            return Response({'error': 'Rasm topilmadi'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAdminUser])
    def moderate(self, request, slug=None):
        """Moderate product (admin only)"""
        product = self.get_object()
        new_status = request.data.get('status')
        
        if new_status not in ['active', 'rejected', 'pending']:
            return Response({'error': 'Noto\'g\'ri status'}, status=status.HTTP_400_BAD_REQUEST)
        
        product.status = new_status
        product.save()
        
        return Response({'status': new_status, 'message': 'Mahsulot statusi yangilandi'})
    
    @action(detail=False, methods=['get'])
    def my_products(self, request):
        """Get seller's own products"""
        if not request.user.is_authenticated or request.user.role != 'seller':
            return Response({'error': 'Ruxsat yo\'q'}, status=status.HTTP_403_FORBIDDEN)
        
        products = self.get_queryset().filter(shop=request.user.shop)
        page = self.paginate_queryset(products)
        if page is not None:
            serializer = ProductListSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = ProductListSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get pending products for admin"""
        if not request.user.is_authenticated or request.user.role != 'admin':
            return Response({'error': 'Ruxsat yo\'q'}, status=status.HTTP_403_FORBIDDEN)
        
        products = self.get_queryset().filter(status='pending')
        page = self.paginate_queryset(products)
        if page is not None:
            serializer = ProductListSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = ProductListSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)
