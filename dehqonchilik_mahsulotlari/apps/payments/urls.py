from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .views import PaymentViewSet, ClickWebhookView, PaymeWebhookView

router = SimpleRouter()
router.register(r'', PaymentViewSet, basename='payment')

urlpatterns = [
    path('', include(router.urls)),
    path('click/<str:action>/', ClickWebhookView.as_view(), name='click_webhook'),
    path('payme/', PaymeWebhookView.as_view(), name='payme_webhook'),
]
