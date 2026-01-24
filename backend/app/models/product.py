import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Text, Integer, Float, ForeignKey, Enum, Numeric
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.types import GUID, StringArray
import enum


class ProductStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING = "pending"
    ACTIVE = "active"
    INACTIVE = "inactive"
    OUT_OF_STOCK = "out_of_stock"
    REJECTED = "rejected"


class Product(Base):
    __tablename__ = "products"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    vendor_id = Column(GUID(), ForeignKey("vendors.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(GUID(), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)

    # Basic Info
    name = Column(String(500), nullable=False)
    slug = Column(String(550), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    short_description = Column(String(500), nullable=True)
    sku = Column(String(100), unique=True, nullable=True, index=True)
    barcode = Column(String(100), nullable=True)

    # Pricing
    price = Column(Numeric(12, 2), nullable=False)
    compare_at_price = Column(Numeric(12, 2), nullable=True)  # Original price for discounts
    cost_price = Column(Numeric(12, 2), nullable=True)  # Vendor's cost
    currency = Column(String(3), default="USD", nullable=False)

    # Inventory
    quantity = Column(Integer, default=0, nullable=False)
    low_stock_threshold = Column(Integer, default=5, nullable=False)
    track_inventory = Column(Boolean, default=True, nullable=False)
    allow_backorder = Column(Boolean, default=False, nullable=False)

    # Shipping
    weight = Column(Float, nullable=True)  # in kg
    length = Column(Float, nullable=True)  # in cm
    width = Column(Float, nullable=True)
    height = Column(Float, nullable=True)
    requires_shipping = Column(Boolean, default=True, nullable=False)
    shipping_class = Column(String(100), nullable=True)

    # Status
    status = Column(Enum(ProductStatus), default=ProductStatus.DRAFT, nullable=False)
    is_featured = Column(Boolean, default=False, nullable=False)
    is_digital = Column(Boolean, default=False, nullable=False)

    # SEO
    meta_title = Column(String(255), nullable=True)
    meta_description = Column(Text, nullable=True)
    tags = Column(StringArray(), nullable=True)

    # AI Features
    ai_generated_description = Column(Text, nullable=True)
    ai_suggested_tags = Column(StringArray(), nullable=True)
    ai_category_confidence = Column(Float, nullable=True)
    embedding = Column(Text, nullable=True)  # Vector embedding for semantic search

    # Analytics
    view_count = Column(Integer, default=0, nullable=False)
    sales_count = Column(Integer, default=0, nullable=False)
    rating = Column(Float, default=0.0, nullable=False)
    review_count = Column(Integer, default=0, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    published_at = Column(DateTime, nullable=True)

    # Relationships
    vendor = relationship("Vendor", back_populates="products")
    category = relationship("Category", back_populates="products")
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan", order_by="ProductImage.sort_order")
    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")
    attributes = relationship("ProductAttribute", back_populates="product", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="product", cascade="all, delete-orphan")
    order_items = relationship("OrderItem", back_populates="product")
    cart_items = relationship("CartItem", back_populates="product")
    wishlists = relationship("Wishlist", back_populates="product")

    def __repr__(self):
        return f"<Product {self.name}>"

    @property
    def primary_image(self):
        """Get the primary product image"""
        if self.images:
            return self.images[0].url
        return None

    @property
    def discount_percentage(self):
        """Calculate discount percentage"""
        if self.compare_at_price and self.compare_at_price > self.price:
            return round((1 - self.price / self.compare_at_price) * 100)
        return 0

    @property
    def is_on_sale(self):
        return self.compare_at_price is not None and self.compare_at_price > self.price

    @property
    def in_stock(self):
        if not self.track_inventory:
            return True
        return self.quantity > 0 or self.allow_backorder


class ProductImage(Base):
    __tablename__ = "product_images"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    product_id = Column(GUID(), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)

    url = Column(String(500), nullable=False)
    alt_text = Column(String(255), nullable=True)
    sort_order = Column(Integer, default=0, nullable=False)
    is_primary = Column(Boolean, default=False, nullable=False)

    # AI-generated metadata
    ai_tags = Column(StringArray(), nullable=True)
    ai_description = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    product = relationship("Product", back_populates="images")

    def __repr__(self):
        return f"<ProductImage {self.id}>"


class ProductVariant(Base):
    __tablename__ = "product_variants"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    product_id = Column(GUID(), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)

    name = Column(String(255), nullable=False)  # e.g., "Red / Large"
    sku = Column(String(100), unique=True, nullable=True)
    barcode = Column(String(100), nullable=True)

    price = Column(Numeric(12, 2), nullable=False)
    compare_at_price = Column(Numeric(12, 2), nullable=True)
    cost_price = Column(Numeric(12, 2), nullable=True)

    quantity = Column(Integer, default=0, nullable=False)
    image_url = Column(String(500), nullable=True)

    # Variant options (e.g., {"color": "Red", "size": "Large"})
    options = Column(Text, nullable=True)  # JSON string

    weight = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    product = relationship("Product", back_populates="variants")

    def __repr__(self):
        return f"<ProductVariant {self.name}>"


class ProductAttribute(Base):
    __tablename__ = "product_attributes"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    product_id = Column(GUID(), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)

    name = Column(String(255), nullable=False)  # e.g., "Color", "Size", "Material"
    value = Column(String(500), nullable=False)  # e.g., "Red", "XL", "Cotton"
    is_visible = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    product = relationship("Product", back_populates="attributes")

    def __repr__(self):
        return f"<ProductAttribute {self.name}: {self.value}>"
