from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .views import ShopViewSet

router = SimpleRouter()
router.register(r'', ShopViewSet, basename='shop')

urlpatterns = [
    path('', include(router.urls)),
]
