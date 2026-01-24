"""
Serializers for vendor management.
"""
from rest_framework import serializers
from django.utils.text import slugify
from django.conf import settings

from .models import Vendor, VendorPayout, VendorStatus
from apps.accounts.serializers import UserSerializer


class VendorSerializer(serializers.ModelSerializer):
    """Serializer for vendor details."""
    user = UserSerializer(read_only=True)

    class Meta:
        model = Vendor
        fields = [
            'id', 'user', 'business_name', 'slug', 'description',
            'logo_url', 'banner_url', 'business_email', 'business_phone',
            'city', 'state', 'country', 'status', 'rating', 'total_reviews',
            'is_featured', 'created_at'
        ]
        read_only_fields = ['id', 'slug', 'status', 'rating', 'total_reviews', 'created_at']


class VendorPublicSerializer(serializers.ModelSerializer):
    """Public serializer for vendor (limited fields)."""
    class Meta:
        model = Vendor
        fields = [
            'id', 'business_name', 'slug', 'description',
            'logo_url', 'banner_url', 'city', 'country',
            'rating', 'total_reviews', 'is_featured'
        ]


class VendorCreateSerializer(serializers.ModelSerializer):
    """Serializer for vendor registration."""
    class Meta:
        model = Vendor
        fields = [
            'business_name', 'description', 'logo_url', 'banner_url',
            'business_email', 'business_phone', 'business_address',
            'city', 'state', 'country', 'postal_code', 'tax_id'
        ]

    def validate_business_name(self, value):
        slug = slugify(value)
        if Vendor.objects.filter(slug=slug).exists():
            raise serializers.ValidationError("A vendor with this business name already exists")
        return value

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['user'] = user
        validated_data['slug'] = slugify(validated_data['business_name'])

        # Update user role to vendor
        user.role = 'vendor'
        user.save(update_fields=['role'])

        return super().create(validated_data)


class VendorUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating vendor profile."""
    class Meta:
        model = Vendor
        fields = [
            'description', 'logo_url', 'banner_url',
            'business_phone', 'business_address',
            'city', 'state', 'country', 'postal_code'
        ]


class VendorBankDetailsSerializer(serializers.ModelSerializer):
    """Serializer for updating bank details."""
    class Meta:
        model = Vendor
        fields = [
            'bank_name', 'bank_account_name', 'bank_account_number',
            'bank_routing_number', 'bank_country'
        ]


class VendorDashboardSerializer(serializers.ModelSerializer):
    """Serializer for vendor dashboard data."""
    user = UserSerializer(read_only=True)
    product_count = serializers.SerializerMethodField()
    pending_orders = serializers.SerializerMethodField()

    class Meta:
        model = Vendor
        fields = [
            'id', 'user', 'business_name', 'slug', 'status',
            'balance', 'total_earnings', 'total_sales',
            'rating', 'total_reviews', 'product_count', 'pending_orders',
            'commission_rate', 'created_at'
        ]

    def get_product_count(self, obj):
        return obj.products.count()

    def get_pending_orders(self, obj):
        from apps.orders.models import OrderItem
        return OrderItem.objects.filter(
            vendor=obj,
            status__in=['pending', 'confirmed', 'processing']
        ).count()


class VendorPayoutSerializer(serializers.ModelSerializer):
    """Serializer for payout details."""
    class Meta:
        model = VendorPayout
        fields = [
            'id', 'amount', 'currency', 'status',
            'payment_method', 'transaction_id', 'notes',
            'processed_at', 'created_at'
        ]
        read_only_fields = ['id', 'status', 'transaction_id', 'processed_at', 'created_at']


class VendorPayoutCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating payout request."""
    class Meta:
        model = VendorPayout
        fields = ['amount', 'payment_method', 'notes']

    def validate_amount(self, value):
        vendor = self.context['vendor']
        min_payout = settings.MIN_PAYOUT_AMOUNT

        if value < min_payout:
            raise serializers.ValidationError(f"Minimum payout amount is ${min_payout}")
        if value > vendor.balance:
            raise serializers.ValidationError("Insufficient balance")
        return value

    def create(self, validated_data):
        vendor = self.context['vendor']
        validated_data['vendor'] = vendor
        validated_data['currency'] = 'USD'

        # Deduct from balance
        vendor.balance -= validated_data['amount']
        vendor.save(update_fields=['balance'])

        return super().create(validated_data)


class VendorAdminSerializer(serializers.ModelSerializer):
    """Serializer for admin vendor management."""
    user = UserSerializer(read_only=True)

    class Meta:
        model = Vendor
        fields = '__all__'
        read_only_fields = ['id', 'user', 'slug', 'created_at', 'updated_at']


class VendorStatusUpdateSerializer(serializers.Serializer):
    """Serializer for updating vendor status."""
    status = serializers.ChoiceField(choices=VendorStatus.choices)
    reason = serializers.CharField(required=False, allow_blank=True)
