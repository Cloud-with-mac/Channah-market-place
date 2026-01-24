"""
Notification model for the marketplace.
"""
import uuid
from django.db import models
from django.conf import settings


class NotificationType(models.TextChoices):
    ORDER_PLACED = 'order_placed', 'Order Placed'
    ORDER_CONFIRMED = 'order_confirmed', 'Order Confirmed'
    ORDER_SHIPPED = 'order_shipped', 'Order Shipped'
    ORDER_DELIVERED = 'order_delivered', 'Order Delivered'
    ORDER_CANCELLED = 'order_cancelled', 'Order Cancelled'
    PAYMENT_RECEIVED = 'payment_received', 'Payment Received'
    PAYMENT_FAILED = 'payment_failed', 'Payment Failed'
    REFUND_PROCESSED = 'refund_processed', 'Refund Processed'
    NEW_REVIEW = 'new_review', 'New Review'
    REVIEW_RESPONSE = 'review_response', 'Review Response'
    PRICE_DROP = 'price_drop', 'Price Drop'
    BACK_IN_STOCK = 'back_in_stock', 'Back in Stock'
    NEW_MESSAGE = 'new_message', 'New Message'
    VENDOR_APPROVED = 'vendor_approved', 'Vendor Approved'
    PAYOUT_PROCESSED = 'payout_processed', 'Payout Processed'
    SYSTEM = 'system', 'System'


class Notification(models.Model):
    """
    User notification model.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )

    type = models.CharField(max_length=30, choices=NotificationType.choices)
    title = models.CharField(max_length=255)
    message = models.TextField()

    # Entity reference
    entity_type = models.CharField(max_length=50, blank=True, null=True)
    entity_id = models.UUIDField(blank=True, null=True)
    action_url = models.URLField(max_length=500, blank=True, null=True)

    # Status
    is_read = models.BooleanField(default=False)
    is_email_sent = models.BooleanField(default=False)
    is_push_sent = models.BooleanField(default=False)

    metadata = models.JSONField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.type} - {self.title}"
