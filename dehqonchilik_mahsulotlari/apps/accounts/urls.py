from django.urls import path, include
from rest_framework.routers import SimpleRouter
from rest_framework_simplejwt.views import TokenRefreshView, TokenBlacklistView
from .views import (
    UserViewSet, RegisterView, LoginView, ChangePasswordView,
    OTPSendView, OTPVerifyView
)

router = SimpleRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('', include(router.urls)),
    
    # Auth endpoints
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', TokenBlacklistView.as_view(), name='logout'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='change_password'),
    
    # OTP endpoints
    path('auth/send-otp/', OTPSendView.as_view(), name='send_otp'),
    path('auth/verify-otp/', OTPVerifyView.as_view(), name='verify_otp'),
    
    # Current user
    path('auth/me/', UserViewSet.as_view({'get': 'me', 'patch': 'update_me'}), name='me'),
]
