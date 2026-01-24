"""
Custom permissions for the marketplace API.
"""
from rest_framework.permissions import BasePermission


class IsVendor(BasePermission):
    """
    Permission that allows only vendors and admins.
    """
    message = 'You must be a vendor to perform this action.'

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role in ['vendor', 'admin']
        )


class IsAdmin(BasePermission):
    """
    Permission that allows only admins.
    """
    message = 'You must be an admin to perform this action.'

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role == 'admin'
        )


class IsOwner(BasePermission):
    """
    Permission that allows only the owner of an object.
    """
    message = 'You do not have permission to access this resource.'

    def has_object_permission(self, request, view, obj):
        # Check if the object has a user attribute
        if hasattr(obj, 'user'):
            return obj.user == request.user
        # Check if the object has a user_id attribute
        if hasattr(obj, 'user_id'):
            return obj.user_id == request.user.id
        return False


class IsOwnerOrAdmin(BasePermission):
    """
    Permission that allows the owner or admin.
    """
    message = 'You do not have permission to access this resource.'

    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'user_id'):
            return obj.user_id == request.user.id
        return False


class IsVendorOwner(BasePermission):
    """
    Permission that allows only the vendor who owns the resource.
    """
    message = 'You do not have permission to access this vendor resource.'

    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True
        if hasattr(obj, 'vendor'):
            return obj.vendor.user == request.user
        if hasattr(obj, 'vendor_id'):
            from apps.vendors.models import Vendor
            try:
                vendor = Vendor.objects.get(user=request.user)
                return obj.vendor_id == vendor.id
            except Vendor.DoesNotExist:
                return False
        return False


class IsAuthenticatedOrReadOnly(BasePermission):
    """
    Allows read-only access for unauthenticated users.
    """
    def has_permission(self, request, view):
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        return request.user.is_authenticated
