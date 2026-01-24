"""
Signals for the orders app.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Order, OrderItem, OrderStatus


@receiver(post_save, sender=Order)
def update_vendor_sales(sender, instance, created, **kwargs):
    """Update vendor sales when order is paid."""
    if instance.payment_status == 'paid' and not created:
        for item in instance.items.all():
            if item.vendor:
                vendor = item.vendor
                vendor.total_sales += item.total
                vendor.total_earnings += item.vendor_amount
                vendor.balance += item.vendor_amount
                vendor.save(update_fields=['total_sales', 'total_earnings', 'balance'])

                # Update product sales count
                if item.product:
                    item.product.sales_count += item.quantity
                    item.product.save(update_fields=['sales_count'])
