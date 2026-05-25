import django_filters
from django.db.models import Q
from .models import Product, Category


class ProductFilter(django_filters.FilterSet):
    """Product filter"""
    min_price = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='price', lookup_expr='lte')
    category = django_filters.UUIDFilter(field_name='category__id')
    shop = django_filters.UUIDFilter(field_name='shop__id')
    is_organic = django_filters.BooleanFilter()
    status = django_filters.CharFilter()
    search = django_filters.CharFilter(method='filter_search')
    ordering = django_filters.OrderingFilter(
        fields=(
            ('price', 'price'),
            ('rating', 'rating'),
            ('created_at', 'created_at'),
            ('sales_count', 'sales_count'),
        )
    )
    
    class Meta:
        model = Product
        fields = ['category', 'shop', 'is_organic', 'status', 'unit', 'origin_region']
    
    def filter_search(self, queryset, name, value):
        """Search by name and description"""
        return queryset.filter(
            Q(name_uz__icontains=value) | 
            Q(name_ru__icontains=value) |
            Q(description_uz__icontains=value)
        )


class CategoryFilter(django_filters.FilterSet):
    """Category filter"""
    parent = django_filters.UUIDFilter(field_name='parent__id')
    has_parent = django_filters.BooleanFilter(method='filter_has_parent')
    
    class Meta:
        model = Category
        fields = ['parent']
    
    def filter_has_parent(self, queryset, name, value):
        """Filter by having parent or not"""
        if value:
            return queryset.filter(parent__isnull=False)
        return queryset.filter(parent__isnull=True)
