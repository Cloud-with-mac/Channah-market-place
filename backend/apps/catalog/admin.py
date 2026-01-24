"""
Admin configuration for Catalog models.
"""
from django.contrib import admin
from .models import Category, Product, ProductImage, ProductVariant, ProductAttribute


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'parent', 'slug', 'is_active', 'is_featured', 'sort_order']
    list_filter = ['is_active', 'is_featured', 'parent']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}
    ordering = ['sort_order', 'name']


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1


class ProductAttributeInline(admin.TabularInline):
    model = ProductAttribute
    extra = 1


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'vendor', 'category', 'price', 'quantity', 'status', 'rating', 'created_at']
    list_filter = ['status', 'is_featured', 'category', 'created_at']
    search_fields = ['name', 'sku', 'vendor__business_name']
    prepopulated_fields = {'slug': ('name',)}
    ordering = ['-created_at']
    readonly_fields = ['view_count', 'sales_count', 'rating', 'review_count', 'created_at', 'updated_at']
    inlines = [ProductImageInline, ProductVariantInline, ProductAttributeInline]

    fieldsets = (
        (None, {'fields': ('vendor', 'category', 'name', 'slug', 'description', 'short_description')}),
        ('Identifiers', {'fields': ('sku', 'barcode')}),
        ('Pricing', {'fields': ('price', 'compare_at_price', 'cost_price', 'currency')}),
        ('Inventory', {'fields': ('quantity', 'low_stock_threshold', 'track_inventory', 'allow_backorder')}),
        ('Shipping', {'fields': ('weight', 'length', 'width', 'height', 'requires_shipping', 'shipping_class')}),
        ('Status', {'fields': ('status', 'is_featured', 'is_digital')}),
        ('SEO', {'fields': ('meta_title', 'meta_description', 'tags')}),
        ('AI Features', {'fields': ('ai_generated_description', 'ai_suggested_tags', 'ai_category_confidence')}),
        ('Analytics', {'fields': ('view_count', 'sales_count', 'rating', 'review_count')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at', 'published_at')}),
    )
