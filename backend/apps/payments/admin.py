"""
Admin configuration for Payment models.
"""
from django.contrib import admin
from .models import Payment, PaymentMethod


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['id', 'order', 'gateway', 'status', 'amount', 'currency', 'created_at']
    list_filter = ['gateway', 'status', 'type', 'created_at']
    search_fields = ['order__order_number', 'gateway_transaction_id']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at', 'completed_at']


@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
    list_display = ['user', 'gateway', 'brand', 'last4', 'is_default', 'created_at']
    list_filter = ['gateway', 'is_default', 'is_active']
    search_fields = ['user__email']
    ordering = ['-created_at']
