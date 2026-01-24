"""
Catalog models: Category, Product, ProductImage, ProductVariant, ProductAttribute.
"""
import uuid
from django.db import models

# Using JSONField for SQLite compatibility
# For PostgreSQL, you can use ArrayField: from django.contrib.postgres.fields import ArrayField


class Category(models.Model):
    """
    Hierarchical product category.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    parent = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='children'
    )

    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, db_index=True)
    description = models.TextField(blank=True, null=True)
    image_url = models.URLField(max_length=500, blank=True, null=True)
    icon = models.CharField(max_length=100, blank=True, null=True)

    # SEO
    meta_title = models.CharField(max_length=255, blank=True, null=True)
    meta_description = models.TextField(blank=True, null=True)

    # Ordering and Display
    sort_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)

    # AI-generated attributes
    suggested_attributes = models.JSONField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'categories'
        verbose_name_plural = 'Categories'
        ordering = ['sort_order', 'name']

    def __str__(self):
        return self.name

    @property
    def full_path(self):
        """Get full category path (e.g., 'Electronics > Phones > Smartphones')"""
        path = [self.name]
        parent = self.parent
        while parent:
            path.insert(0, parent.name)
            parent = parent.parent
        return ' > '.join(path)

    @property
    def product_count(self):
        """Get count of active products in this category."""
        return self.products.filter(status='active').count()


class ProductStatus(models.TextChoices):
    DRAFT = 'draft', 'Draft'
    PENDING = 'pending', 'Pending'
    ACTIVE = 'active', 'Active'
    INACTIVE = 'inactive', 'Inactive'
    OUT_OF_STOCK = 'out_of_stock', 'Out of Stock'
    REJECTED = 'rejected', 'Rejected'


class Product(models.Model):
    """
    Product model.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vendor = models.ForeignKey(
        'vendors.Vendor',
        on_delete=models.CASCADE,
        related_name='products'
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='products'
    )

    # Basic Info
    name = models.CharField(max_length=500)
    slug = models.SlugField(max_length=550, unique=True, db_index=True)
    description = models.TextField(blank=True, null=True)
    short_description = models.CharField(max_length=500, blank=True, null=True)
    sku = models.CharField(max_length=100, unique=True, null=True, blank=True, db_index=True)
    barcode = models.CharField(max_length=100, blank=True, null=True)

    # Pricing
    price = models.DecimalField(max_digits=12, decimal_places=2)
    compare_at_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    cost_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=3, default='USD')

    # Inventory
    quantity = models.IntegerField(default=0)
    low_stock_threshold = models.IntegerField(default=5)
    track_inventory = models.BooleanField(default=True)
    allow_backorder = models.BooleanField(default=False)

    # Shipping
    weight = models.FloatField(null=True, blank=True)
    length = models.FloatField(null=True, blank=True)
    width = models.FloatField(null=True, blank=True)
    height = models.FloatField(null=True, blank=True)
    requires_shipping = models.BooleanField(default=True)
    shipping_class = models.CharField(max_length=100, blank=True, null=True)

    # Status
    status = models.CharField(
        max_length=20,
        choices=ProductStatus.choices,
        default=ProductStatus.DRAFT
    )
    is_featured = models.BooleanField(default=False)
    is_digital = models.BooleanField(default=False)

    # SEO
    meta_title = models.CharField(max_length=255, blank=True, null=True)
    meta_description = models.TextField(blank=True, null=True)
    tags = models.JSONField(blank=True, null=True)  # List of strings

    # AI Features
    ai_generated_description = models.TextField(blank=True, null=True)
    ai_suggested_tags = models.JSONField(blank=True, null=True)  # List of strings
    ai_category_confidence = models.FloatField(null=True, blank=True)
    embedding = models.TextField(blank=True, null=True)

    # Analytics
    view_count = models.IntegerField(default=0)
    sales_count = models.IntegerField(default=0)
    rating = models.FloatField(default=0.0)
    review_count = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'products'
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    @property
    def primary_image(self):
        """Get the primary product image."""
        image = self.images.filter(is_primary=True).first()
        if not image:
            image = self.images.order_by('sort_order').first()
        return image.url if image else None

    @property
    def discount_percentage(self):
        """Calculate discount percentage."""
        if self.compare_at_price and self.compare_at_price > self.price:
            return round((1 - float(self.price) / float(self.compare_at_price)) * 100)
        return 0

    @property
    def is_on_sale(self):
        return self.compare_at_price is not None and self.compare_at_price > self.price

    @property
    def in_stock(self):
        if not self.track_inventory:
            return True
        return self.quantity > 0 or self.allow_backorder


class ProductImage(models.Model):
    """
    Product image model.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='images'
    )

    url = models.URLField(max_length=500)
    alt_text = models.CharField(max_length=255, blank=True, null=True)
    sort_order = models.IntegerField(default=0)
    is_primary = models.BooleanField(default=False)

    # AI-generated metadata
    ai_tags = models.JSONField(blank=True, null=True)  # List of strings
    ai_description = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'product_images'
        ordering = ['sort_order']

    def __str__(self):
        return f"Image for {self.product.name}"


class ProductVariant(models.Model):
    """
    Product variant (e.g., different sizes, colors).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='variants'
    )

    name = models.CharField(max_length=255)
    sku = models.CharField(max_length=100, unique=True, null=True, blank=True)
    barcode = models.CharField(max_length=100, blank=True, null=True)

    price = models.DecimalField(max_digits=12, decimal_places=2)
    compare_at_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    cost_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    quantity = models.IntegerField(default=0)
    image_url = models.URLField(max_length=500, blank=True, null=True)

    # Variant options (e.g., {"color": "Red", "size": "Large"})
    options = models.JSONField(blank=True, null=True)

    weight = models.FloatField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'product_variants'
        ordering = ['name']

    def __str__(self):
        return f"{self.product.name} - {self.name}"


class ProductAttribute(models.Model):
    """
    Product attribute (e.g., Color, Size, Material).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='attributes'
    )

    name = models.CharField(max_length=255)
    value = models.CharField(max_length=500)
    is_visible = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'product_attributes'

    def __str__(self):
        return f"{self.name}: {self.value}"
