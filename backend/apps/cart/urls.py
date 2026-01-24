"""
URL patterns for cart endpoints.
"""
from django.urls import path
from .views import CartViewSet

cart_view = CartViewSet.as_view({
    'get': 'list',
    'delete': 'clear',
})

urlpatterns = [
    path('', cart_view, name='cart'),
    path('items/', CartViewSet.as_view({'post': 'items'}), name='cart-items'),
    path('items/<uuid:item_id>/', CartViewSet.as_view({'put': 'update_item', 'delete': 'remove_item'}), name='cart-item-detail'),
    path('coupon/', CartViewSet.as_view({'post': 'coupon', 'delete': 'remove_coupon'}), name='cart-coupon'),
    path('merge/', CartViewSet.as_view({'post': 'merge'}), name='cart-merge'),
]
