"""
Views for order operations.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone

from common.permissions import IsVendor, IsAdmin
from .models import Order, OrderItem, OrderStatusHistory, OrderStatus, PaymentStatus
from .serializers import (
    OrderSerializer,
    OrderListSerializer,
    OrderCreateSerializer,
    OrderStatusUpdateSerializer,
    OrderItemStatusUpdateSerializer,
    OrderTrackingSerializer,
    OrderAdminSerializer,
)
from apps.cart.models import Cart


class OrderViewSet(viewsets.ModelViewSet):
    """
    ViewSet for order operations.
    """
    queryset = Order.objects.all()
    serializer_class = OrderListSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'order_number'

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Order.objects.all()
        return Order.objects.filter(user=user)

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return OrderSerializer
        if self.action == 'create':
            return OrderCreateSerializer
        if self.action == 'tracking':
            return OrderTrackingSerializer
        return OrderListSerializer

    def create(self, request, *args, **kwargs):
        """Create order from cart."""
        try:
            cart = request.user.cart
        except Cart.DoesNotExist:
            return Response(
                {'detail': 'Cart not found.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = OrderCreateSerializer(
            data=request.data,
            context={'cart': cart, 'user': request.user}
        )
        serializer.is_valid(raise_exception=True)
        order = serializer.save()

        return Response(
            OrderSerializer(order).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def tracking(self, request, order_number=None):
        """Public order tracking."""
        try:
            order = Order.objects.get(order_number=order_number)
        except Order.DoesNotExist:
            return Response(
                {'detail': 'Order not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = OrderTrackingSerializer(order)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, order_number=None):
        """Cancel order."""
        order = self.get_object()

        if order.status not in [OrderStatus.PENDING, OrderStatus.CONFIRMED]:
            return Response(
                {'detail': 'Order cannot be cancelled at this stage.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        order.status = OrderStatus.CANCELLED
        order.cancelled_at = timezone.now()
        order.save()

        OrderStatusHistory.objects.create(
            order=order,
            status=OrderStatus.CANCELLED,
            notes='Cancelled by customer',
            changed_by=request.user
        )

        # TODO: Restore inventory

        return Response(OrderSerializer(order).data)


class VendorOrderViewSet(viewsets.GenericViewSet):
    """
    ViewSet for vendor order operations.
    """
    permission_classes = [IsAuthenticated, IsVendor]

    @action(detail=False, methods=['get'])
    def orders(self, request):
        """Get vendor's order items."""
        try:
            vendor = request.user.vendor
        except:
            return Response(
                {'detail': 'Vendor profile not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        items = OrderItem.objects.filter(vendor=vendor).select_related('order').order_by('-created_at')

        # Filter by status
        item_status = request.query_params.get('status')
        if item_status:
            items = items.filter(status=item_status)

        # Simple pagination
        page_size = 20
        page = int(request.query_params.get('page', 1))
        start = (page - 1) * page_size
        end = start + page_size

        from .serializers import OrderItemSerializer
        serializer = OrderItemSerializer(items[start:end], many=True)
        return Response({
            'count': items.count(),
            'results': serializer.data
        })

    @action(detail=False, methods=['put'], url_path='orders/(?P<item_id>[^/.]+)/status')
    def update_item_status(self, request, item_id=None):
        """Update order item status."""
        try:
            vendor = request.user.vendor
        except:
            return Response(
                {'detail': 'Vendor profile not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            item = OrderItem.objects.get(id=item_id, vendor=vendor)
        except OrderItem.DoesNotExist:
            return Response(
                {'detail': 'Order item not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = OrderItemStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        item.status = serializer.validated_data['status']
        if 'tracking_number' in serializer.validated_data:
            item.tracking_number = serializer.validated_data['tracking_number']
        item.save()

        from .serializers import OrderItemSerializer
        return Response(OrderItemSerializer(item).data)


class OrderAdminViewSet(viewsets.ModelViewSet):
    """
    ViewSet for admin order management.
    """
    queryset = Order.objects.all()
    serializer_class = OrderAdminSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filterset_fields = ['status', 'payment_status', 'is_flagged']
    search_fields = ['order_number', 'shipping_email', 'user__email']
    ordering_fields = ['created_at', 'total', 'status']

    @action(detail=True, methods=['put'])
    def status(self, request, pk=None):
        """Update order status."""
        order = self.get_object()
        serializer = OrderStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data['status']
        order.status = new_status

        # Update timestamps
        if new_status == OrderStatus.SHIPPED:
            order.shipped_at = timezone.now()
        elif new_status == OrderStatus.DELIVERED:
            order.delivered_at = timezone.now()
        elif new_status == OrderStatus.CANCELLED:
            order.cancelled_at = timezone.now()

        order.save()

        # Create status history
        OrderStatusHistory.objects.create(
            order=order,
            status=new_status,
            notes=serializer.validated_data.get('notes', ''),
            changed_by=request.user
        )

        return Response(OrderAdminSerializer(order).data)

    @action(detail=True, methods=['post'])
    def refund(self, request, pk=None):
        """Process refund."""
        order = self.get_object()

        if order.payment_status != PaymentStatus.PAID:
            return Response(
                {'detail': 'Order is not paid.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        order.status = OrderStatus.REFUNDED
        order.payment_status = PaymentStatus.REFUNDED
        order.save()

        OrderStatusHistory.objects.create(
            order=order,
            status=OrderStatus.REFUNDED,
            notes='Refund processed by admin',
            changed_by=request.user
        )

        # TODO: Process actual refund via payment gateway

        return Response(OrderAdminSerializer(order).data)
