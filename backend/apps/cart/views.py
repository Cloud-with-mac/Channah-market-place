"""
Views for cart operations.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from decimal import Decimal

from .models import Cart, CartItem
from .serializers import (
    CartSerializer,
    CartItemSerializer,
    CartItemAddSerializer,
    CartItemUpdateSerializer,
    CouponApplySerializer,
    CartMergeSerializer,
)
from apps.catalog.models import Product, ProductVariant


class CartViewSet(viewsets.GenericViewSet):
    """
    ViewSet for cart operations.
    """
    permission_classes = [AllowAny]
    serializer_class = CartSerializer

    def get_cart(self, request):
        """Get or create cart for current user or session."""
        if request.user.is_authenticated:
            cart, created = Cart.objects.get_or_create(user=request.user)
        else:
            session_id = request.session.session_key
            if not session_id:
                request.session.create()
                session_id = request.session.session_key
            cart, created = Cart.objects.get_or_create(session_id=session_id)
        return cart

    def list(self, request):
        """Get current cart."""
        cart = self.get_cart(request)
        serializer = CartSerializer(cart)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def items(self, request):
        """Add item to cart."""
        serializer = CartItemAddSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cart = self.get_cart(request)
        product = Product.objects.get(id=serializer.validated_data['product_id'])
        variant_id = serializer.validated_data.get('variant_id')
        variant = None
        if variant_id:
            variant = ProductVariant.objects.get(id=variant_id)

        # Get price from variant or product
        price = variant.price if variant else product.price

        # Check if item already exists
        existing_item = CartItem.objects.filter(
            cart=cart,
            product=product,
            variant=variant
        ).first()

        if existing_item:
            existing_item.quantity += serializer.validated_data['quantity']
            existing_item.save()
            item = existing_item
        else:
            item = CartItem.objects.create(
                cart=cart,
                product=product,
                variant=variant,
                quantity=serializer.validated_data['quantity'],
                price=price,
                custom_options=serializer.validated_data.get('custom_options')
            )

        return Response(CartSerializer(cart).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['put'], url_path='items/(?P<item_id>[^/.]+)')
    def update_item(self, request, item_id=None):
        """Update cart item quantity."""
        cart = self.get_cart(request)

        try:
            item = CartItem.objects.get(id=item_id, cart=cart)
        except CartItem.DoesNotExist:
            return Response(
                {'detail': 'Item not found in cart.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = CartItemUpdateSerializer(data=request.data, context={'item': item})
        serializer.is_valid(raise_exception=True)

        item.quantity = serializer.validated_data['quantity']
        item.save()

        return Response(CartSerializer(cart).data)

    @action(detail=False, methods=['delete'], url_path='items/(?P<item_id>[^/.]+)')
    def remove_item(self, request, item_id=None):
        """Remove item from cart."""
        cart = self.get_cart(request)

        try:
            item = CartItem.objects.get(id=item_id, cart=cart)
        except CartItem.DoesNotExist:
            return Response(
                {'detail': 'Item not found in cart.'},
                status=status.HTTP_404_NOT_FOUND
            )

        item.delete()
        return Response(CartSerializer(cart).data)

    @action(detail=False, methods=['delete'])
    def clear(self, request):
        """Clear all items from cart."""
        cart = self.get_cart(request)
        cart.items.all().delete()
        cart.coupon_code = None
        cart.discount_amount = Decimal('0.00')
        cart.save()
        return Response(CartSerializer(cart).data)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def coupon(self, request):
        """Apply coupon code."""
        serializer = CouponApplySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cart = self.get_cart(request)
        code = serializer.validated_data['code']

        # TODO: Implement proper coupon validation
        # For now, simple discount logic
        if code == 'SAVE10':
            cart.coupon_code = code
            cart.discount_amount = cart.subtotal * Decimal('0.10')
            cart.save()
        elif code == 'SAVE20':
            cart.coupon_code = code
            cart.discount_amount = cart.subtotal * Decimal('0.20')
            cart.save()
        else:
            return Response(
                {'detail': 'Invalid coupon code.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(CartSerializer(cart).data)

    @action(detail=False, methods=['delete'], permission_classes=[IsAuthenticated])
    def remove_coupon(self, request):
        """Remove applied coupon."""
        cart = self.get_cart(request)
        cart.coupon_code = None
        cart.discount_amount = Decimal('0.00')
        cart.save()
        return Response(CartSerializer(cart).data)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def merge(self, request):
        """Merge guest cart into user cart."""
        serializer = CartMergeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        session_id = serializer.validated_data['session_id']

        try:
            guest_cart = Cart.objects.get(session_id=session_id)
        except Cart.DoesNotExist:
            return Response(
                {'detail': 'Guest cart not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        user_cart, _ = Cart.objects.get_or_create(user=request.user)

        # Merge items
        for guest_item in guest_cart.items.all():
            existing = CartItem.objects.filter(
                cart=user_cart,
                product=guest_item.product,
                variant=guest_item.variant
            ).first()

            if existing:
                existing.quantity += guest_item.quantity
                existing.save()
            else:
                guest_item.cart = user_cart
                guest_item.save()

        # Delete guest cart
        guest_cart.delete()

        return Response(CartSerializer(user_cart).data)
