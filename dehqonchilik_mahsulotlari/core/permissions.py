from rest_framework import permissions


class IsAdminUser(permissions.BasePermission):
    """Faqat admin foydalanuvchilar uchun"""
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'admin'
        )


class IsSeller(permissions.BasePermission):
    """Faqat sotuvchilar uchun"""
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'seller'
        )


class IsBuyer(permissions.BasePermission):
    """Faqat xaridorlar uchun"""
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'buyer'
        )


class IsSellerOwner(permissions.BasePermission):
    """Sotuvchi o'z resurslarini boshqarishi uchun"""
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        if request.user.role == 'admin':
            return True
        if request.user.role == 'seller':
            return hasattr(obj, 'shop') and obj.shop.owner == request.user
        return False


class IsOwnerOrAdmin(permissions.BasePermission):
    """O'z resursi yoki admin"""
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        if request.user.role == 'admin':
            return True
        return hasattr(obj, 'user') and obj.user == request.user


class ReadOnly(permissions.BasePermission):
    """Faqat o'qish uchun"""
    def has_permission(self, request, view):
        return request.method in permissions.SAFE_METHODS
