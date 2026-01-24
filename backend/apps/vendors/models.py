"""
Vendor models for the marketplace.
"""
import uuid
from django.db import models
from django.conf import settings


class VendorStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    APPROVED = 'approved', 'Approved'
    SUSPENDED = 'suspended', 'Suspended'
    REJECTED = 'rejected', 'Rejected'


class PayoutStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    PROCESSING = 'processing', 'Processing'
    COMPLETED = 'completed', 'Completed'
    FAILED = 'failed', 'Failed'


class Vendor(models.Model):
    """
    Vendor/Seller model.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='vendor'
    )

    # Business Information
    business_name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, db_index=True)
    description = models.TextField(blank=True, null=True)
    logo_url = models.URLField(max_length=500, blank=True, null=True)
    banner_url = models.URLField(max_length=500, blank=True, null=True)

    # Contact Information
    business_email = models.EmailField()
    business_phone = models.CharField(max_length=20, blank=True, null=True)
    business_address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    postal_code = models.CharField(max_length=20, blank=True, null=True)

    # Verification
    status = models.CharField(
        max_length=20,
        choices=VendorStatus.choices,
        default=VendorStatus.PENDING
    )
    tax_id = models.CharField(max_length=100, blank=True, null=True)
    business_registration = models.URLField(max_length=500, blank=True, null=True)
    verified_at = models.DateTimeField(blank=True, null=True)

    # Financial
    commission_rate = models.FloatField(default=10.0)
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_earnings = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_sales = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    # Bank Details for Payouts
    bank_name = models.CharField(max_length=255, blank=True, null=True)
    bank_account_name = models.CharField(max_length=255, blank=True, null=True)
    bank_account_number = models.CharField(max_length=100, blank=True, null=True)
    bank_routing_number = models.CharField(max_length=100, blank=True, null=True)
    bank_country = models.CharField(max_length=100, blank=True, null=True)

    # Stripe Connect
    stripe_account_id = models.CharField(max_length=255, blank=True, null=True)
    stripe_onboarding_complete = models.BooleanField(default=False)

    # Ratings
    rating = models.FloatField(default=0.0)
    total_reviews = models.IntegerField(default=0)

    # Settings
    is_featured = models.BooleanField(default=False)
    auto_approve_products = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'vendors'
        ordering = ['-created_at']

    def __str__(self):
        return self.business_name


class VendorPayout(models.Model):
    """
    Vendor payout request model.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name='payouts'
    )

    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    status = models.CharField(
        max_length=20,
        choices=PayoutStatus.choices,
        default=PayoutStatus.PENDING
    )

    payment_method = models.CharField(max_length=50)  # bank_transfer, stripe, paypal
    transaction_id = models.CharField(max_length=255, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    processed_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'vendor_payouts'
        ordering = ['-created_at']

    def __str__(self):
        return f"Payout {self.id} - {self.amount} {self.currency}"
