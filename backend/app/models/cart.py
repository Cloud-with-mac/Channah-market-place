import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Numeric, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.types import GUID


class Cart(Base):
    __tablename__ = "carts"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=True)

    # For guest carts
    session_id = Column(String(255), unique=True, nullable=True, index=True)

    # Applied coupon
    coupon_code = Column(String(50), nullable=True)
    discount_amount = Column(Numeric(12, 2), default=0.00, nullable=False)

    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="cart")
    items = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Cart {self.id}>"

    @property
    def subtotal(self):
        """Calculate cart subtotal"""
        return sum(item.total for item in self.items)

    @property
    def total(self):
        """Calculate cart total after discount"""
        return max(self.subtotal - self.discount_amount, 0)

    @property
    def item_count(self):
        """Get total number of items"""
        return sum(item.quantity for item in self.items)

    def get_items_by_vendor(self):
        """Group cart items by vendor for split checkout"""
        vendor_items = {}
        for item in self.items:
            vendor_id = str(item.product.vendor_id)
            if vendor_id not in vendor_items:
                vendor_items[vendor_id] = {
                    "vendor": item.product.vendor,
                    "items": [],
                    "subtotal": 0
                }
            vendor_items[vendor_id]["items"].append(item)
            vendor_items[vendor_id]["subtotal"] += item.total
        return vendor_items


class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    cart_id = Column(GUID(), ForeignKey("carts.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(GUID(), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    variant_id = Column(GUID(), ForeignKey("product_variants.id", ondelete="SET NULL"), nullable=True)

    quantity = Column(Integer, default=1, nullable=False)
    price = Column(Numeric(12, 2), nullable=False)  # Price at time of adding

    # Custom options (e.g., personalization)
    custom_options = Column(Text, nullable=True)  # JSON string

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    cart = relationship("Cart", back_populates="items")
    product = relationship("Product", back_populates="cart_items")
    variant = relationship("ProductVariant")

    def __repr__(self):
        return f"<CartItem {self.product_id} x{self.quantity}>"

    @property
    def total(self):
        """Calculate item total"""
        return self.price * self.quantity
