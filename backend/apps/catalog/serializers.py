"""
Serializers for catalog (Category, Product).
"""
from rest_framework import serializers
from django.utils.text import slugify

from .models import Category, Product, ProductImage, ProductVariant, ProductAttribute, ProductStatus
from apps.vendors.serializers import VendorPublicSerializer


# Category Serializers
class CategorySerializer(serializers.ModelSerializer):
    """Basic category serializer."""
    full_path = serializers.CharField(read_only=True)
    product_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Category
        fields = [
            'id', 'parent', 'name', 'slug', 'description',
            'image_url', 'icon', 'sort_order', 'is_active',
            'is_featured', 'full_path', 'product_count'
        ]
        read_only_fields = ['id', 'slug']


class CategoryTreeSerializer(serializers.ModelSerializer):
    """Category serializer with children for tree structure."""
    children = serializers.SerializerMethodField()
    product_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Category
        fields = [
            'id', 'name', 'slug', 'description', 'image_url',
            'icon', 'is_featured', 'product_count', 'children'
        ]

    def get_children(self, obj):
        children = obj.children.filter(is_active=True).order_by('sort_order', 'name')
        return CategoryTreeSerializer(children, many=True).data


class CategoryCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating categories."""
    class Meta:
        model = Category
        fields = [
            'parent', 'name', 'description', 'image_url', 'icon',
            'meta_title', 'meta_description', 'sort_order',
            'is_active', 'is_featured'
        ]

    def create(self, validated_data):
        validated_data['slug'] = slugify(validated_data['name'])
        # Ensure unique slug
        slug = validated_data['slug']
        counter = 1
        while Category.objects.filter(slug=validated_data['slug']).exists():
            validated_data['slug'] = f"{slug}-{counter}"
            counter += 1
        return super().create(validated_data)


# Product Image Serializers
class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'url', 'alt_text', 'sort_order', 'is_primary', 'ai_tags', 'ai_description']
        read_only_fields = ['id']


# Product Variant Serializers
class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = [
            'id', 'name', 'sku', 'barcode', 'price', 'compare_at_price',
            'cost_price', 'quantity', 'image_url', 'options', 'weight', 'is_active'
        ]
        read_only_fields = ['id']


# Product Attribute Serializers
class ProductAttributeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductAttribute
        fields = ['id', 'name', 'value', 'is_visible']
        read_only_fields = ['id']


# Product Serializers
class ProductListSerializer(serializers.ModelSerializer):
    """Serializer for product listing."""
    vendor = VendorPublicSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    primary_image = serializers.CharField(read_only=True)
    discount_percentage = serializers.IntegerField(read_only=True)
    in_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'vendor', 'category', 'name', 'slug', 'short_description',
            'price', 'compare_at_price', 'currency', 'primary_image',
            'discount_percentage', 'in_stock', 'is_featured', 'rating',
            'review_count', 'created_at'
        ]


class ProductDetailSerializer(serializers.ModelSerializer):
    """Serializer for product detail."""
    vendor = VendorPublicSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    attributes = ProductAttributeSerializer(many=True, read_only=True)
    primary_image = serializers.CharField(read_only=True)
    discount_percentage = serializers.IntegerField(read_only=True)
    is_on_sale = serializers.BooleanField(read_only=True)
    in_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'vendor', 'category', 'name', 'slug', 'description',
            'short_description', 'sku', 'barcode', 'price', 'compare_at_price',
            'cost_price', 'currency', 'quantity', 'low_stock_threshold',
            'track_inventory', 'allow_backorder', 'weight', 'length', 'width',
            'height', 'requires_shipping', 'shipping_class', 'status',
            'is_featured', 'is_digital', 'meta_title', 'meta_description',
            'tags', 'primary_image', 'discount_percentage', 'is_on_sale',
            'in_stock', 'view_count', 'sales_count', 'rating', 'review_count',
            'images', 'variants', 'attributes', 'created_at', 'published_at'
        ]


class ProductCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating products."""
    images = ProductImageSerializer(many=True, required=False)
    variants = ProductVariantSerializer(many=True, required=False)
    attributes = ProductAttributeSerializer(many=True, required=False)

    class Meta:
        model = Product
        fields = [
            'category', 'name', 'description', 'short_description', 'sku',
            'barcode', 'price', 'compare_at_price', 'cost_price', 'currency',
            'quantity', 'low_stock_threshold', 'track_inventory', 'allow_backorder',
            'weight', 'length', 'width', 'height', 'requires_shipping',
            'shipping_class', 'status', 'is_featured', 'is_digital',
            'meta_title', 'meta_description', 'tags', 'images', 'variants', 'attributes'
        ]

    def create(self, validated_data):
        images_data = validated_data.pop('images', [])
        variants_data = validated_data.pop('variants', [])
        attributes_data = validated_data.pop('attributes', [])

        # Generate slug
        validated_data['slug'] = slugify(validated_data['name'])
        slug = validated_data['slug']
        counter = 1
        while Product.objects.filter(slug=validated_data['slug']).exists():
            validated_data['slug'] = f"{slug}-{counter}"
            counter += 1

        # Set vendor from context
        validated_data['vendor'] = self.context['vendor']

        product = Product.objects.create(**validated_data)

        # Create related objects
        for image_data in images_data:
            ProductImage.objects.create(product=product, **image_data)

        for variant_data in variants_data:
            ProductVariant.objects.create(product=product, **variant_data)

        for attribute_data in attributes_data:
            ProductAttribute.objects.create(product=product, **attribute_data)

        return product


class ProductUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating products."""
    class Meta:
        model = Product
        fields = [
            'category', 'name', 'description', 'short_description', 'sku',
            'barcode', 'price', 'compare_at_price', 'cost_price', 'currency',
            'quantity', 'low_stock_threshold', 'track_inventory', 'allow_backorder',
            'weight', 'length', 'width', 'height', 'requires_shipping',
            'shipping_class', 'status', 'is_featured', 'is_digital',
            'meta_title', 'meta_description', 'tags'
        ]


class ProductInventorySerializer(serializers.Serializer):
    """Serializer for updating product inventory."""
    quantity = serializers.IntegerField(min_value=0)
    low_stock_threshold = serializers.IntegerField(min_value=0, required=False)


class ProductImagesUpdateSerializer(serializers.Serializer):
    """Serializer for updating product images."""
    images = ProductImageSerializer(many=True)
