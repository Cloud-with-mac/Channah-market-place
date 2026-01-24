"""
URL configuration for MarketHub marketplace.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Health check endpoint."""
    return Response({
        'status': 'healthy',
        'app': settings.SPECTACULAR_SETTINGS['TITLE'],
        'version': settings.SPECTACULAR_SETTINGS['VERSION'],
    })


urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),

    # Health check
    path('health/', health_check, name='health_check'),

    # API v1
    path('api/v1/', include([
        path('auth/', include('apps.accounts.urls_auth')),
        path('users/', include('apps.accounts.urls_users')),
        path('vendors/', include('apps.vendors.urls')),
        path('products/', include('apps.catalog.urls_products')),
        path('categories/', include('apps.catalog.urls_categories')),
        path('cart/', include('apps.cart.urls')),
        path('orders/', include('apps.orders.urls')),
        path('payments/', include('apps.payments.urls')),
        path('reviews/', include('apps.reviews.urls')),
        path('addresses/', include('apps.addresses.urls')),
        path('wishlist/', include('apps.wishlist.urls')),
        path('notifications/', include('apps.notifications.urls')),
        path('ai/', include('apps.ai.urls')),
        path('search/', include('apps.search.urls')),
        path('upload/', include('apps.upload.urls')),
        path('admin-api/', include('apps.administration.urls')),
    ])),

    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
