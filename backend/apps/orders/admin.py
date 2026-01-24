"""
Admin configuration for Order models.
"""
from django.contrib import admin
from .models import Order, OrderItem, OrderStatusHistory


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['product_name', 'product_sku', 'quantity', 'unit_price', 'total', 'commission_amount', 'vendor_amount']


class OrderStatusHistoryInline(admin.TabularInline):
    model = OrderStatusHistory
    extra = 0
    readonly_fields = ['status', 'notes', 'changed_by', 'created_at']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'user', 'status', 'payment_status', 'total', 'created_at']
    list_filter = ['status', 'payment_status', 'is_flagged', 'created_at']
    search_fields = ['order_number', 'user__email', 'shipping_email']
    ordering = ['-created_at']
    readonly_fields = ['order_number', 'created_at', 'updated_at', 'paid_at', 'shipped_at', 'delivered_at', 'cancelled_at']
    inlines = [OrderItemInline, OrderStatusHistoryInline]

    fieldsets = (
        (None, {'fields': ('order_number', 'user', 'status', 'payment_status')}),
        ('Pricing', {'fields': ('subtotal', 'tax_amount', 'shipping_amount', 'discount_amount', 'total', 'currency', 'coupon_code')}),
        ('Shipping Address', {'fields': ('shipping_first_name', 'shipping_last_name', 'shipping_email', 'shipping_phone', 'shipping_address_line1', 'shipping_address_line2', 'shipping_city', 'shipping_state', 'shipping_postal_code', 'shipping_country')}),
        ('Shipping Details', {'fields': ('shipping_method', 'tracking_number', 'carrier', 'estimated_delivery')}),
        ('Payment', {'fields': ('payment_method', 'payment_intent_id', 'transaction_id')}),
        ('Notes', {'fields': ('customer_notes', 'admin_notes')}),
        ('Fraud Detection', {'fields': ('fraud_score', 'fraud_flags', 'is_flagged')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at', 'paid_at', 'shipped_at', 'delivered_at', 'cancelled_at')}),
    )
