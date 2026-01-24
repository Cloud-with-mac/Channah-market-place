"""
Views for search functionality.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db.models import Q

from apps.catalog.models import Product, Category
from apps.catalog.serializers import ProductListSerializer, CategorySerializer
from apps.vendors.models import Vendor
from apps.vendors.serializers import VendorPublicSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def global_search(request):
    """Global search across products, categories, and vendors."""
    query = request.query_params.get('q', '')

    if not query:
        return Response({
            'products': [],
            'categories': [],
            'vendors': []
        })

    # Search products
    products = Product.objects.filter(
        status='active'
    ).filter(
        Q(name__icontains=query) |
        Q(description__icontains=query) |
        Q(tags__contains=[query])
    )[:10]

    # Search categories
    categories = Category.objects.filter(
        is_active=True
    ).filter(
        Q(name__icontains=query) |
        Q(description__icontains=query)
    )[:5]

    # Search vendors
    vendors = Vendor.objects.filter(
        status='approved'
    ).filter(
        Q(business_name__icontains=query) |
        Q(description__icontains=query)
    )[:5]

    return Response({
        'products': ProductListSerializer(products, many=True).data,
        'categories': CategorySerializer(categories, many=True).data,
        'vendors': VendorPublicSerializer(vendors, many=True).data
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def product_search(request):
    """Advanced product search with filters."""
    query = request.query_params.get('q', '')
    category = request.query_params.get('category')
    vendor = request.query_params.get('vendor')
    min_price = request.query_params.get('min_price')
    max_price = request.query_params.get('max_price')
    rating = request.query_params.get('rating')
    in_stock = request.query_params.get('in_stock')
    on_sale = request.query_params.get('on_sale')
    sort = request.query_params.get('sort', 'relevance')

    products = Product.objects.filter(status='active')

    # Text search
    if query:
        products = products.filter(
            Q(name__icontains=query) |
            Q(description__icontains=query) |
            Q(short_description__icontains=query)
        )

    # Filters
    if category:
        products = products.filter(category__slug=category)
    if vendor:
        products = products.filter(vendor__slug=vendor)
    if min_price:
        products = products.filter(price__gte=min_price)
    if max_price:
        products = products.filter(price__lte=max_price)
    if rating:
        products = products.filter(rating__gte=rating)
    if in_stock == 'true':
        products = products.filter(quantity__gt=0)
    if on_sale == 'true':
        products = products.filter(compare_at_price__gt=0)

    # Sorting
    if sort == 'price_asc':
        products = products.order_by('price')
    elif sort == 'price_desc':
        products = products.order_by('-price')
    elif sort == 'rating':
        products = products.order_by('-rating')
    elif sort == 'newest':
        products = products.order_by('-created_at')
    elif sort == 'best_selling':
        products = products.order_by('-sales_count')
    else:
        products = products.order_by('-rating', '-sales_count')

    # Pagination
    page = int(request.query_params.get('page', 1))
    limit = int(request.query_params.get('limit', 20))
    start = (page - 1) * limit
    end = start + limit

    total = products.count()
    products = products[start:end]

    return Response({
        'count': total,
        'total_pages': (total + limit - 1) // limit,
        'page': page,
        'results': ProductListSerializer(products, many=True).data
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def autocomplete(request):
    """Search autocomplete."""
    query = request.query_params.get('q', '')

    if len(query) < 2:
        return Response({'suggestions': []})

    products = Product.objects.filter(
        status='active',
        name__icontains=query
    ).values_list('name', flat=True)[:8]

    return Response({'suggestions': list(products)})


@api_view(['GET'])
@permission_classes([AllowAny])
def trending(request):
    """Get trending searches/products."""
    # Get best-selling products as "trending"
    products = Product.objects.filter(
        status='active'
    ).order_by('-sales_count', '-view_count')[:10]

    return Response({
        'products': ProductListSerializer(products, many=True).data
    })
