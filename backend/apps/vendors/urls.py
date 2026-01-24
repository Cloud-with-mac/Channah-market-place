"""
URL patterns for vendor endpoints.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import VendorViewSet, VendorAdminViewSet

router = DefaultRouter()
router.register('', VendorViewSet, basename='vendors')

admin_router = DefaultRouter()
admin_router.register('admin', VendorAdminViewSet, basename='vendors-admin')

urlpatterns = router.urls + admin_router.urls
