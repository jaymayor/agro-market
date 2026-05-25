import hashlib
from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from django.conf import settings
from .models import Payment
from apps.orders.models import Order
from .serializers import (
    PaymentSerializer, PaymentInitiateSerializer,
    ClickPrepareSerializer, ClickCompleteSerializer, PaymeRPCSerializer
)


class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    """Payment viewset (read-only)"""
    queryset = Payment.objects.select_related('order')
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return self.queryset.all()
        return self.queryset.filter(order__buyer=user)
    
    @action(detail=False, methods=['post'])
    def initiate(self, request):
        """Initiate payment"""
        serializer = PaymentInitiateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        order_id = serializer.validated_data['order_id']
        provider = serializer.validated_data['provider']
        
        try:
            order = Order.objects.get(id=order_id, buyer=request.user)
        except Order.DoesNotExist:
            return Response({'error': 'Buyurtma topilmadi'}, status=status.HTTP_404_NOT_FOUND)
        
        # Create payment record
        payment = Payment.objects.create(
            order=order,
            amount=order.total_amount + order.delivery_fee,
            provider=provider,
            status='pending'
        )
        
        # Return payment URL based on provider
        if provider == 'click':
            return Response({
                'payment_id': str(payment.id),
                'payment_url': f'https://my.click.uz/services/pay?service_id={settings.CLICK_SERVICE_ID}&merchant_id={settings.CLICK_MERCHANT_ID}&amount={payment.amount}&transaction_param={order.id}'
            })
        elif provider == 'payme':
            return Response({
                'payment_id': str(payment.id),
                'payment_url': f'https://checkout.paycom.uz/{settings.PAYME_MERCHANT_ID}?amount={int(payment.amount * 100)}&order={order.id}'
            })
        
        return Response({'error': 'Noto\'g\'ri to\'lov turi'}, status=status.HTTP_400_BAD_REQUEST)


class ClickWebhookView(generics.GenericAPIView):
    """Click webhook handler"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request, action):
        if action == 'prepare':
            return self.handle_prepare(request)
        elif action == 'complete':
            return self.handle_complete(request)
        return Response({'error': 'Noto\'g\'ri action'}, status=status.HTTP_400_BAD_REQUEST)
    
    def verify_signature(self, data, action_type):
        """Verify Click signature"""
        sign_string = (
            f"{data['click_trans_id']}{data['service_id']}"
            f"{settings.CLICK_SECRET_KEY}{data['merchant_trans_id']}"
            f"{data['amount']}{data['action']}{data['sign_time']}"
        )
        expected = hashlib.md5(sign_string.encode()).hexdigest()
        return expected == data.get('sign_string')
    
    def handle_prepare(self, request):
        serializer = ClickPrepareSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        if not self.verify_signature(data, 'prepare'):
            return Response({'error': -1, 'error_note': 'Noto\'g\'ri imzo'})
        
        try:
            order = Order.objects.get(id=data['merchant_trans_id'])
        except Order.DoesNotExist:
            return Response({'error': -5, 'error_note': 'Buyurtma topilmadi'})
        
        return Response({
            'error': 0,
            'error_note': 'Success',
            'click_trans_id': data['click_trans_id'],
            'merchant_trans_id': str(order.id),
            'merchant_prepare_id': str(order.id),
            'merchant_confirm_id': str(order.id)
        })
    
    def handle_complete(self, request):
        serializer = ClickCompleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        if not self.verify_signature(data, 'complete'):
            return Response({'error': -1, 'error_note': 'Noto\'g\'ri imzo'})
        
        try:
            order = Order.objects.get(id=data['merchant_trans_id'])
        except Order.DoesNotExist:
            return Response({'error': -5, 'error_note': 'Buyurtma topilmadi'})
        
        # Update order and payment status
        order.payment_status = 'completed'
        order.save()
        
        Payment.objects.filter(order=order).update(
            transaction_id=data['click_trans_id'],
            status='completed'
        )
        
        return Response({
            'error': 0,
            'error_note': 'Success',
            'click_trans_id': data['click_trans_id'],
            'merchant_trans_id': str(order.id),
            'merchant_confirm_id': str(order.id)
        })


class PaymeWebhookView(generics.GenericAPIView):
    """Payme webhook handler"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = PaymeRPCSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        method = serializer.validated_data['method']
        params = serializer.validated_data['params']
        req_id = serializer.validated_data['id']
        
        # Verify authorization
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Basic '):
            return Response({
                'jsonrpc': '2.0',
                'id': req_id,
                'error': {'code': -32504, 'message': 'Access denied'}
            })
        
        # Handle methods
        if method == 'CheckPerformTransaction':
            return self.check_perform(params, req_id)
        elif method == 'CreateTransaction':
            return self.create_transaction(params, req_id)
        elif method == 'PerformTransaction':
            return self.perform_transaction(params, req_id)
        
        return Response({
            'jsonrpc': '2.0',
            'id': req_id,
            'error': {'code': -32601, 'message': 'Method not found'}
        })
    
    def check_perform(self, params, req_id):
        order_id = params.get('account', {}).get('order_id')
        try:
            order = Order.objects.get(id=order_id)
            return Response({
                'jsonrpc': '2.0',
                'id': req_id,
                'result': {
                    'allow': True,
                    'amount': int((order.total_amount + order.delivery_fee) * 100)
                }
            })
        except Order.DoesNotExist:
            return Response({
                'jsonrpc': '2.0',
                'id': req_id,
                'error': {'code': -31050, 'message': 'Order not found'}
            })
    
    def create_transaction(self, params, req_id):
        # Simplified implementation
        return Response({
            'jsonrpc': '2.0',
            'id': req_id,
            'result': {
                'transaction': params.get('id'),
                'state': 1
            }
        })
    
    def perform_transaction(self, params, req_id):
        # Simplified implementation
        return Response({
            'jsonrpc': '2.0',
            'id': req_id,
            'result': {
                'transaction': params.get('id'),
                'state': 2,
                'perform_time': 0
            }
        })
