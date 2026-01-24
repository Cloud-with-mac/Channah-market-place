"""
Admin configuration for Vendor models.
"""
from django.contrib import admin
from .models import Vendor, VendorPayout


@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):
    list_display = ['business_name', 'user', 'status', 'rating', 'total_sales', 'balance', 'created_at']
    list_filter = ['status', 'is_featured', 'country', 'created_at']
    search_fields = ['business_name', 'business_email', 'user__email']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at', 'verified_at']

    fieldsets = (
        (None, {'fields': ('user', 'business_name', 'slug', 'description')}),
        ('Media', {'fields': ('logo_url', 'banner_url')}),
        ('Contact', {'fields': ('business_email', 'business_phone', 'business_address', 'city', 'state', 'country', 'postal_code')}),
        ('Verification', {'fields': ('status', 'tax_id', 'business_registration', 'verified_at')}),
        ('Financial', {'fields': ('commission_rate', 'balance', 'total_earnings', 'total_sales')}),
        ('Bank Details', {'fields': ('bank_name', 'bank_account_name', 'bank_account_number', 'bank_routing_number', 'bank_country')}),
        ('Stripe', {'fields': ('stripe_account_id', 'stripe_onboarding_complete')}),
        ('Ratings', {'fields': ('rating', 'total_reviews')}),
        ('Settings', {'fields': ('is_featured', 'auto_approve_products')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )


@admin.register(VendorPayout)
class VendorPayoutAdmin(admin.ModelAdmin):
    list_display = ['id', 'vendor', 'amount', 'currency', 'status', 'payment_method', 'created_at']
    list_filter = ['status', 'payment_method', 'created_at']
    search_fields = ['vendor__business_name', 'transaction_id']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'processed_at']
