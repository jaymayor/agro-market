from rest_framework import serializers
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    """Payment serializer"""
    order_id = serializers.UUIDField(source='order.id', read_only=True)
    
    class Meta:
        model = Payment
        fields = ['id', 'order_id', 'amount', 'provider', 'transaction_id', 'status', 'created_at']


class PaymentInitiateSerializer(serializers.Serializer):
    """Payment initiate serializer"""
    order_id = serializers.UUIDField(required=True)
    provider = serializers.ChoiceField(choices=['click', 'payme'], required=True)


class ClickPrepareSerializer(serializers.Serializer):
    """Click prepare webhook serializer"""
    click_trans_id = serializers.CharField()
    service_id = serializers.CharField()
    click_paydoc_id = serializers.CharField()
    merchant_trans_id = serializers.CharField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    action = serializers.IntegerField()
    error = serializers.IntegerField()
    error_note = serializers.CharField()
    sign_time = serializers.CharField()
    sign_string = serializers.CharField()


class ClickCompleteSerializer(ClickPrepareSerializer):
    """Click complete webhook serializer"""
    merchant_prepare_id = serializers.CharField()


class PaymeRPCSerializer(serializers.Serializer):
    """Payme RPC serializer"""
    method = serializers.CharField()
    params = serializers.DictField()
    id = serializers.IntegerField()
