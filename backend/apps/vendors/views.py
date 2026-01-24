"""
Views for vendor management.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from django.db.models import Sum, Count

from common.permissions import IsVendor, IsAdmin
from .models import Vendor, VendorPayout, VendorStatus
from .serializers import (
    VendorSerializer,
    VendorPublicSerializer,
    VendorCreateSerializer,
    VendorUpdateSerializer,
    VendorBankDetailsSerializer,
    VendorDashboardSerializer,
    VendorPayoutSerializer,
    VendorPayoutCreateSerializer,
    VendorAdminSerializer,
    VendorStatusUpdateSerializer,
)


class VendorViewSet(viewsets.ModelViewSet):
    """
    ViewSet for vendor operations.
    """
    queryset = Vendor.objects.filter(status=VendorStatus.APPROVED)
    serializer_class = VendorPublicSerializer
    lookup_field = 'slug'

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        if self.action == 'register':
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsVendor()]

    def get_serializer_class(self):
        if self.action == 'register':
            return VendorCreateSerializer
        if self.action in ['update', 'partial_update']:
            return VendorUpdateSerializer
        if self.action == 'me':
            return VendorSerializer
        if self.action == 'dashboard':
            return VendorDashboardSerializer
        if self.action == 'bank_details':
            return VendorBankDetailsSerializer
        return VendorPublicSerializer

    @action(detail=False, methods=['post'])
    def register(self, request):
        """Register as a vendor."""
        # Check if user already has a vendor profile
        if hasattr(request.user, 'vendor'):
            return Response(
                {'detail': 'You already have a vendor profile.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = VendorCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        vendor = serializer.save()

        return Response(
            VendorSerializer(vendor).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=False, methods=['get', 'put', 'patch'])
    def me(self, request):
        """Get or update current vendor profile."""
        try:
            vendor = request.user.vendor
        except Vendor.DoesNotExist:
            return Response(
                {'detail': 'Vendor profile not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if request.method == 'GET':
            return Response(VendorSerializer(vendor).data)

        serializer = VendorUpdateSerializer(
            vendor,
            data=request.data,
            partial=request.method == 'PATCH'
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(VendorSerializer(vendor).data)

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Get vendor dashboard statistics."""
        try:
            vendor = request.user.vendor
        except Vendor.DoesNotExist:
            return Response(
                {'detail': 'Vendor profile not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response(VendorDashboardSerializer(vendor).data)

    @action(detail=False, methods=['put'], url_path='bank-details')
    def bank_details(self, request):
        """Update bank details for payouts."""
        try:
            vendor = request.user.vendor
        except Vendor.DoesNotExist:
            return Response(
                {'detail': 'Vendor profile not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = VendorBankDetailsSerializer(vendor, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'message': 'Bank details updated successfully.'})

    @action(detail=False, methods=['get', 'post'])
    def payouts(self, request):
        """Get payout history or request a payout."""
        try:
            vendor = request.user.vendor
        except Vendor.DoesNotExist:
            return Response(
                {'detail': 'Vendor profile not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if request.method == 'GET':
            payouts = VendorPayout.objects.filter(vendor=vendor)
            serializer = VendorPayoutSerializer(payouts, many=True)
            return Response(serializer.data)

        # POST - Create payout request
        serializer = VendorPayoutCreateSerializer(
            data=request.data,
            context={'vendor': vendor}
        )
        serializer.is_valid(raise_exception=True)
        payout = serializer.save()

        return Response(
            VendorPayoutSerializer(payout).data,
            status=status.HTTP_201_CREATED
        )


class VendorAdminViewSet(viewsets.ModelViewSet):
    """
    ViewSet for admin vendor management.
    """
    queryset = Vendor.objects.all()
    serializer_class = VendorAdminSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filterset_fields = ['status', 'is_featured']
    search_fields = ['business_name', 'business_email', 'user__email']
    ordering_fields = ['created_at', 'business_name', 'rating', 'total_sales']

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get pending vendor applications."""
        vendors = Vendor.objects.filter(status=VendorStatus.PENDING)
        serializer = VendorAdminSerializer(vendors, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['put'])
    def approve(self, request, pk=None):
        """Approve vendor application."""
        vendor = self.get_object()
        vendor.status = VendorStatus.APPROVED
        vendor.verified_at = timezone.now()
        vendor.save(update_fields=['status', 'verified_at'])

        # TODO: Send approval email
        # send_vendor_approved_email.delay(vendor.id)

        return Response(VendorAdminSerializer(vendor).data)

    @action(detail=True, methods=['put'])
    def reject(self, request, pk=None):
        """Reject vendor application."""
        vendor = self.get_object()
        serializer = VendorStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        vendor.status = VendorStatus.REJECTED
        vendor.save(update_fields=['status'])

        # TODO: Send rejection email with reason
        # send_vendor_rejected_email.delay(vendor.id, serializer.validated_data.get('reason'))

        return Response(VendorAdminSerializer(vendor).data)

    @action(detail=True, methods=['put'])
    def suspend(self, request, pk=None):
        """Suspend vendor."""
        vendor = self.get_object()
        serializer = VendorStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        vendor.status = VendorStatus.SUSPENDED
        vendor.save(update_fields=['status'])

        return Response(VendorAdminSerializer(vendor).data)
