"""
Serializers for order operations.
"""
from rest_framework import serializers
from decimal import Decimal
from django.conf import settings

from .models import Order, OrderItem, OrderStatusHistory, OrderStatus, PaymentStatus
from apps.accounts.serializers import UserSerializer
from apps.vendors.serializers import VendorPublicSerializer


class OrderItemSerializer(serializers.ModelSerializer):
    """Serializer for order items."""
    vendor = VendorPublicSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            'id', 'product_name', 'product_sku', 'product_image', 'variant_name',
            'quantity', 'unit_price', 'total', 'vendor', 'status', 'tracking_number'
        ]


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    """Serializer for order status history."""
    class Meta:
        model = OrderStatusHistory
        fields = ['id', 'status', 'notes', 'created_at']


class OrderSerializer(serializers.ModelSerializer):
    """Serializer for order details."""
    items = OrderItemSerializer(many=True, read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'status', 'payment_status',
            'subtotal', 'tax_amount', 'shipping_amount', 'discount_amount',
            'total', 'currency', 'coupon_code',
            'shipping_first_name', 'shipping_last_name', 'shipping_email',
            'shipping_phone', 'shipping_address_line1', 'shipping_address_line2',
            'shipping_city', 'shipping_state', 'shipping_postal_code', 'shipping_country',
            'shipping_method', 'tracking_number', 'carrier', 'estimated_delivery',
            'payment_method', 'customer_notes',
            'items', 'status_history',
            'created_at', 'paid_at', 'shipped_at', 'delivered_at'
        ]


class OrderListSerializer(serializers.ModelSerializer):
    """Serializer for order listing."""
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'status', 'payment_status',
            'total', 'currency', 'item_count', 'created_at'
        ]

    def get_item_count(self, obj):
        return obj.items.count()


class OrderCreateSerializer(serializers.Serializer):
    """Serializer for creating order from cart."""
    # Shipping address
    shipping_first_name = serializers.CharField(max_length=100)
    shipping_last_name = serializers.CharField(max_length=100)
    shipping_email = serializers.EmailField()
    shipping_phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    shipping_address_line1 = serializers.CharField(max_length=255)
    shipping_address_line2 = serializers.CharField(max_length=255, required=False, allow_blank=True)
    shipping_city = serializers.CharField(max_length=100)
    shipping_state = serializers.CharField(max_length=100, required=False, allow_blank=True)
    shipping_postal_code = serializers.CharField(max_length=20)
    shipping_country = serializers.CharField(max_length=100)

    # Billing address
    billing_same_as_shipping = serializers.BooleanField(default=True)
    billing_first_name = serializers.CharField(max_length=100, required=False)
    billing_last_name = serializers.CharField(max_length=100, required=False)
    billing_address_line1 = serializers.CharField(max_length=255, required=False)
    billing_address_line2 = serializers.CharField(max_length=255, required=False)
    billing_city = serializers.CharField(max_length=100, required=False)
    billing_state = serializers.CharField(max_length=100, required=False)
    billing_postal_code = serializers.CharField(max_length=20, required=False)
    billing_country = serializers.CharField(max_length=100, required=False)

    # Options
    shipping_method = serializers.CharField(max_length=100, required=False)
    payment_method = serializers.CharField(max_length=50)
    customer_notes = serializers.CharField(required=False, allow_blank=True)

    def create(self, validated_data):
        cart = self.context['cart']
        user = self.context.get('user')

        if not cart.items.exists():
            raise serializers.ValidationError("Cart is empty")

        # Calculate totals
        subtotal = cart.subtotal
        tax_rate = Decimal('0.08')  # 8% tax
        tax_amount = subtotal * tax_rate
        shipping_amount = Decimal('5.99')  # Flat rate shipping
        discount_amount = cart.discount_amount
        total = subtotal + tax_amount + shipping_amount - discount_amount

        # Create order
        order = Order.objects.create(
            user=user,
            subtotal=subtotal,
            tax_amount=tax_amount,
            shipping_amount=shipping_amount,
            discount_amount=discount_amount,
            total=total,
            coupon_code=cart.coupon_code,
            **{k: v for k, v in validated_data.items() if k not in ['payment_method']}
        )
        order.payment_method = validated_data.get('payment_method')
        order.save()

        # Create order items
        commission_rate = settings.PLATFORM_COMMISSION_PERCENT
        for cart_item in cart.items.select_related('product', 'product__vendor', 'variant').all():
            product = cart_item.product
            vendor = product.vendor

            item_total = cart_item.total
            commission_amount = item_total * Decimal(str(commission_rate)) / Decimal('100')
            vendor_amount = item_total - commission_amount

            OrderItem.objects.create(
                order=order,
                product=product,
                vendor=vendor,
                variant=cart_item.variant,
                product_name=product.name,
                product_sku=product.sku,
                product_image=product.primary_image,
                variant_name=cart_item.variant.name if cart_item.variant else None,
                quantity=cart_item.quantity,
                unit_price=cart_item.price,
                total=item_total,
                commission_rate=commission_rate,
                commission_amount=commission_amount,
                vendor_amount=vendor_amount
            )

            # Update inventory
            if product.track_inventory:
                product.quantity -= cart_item.quantity
                if product.quantity < 0:
                    product.quantity = 0
                product.save(update_fields=['quantity'])

        # Create initial status history
        OrderStatusHistory.objects.create(
            order=order,
            status=OrderStatus.PENDING,
            notes='Order created',
            changed_by=user
        )

        # Clear cart
        cart.items.all().delete()
        cart.coupon_code = None
        cart.discount_amount = Decimal('0.00')
        cart.save()

        return order


class OrderStatusUpdateSerializer(serializers.Serializer):
    """Serializer for updating order status."""
    status = serializers.ChoiceField(choices=OrderStatus.choices)
    notes = serializers.CharField(required=False, allow_blank=True)


class OrderItemStatusUpdateSerializer(serializers.Serializer):
    """Serializer for updating order item status."""
    status = serializers.ChoiceField(choices=OrderStatus.choices)
    tracking_number = serializers.CharField(required=False, allow_blank=True)


class OrderTrackingSerializer(serializers.ModelSerializer):
    """Serializer for public order tracking."""
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'order_number', 'status', 'shipping_method',
            'tracking_number', 'carrier', 'estimated_delivery',
            'status_history', 'created_at', 'shipped_at', 'delivered_at'
        ]


class OrderAdminSerializer(serializers.ModelSerializer):
    """Serializer for admin order management."""
    user = UserSerializer(read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ['id', 'order_number', 'created_at', 'updated_at']
