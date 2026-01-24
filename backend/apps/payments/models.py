"""
Payment models for the marketplace.
"""
import uuid
from django.db import models
from django.conf import settings


class PaymentType(models.TextChoices):
    PAYMENT = 'payment', 'Payment'
    REFUND = 'refund', 'Refund'
    PAYOUT = 'payout', 'Payout'


class PaymentGateway(models.TextChoices):
    STRIPE = 'stripe', 'Stripe'
    PAYPAL = 'paypal', 'PayPal'
    FLUTTERWAVE = 'flutterwave', 'Flutterwave'
    RAZORPAY = 'razorpay', 'Razorpay'


class TransactionStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    PROCESSING = 'processing', 'Processing'
    COMPLETED = 'completed', 'Completed'
    FAILED = 'failed', 'Failed'
    CANCELLED = 'cancelled', 'Cancelled'
    REFUNDED = 'refunded', 'Refunded'


class Payment(models.Model):
    """
    Payment transaction model.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(
        'orders.Order',
        on_delete=models.CASCADE,
        related_name='payments'
    )

    type = models.CharField(
        max_length=20,
        choices=PaymentType.choices,
        default=PaymentType.PAYMENT
    )
    gateway = models.CharField(max_length=20, choices=PaymentGateway.choices)
    status = models.CharField(
        max_length=20,
        choices=TransactionStatus.choices,
        default=TransactionStatus.PENDING
    )

    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    fee = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    # Gateway specific
    gateway_transaction_id = models.CharField(max_length=255, blank=True, null=True)
    gateway_payment_intent = models.CharField(max_length=255, blank=True, null=True)
    gateway_customer_id = models.CharField(max_length=255, blank=True, null=True)

    # Card details (masked)
    card_brand = models.CharField(max_length=50, blank=True, null=True)
    card_last4 = models.CharField(max_length=4, blank=True, null=True)
    card_exp_month = models.CharField(max_length=2, blank=True, null=True)
    card_exp_year = models.CharField(max_length=4, blank=True, null=True)

    gateway_response = models.JSONField(blank=True, null=True)
    failure_reason = models.TextField(blank=True, null=True)

    # Metadata
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'payments'
        ordering = ['-created_at']

    def __str__(self):
        return f"Payment {self.id} - {self.amount} {self.currency}"


class PaymentMethod(models.Model):
    """
    Saved payment method model.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='payment_methods'
    )

    gateway = models.CharField(max_length=20, choices=PaymentGateway.choices)
    gateway_customer_id = models.CharField(max_length=255)
    gateway_payment_method_id = models.CharField(max_length=255)

    type = models.CharField(max_length=50)  # card, bank_account, wallet
    brand = models.CharField(max_length=50, blank=True, null=True)
    last4 = models.CharField(max_length=4, blank=True, null=True)
    exp_month = models.CharField(max_length=2, blank=True, null=True)
    exp_year = models.CharField(max_length=4, blank=True, null=True)
    holder_name = models.CharField(max_length=255, blank=True, null=True)

    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payment_methods'
        ordering = ['-is_default', '-created_at']

    def __str__(self):
        return f"{self.brand} ****{self.last4}"
