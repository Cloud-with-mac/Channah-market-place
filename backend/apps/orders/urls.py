"""
URL patterns for order endpoints.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import OrderViewSet, VendorOrderViewSet, OrderAdminViewSet

router = DefaultRouter()
router.register('', OrderViewSet, basename='orders')

vendor_router = DefaultRouter()
vendor_router.register('vendor', VendorOrderViewSet, basename='vendor-orders')

admin_router = DefaultRouter()
admin_router.register('admin', OrderAdminViewSet, basename='orders-admin')

urlpatterns = router.urls + vendor_router.urls + admin_router.urls
