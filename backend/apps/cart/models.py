"""
Cart models for the marketplace.
"""
import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings


class Cart(models.Model):
    """
    Shopping cart model. Supports both user and guest carts.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='cart'
    )

    # For guest carts
    session_id = models.CharField(max_length=255, unique=True, null=True, blank=True, db_index=True)

    # Applied coupon
    coupon_code = models.CharField(max_length=50, blank=True, null=True)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'carts'

    def __str__(self):
        if self.user:
            return f"Cart for {self.user.email}"
        return f"Guest cart {self.session_id}"

    @property
    def subtotal(self):
        """Calculate cart subtotal."""
        return sum(item.total for item in self.items.all())

    @property
    def total(self):
        """Calculate cart total after discount."""
        return max(self.subtotal - self.discount_amount, Decimal('0.00'))

    @property
    def item_count(self):
        """Get total number of items."""
        return sum(item.quantity for item in self.items.all())

    def get_items_by_vendor(self):
        """Group cart items by vendor for split checkout."""
        vendor_items = {}
        for item in self.items.select_related('product__vendor').all():
            vendor_id = str(item.product.vendor_id)
            if vendor_id not in vendor_items:
                vendor_items[vendor_id] = {
                    'vendor': item.product.vendor,
                    'items': [],
                    'subtotal': Decimal('0.00')
                }
            vendor_items[vendor_id]['items'].append(item)
            vendor_items[vendor_id]['subtotal'] += item.total
        return vendor_items


class CartItem(models.Model):
    """
    Cart item model.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
        related_name='items'
    )
    product = models.ForeignKey(
        'catalog.Product',
        on_delete=models.CASCADE,
        related_name='cart_items'
    )
    variant = models.ForeignKey(
        'catalog.ProductVariant',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    quantity = models.IntegerField(default=1)
    price = models.DecimalField(max_digits=12, decimal_places=2)  # Price at time of adding

    # Custom options (e.g., personalization)
    custom_options = models.JSONField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'cart_items'

    def __str__(self):
        return f"{self.product.name} x{self.quantity}"

    @property
    def total(self):
        """Calculate item total."""
        return self.price * self.quantity
