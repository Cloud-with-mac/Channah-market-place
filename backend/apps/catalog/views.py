"""
Views for catalog (Category, Product).
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import F

from common.permissions import IsVendor, IsAdmin
from .models import Category, Product, ProductImage, ProductStatus
from .serializers import (
    CategorySerializer,
    CategoryTreeSerializer,
    CategoryCreateSerializer,
    ProductListSerializer,
    ProductDetailSerializer,
    ProductCreateSerializer,
    ProductUpdateSerializer,
    ProductInventorySerializer,
    ProductImagesUpdateSerializer,
    ProductImageSerializer,
)


class CategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for category operations.
    """
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    lookup_field = 'slug'

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'tree', 'featured', 'subcategories']:
            return [AllowAny()]
        return [IsAuthenticated(), IsAdmin()]

    def get_serializer_class(self):
        if self.action == 'create':
            return CategoryCreateSerializer
        if self.action == 'tree':
            return CategoryTreeSerializer
        return CategorySerializer

    def get_queryset(self):
        queryset = Category.objects.filter(is_active=True)
        if self.action == 'list':
            # By default, return only root categories
            parent = self.request.query_params.get('parent')
            if parent is None:
                queryset = queryset.filter(parent__isnull=True)
            elif parent:
                queryset = queryset.filter(parent__slug=parent)
        return queryset.order_by('sort_order', 'name')

    @action(detail=False, methods=['get'])
    def tree(self, request):
        """Get full category tree."""
        root_categories = Category.objects.filter(
            is_active=True,
            parent__isnull=True
        ).order_by('sort_order', 'name')
        serializer = CategoryTreeSerializer(root_categories, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Get featured categories."""
        categories = Category.objects.filter(
            is_active=True,
            is_featured=True
        ).order_by('sort_order', 'name')[:10]
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def subcategories(self, request, slug=None):
        """Get subcategories of a category."""
        category = self.get_object()
        subcategories = category.children.filter(is_active=True).order_by('sort_order', 'name')
        serializer = CategorySerializer(subcategories, many=True)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        """Prevent deletion if category has children or products."""
        category = self.get_object()
        if category.children.exists():
            return Response(
                {'detail': 'Cannot delete category with subcategories.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if category.products.exists():
            return Response(
                {'detail': 'Cannot delete category with products.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)


class ProductViewSet(viewsets.ModelViewSet):
    """
    ViewSet for product operations.
    """
    queryset = Product.objects.filter(status=ProductStatus.ACTIVE)
    serializer_class = ProductListSerializer
    lookup_field = 'slug'
    filterset_fields = ['is_featured', 'status']
    search_fields = ['name', 'description', 'sku', 'tags']
    ordering_fields = ['price', 'created_at', 'rating', 'sales_count', 'view_count']

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'featured', 'new_arrivals', 'best_sellers']:
            return [AllowAny()]
        return [IsAuthenticated(), IsVendor()]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProductDetailSerializer
        if self.action == 'create':
            return ProductCreateSerializer
        if self.action in ['update', 'partial_update']:
            return ProductUpdateSerializer
        if self.action == 'inventory':
            return ProductInventorySerializer
        if self.action == 'images':
            return ProductImagesUpdateSerializer
        return ProductListSerializer

    def get_queryset(self):
        queryset = Product.objects.select_related('vendor', 'category').prefetch_related('images')

        # For public endpoints, only show active products
        if self.action in ['list', 'retrieve', 'featured', 'new_arrivals', 'best_sellers']:
            queryset = queryset.filter(status=ProductStatus.ACTIVE)

        # Filter by query params
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category__slug=category)

        vendor = self.request.query_params.get('vendor')
        if vendor:
            queryset = queryset.filter(vendor__slug=vendor)

        min_price = self.request.query_params.get('min_price')
        if min_price:
            queryset = queryset.filter(price__gte=min_price)

        max_price = self.request.query_params.get('max_price')
        if max_price:
            queryset = queryset.filter(price__lte=max_price)

        in_stock = self.request.query_params.get('in_stock')
        if in_stock == 'true':
            queryset = queryset.filter(quantity__gt=0)

        return queryset

    def retrieve(self, request, *args, **kwargs):
        """Get product and increment view count."""
        instance = self.get_object()
        # Increment view count
        Product.objects.filter(pk=instance.pk).update(view_count=F('view_count') + 1)
        instance.refresh_from_db()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        """Create product for current vendor."""
        try:
            vendor = request.user.vendor
        except:
            return Response(
                {'detail': 'You must be a vendor to create products.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = ProductCreateSerializer(
            data=request.data,
            context={'request': request, 'vendor': vendor}
        )
        serializer.is_valid(raise_exception=True)
        product = serializer.save()

        return Response(
            ProductDetailSerializer(product).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Get featured products."""
        products = self.get_queryset().filter(is_featured=True)[:12]
        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='new-arrivals')
    def new_arrivals(self, request):
        """Get newest products."""
        products = self.get_queryset().order_by('-created_at')[:12]
        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='best-sellers')
    def best_sellers(self, request):
        """Get best selling products."""
        products = self.get_queryset().order_by('-sales_count')[:12]
        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='vendor/my-products')
    def my_products(self, request):
        """Get current vendor's products."""
        try:
            vendor = request.user.vendor
        except:
            return Response(
                {'detail': 'Vendor profile not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        products = Product.objects.filter(vendor=vendor).order_by('-created_at')
        page = self.paginate_queryset(products)
        if page is not None:
            serializer = ProductListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['put'])
    def inventory(self, request, slug=None):
        """Update product inventory."""
        product = self.get_object()

        # Check ownership
        if product.vendor.user != request.user and request.user.role != 'admin':
            return Response(
                {'detail': 'You do not have permission to update this product.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = ProductInventorySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product.quantity = serializer.validated_data['quantity']
        if 'low_stock_threshold' in serializer.validated_data:
            product.low_stock_threshold = serializer.validated_data['low_stock_threshold']

        # Update status based on inventory
        if product.quantity == 0 and product.status == ProductStatus.ACTIVE:
            product.status = ProductStatus.OUT_OF_STOCK
        elif product.quantity > 0 and product.status == ProductStatus.OUT_OF_STOCK:
            product.status = ProductStatus.ACTIVE

        product.save()
        return Response(ProductDetailSerializer(product).data)

    @action(detail=True, methods=['put'])
    def images(self, request, slug=None):
        """Update product images."""
        product = self.get_object()

        # Check ownership
        if product.vendor.user != request.user and request.user.role != 'admin':
            return Response(
                {'detail': 'You do not have permission to update this product.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = ProductImagesUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Delete existing images and create new ones
        product.images.all().delete()
        for image_data in serializer.validated_data['images']:
            ProductImage.objects.create(product=product, **image_data)

        return Response(ProductDetailSerializer(product).data)
