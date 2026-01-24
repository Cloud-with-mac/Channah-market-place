"""
Serializers for cart operations.
"""
from rest_framework import serializers
from decimal import Decimal

from .models import Cart, CartItem
from apps.catalog.serializers import ProductListSerializer, ProductVariantSerializer


class CartItemSerializer(serializers.ModelSerializer):
    """Serializer for cart items."""
    product = ProductListSerializer(read_only=True)
    variant = ProductVariantSerializer(read_only=True)
    total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'variant', 'quantity', 'price', 'total', 'custom_options']
        read_only_fields = ['id', 'price']


class CartSerializer(serializers.ModelSerializer):
    """Serializer for cart details."""
    items = CartItemSerializer(many=True, read_only=True)
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    item_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Cart
        fields = [
            'id', 'coupon_code', 'discount_amount', 'notes',
            'items', 'subtotal', 'total', 'item_count', 'updated_at'
        ]
        read_only_fields = ['id', 'discount_amount']


class CartItemAddSerializer(serializers.Serializer):
    """Serializer for adding item to cart."""
    product_id = serializers.UUIDField()
    variant_id = serializers.UUIDField(required=False, allow_null=True)
    quantity = serializers.IntegerField(min_value=1, default=1)
    custom_options = serializers.JSONField(required=False, allow_null=True)

    def validate_product_id(self, value):
        from apps.catalog.models import Product, ProductStatus
        try:
            product = Product.objects.get(id=value, status=ProductStatus.ACTIVE)
        except Product.DoesNotExist:
            raise serializers.ValidationError("Product not found or not available")
        return value

    def validate(self, attrs):
        from apps.catalog.models import Product, ProductVariant

        product = Product.objects.get(id=attrs['product_id'])

        # Check stock
        if product.track_inventory:
            available = product.quantity
            if attrs.get('variant_id'):
                try:
                    variant = ProductVariant.objects.get(id=attrs['variant_id'], product=product)
                    available = variant.quantity
                except ProductVariant.DoesNotExist:
                    raise serializers.ValidationError({"variant_id": "Variant not found"})

            if attrs['quantity'] > available and not product.allow_backorder:
                raise serializers.ValidationError({"quantity": f"Only {available} available"})

        return attrs


class CartItemUpdateSerializer(serializers.Serializer):
    """Serializer for updating cart item quantity."""
    quantity = serializers.IntegerField(min_value=1)

    def validate_quantity(self, value):
        item = self.context.get('item')
        if item:
            product = item.product
            if product.track_inventory:
                available = item.variant.quantity if item.variant else product.quantity
                if value > available and not product.allow_backorder:
                    raise serializers.ValidationError(f"Only {available} available")
        return value


class CouponApplySerializer(serializers.Serializer):
    """Serializer for applying coupon."""
    code = serializers.CharField(max_length=50)

    def validate_code(self, value):
        # TODO: Implement coupon validation
        # For now, accept any code
        return value.upper()


class CartMergeSerializer(serializers.Serializer):
    """Serializer for merging guest cart."""
    session_id = serializers.CharField(max_length=255)
