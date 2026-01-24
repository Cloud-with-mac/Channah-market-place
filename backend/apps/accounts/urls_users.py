"""
URL patterns for user management endpoints.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import UserViewSet, UserAdminViewSet

router = DefaultRouter()
router.register('', UserViewSet, basename='users')

admin_router = DefaultRouter()
admin_router.register('admin', UserAdminViewSet, basename='users-admin')

urlpatterns = router.urls + admin_router.urls
