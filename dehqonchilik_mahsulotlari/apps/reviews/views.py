from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from core.permissions import IsSeller
from .models import Review
from .serializers import ReviewSerializer, ReviewCreateSerializer, ReviewReplySerializer


class ReviewViewSet(viewsets.ModelViewSet):
    """Review viewset"""
    queryset = Review.objects.select_related('user', 'product')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ReviewCreateSerializer
        if self.action == 'reply':
            return ReviewReplySerializer
        return ReviewSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        if self.action == 'create':
            return [permissions.IsAuthenticated()]
        if self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        product_id = self.request.query_params.get('product')
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        return queryset
    
    @action(detail=True, methods=['post'], permission_classes=[IsSeller])
    def reply(self, request, pk=None):
        """Reply to review (seller only)"""
        review = self.get_object()
        
        # Check if seller owns the product
        if review.product.shop.owner != request.user:
            return Response(
                {'error': 'Siz faqat o\'z mahsulotlaringizga javob bera olasiz'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(review, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(ReviewSerializer(review).data)
    
    @action(detail=False, methods=['get'])
    def my_reviews(self, request):
        """Get current user's reviews"""
        reviews = self.get_queryset().filter(user=request.user)
        serializer = ReviewSerializer(reviews, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsSeller])
    def shop_reviews(self, request):
        """Get reviews for seller's products"""
        reviews = self.get_queryset().filter(product__shop=request.user.shop)
        serializer = ReviewSerializer(reviews, many=True, context={'request': request})
        return Response(serializer.data)
