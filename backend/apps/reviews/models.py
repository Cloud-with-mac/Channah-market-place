"""
Review model for the marketplace.
"""
import uuid
from django.db import models
from django.conf import settings


class Review(models.Model):
    """
    Product review model.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reviews'
    )
    product = models.ForeignKey(
        'catalog.Product',
        on_delete=models.CASCADE,
        related_name='reviews'
    )
    order = models.ForeignKey(
        'orders.Order',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    rating = models.IntegerField()  # 1-5
    title = models.CharField(max_length=255, blank=True, null=True)
    content = models.TextField()
    images = models.JSONField(blank=True, null=True)  # List of image URLs

    # Moderation
    is_verified_purchase = models.BooleanField(default=False)
    is_approved = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)

    # AI Sentiment Analysis
    sentiment_score = models.FloatField(blank=True, null=True)  # -100 to 100
    sentiment_label = models.CharField(max_length=20, blank=True, null=True)  # positive/negative/neutral
    ai_summary = models.TextField(blank=True, null=True)

    # Helpful votes
    helpful_count = models.IntegerField(default=0)
    not_helpful_count = models.IntegerField(default=0)

    # Vendor response
    vendor_response = models.TextField(blank=True, null=True)
    vendor_response_at = models.DateTimeField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'reviews'
        ordering = ['-created_at']
        unique_together = ['user', 'product']

    def __str__(self):
        return f"Review by {self.user.email} for {self.product.name}"
