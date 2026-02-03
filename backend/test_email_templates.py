"""
Quick test script to verify email templates are working correctly.
Run from backend directory: python test_email_templates.py
"""

import sys
from pathlib import Path

# Add app to path
sys.path.insert(0, str(Path(__file__).parent))

from jinja2 import Environment, FileSystemLoader, select_autoescape

def test_templates():
    """Test that all email templates can be loaded and rendered"""

    templates_dir = Path(__file__).parent / "app" / "templates" / "emails"

    print(f"Templates directory: {templates_dir}")
    print(f"Templates directory exists: {templates_dir.exists()}")
    print()

    # Initialize Jinja2
    env = Environment(
        loader=FileSystemLoader(str(templates_dir)),
        autoescape=select_autoescape(['html', 'xml'])
    )

    # List of templates to test
    templates = [
        'welcome.html',
        'password_reset.html',
        'order_confirmation.html',
        'order_shipped.html',
        'order_delivered.html',
        'payment_received.html',
        'vendor_new_order.html',
        'payout_request.html',
        'payout_approved.html',
    ]

    print("Testing email templates...")
    print("-" * 60)

    for template_name in templates:
        try:
            template = env.get_template(template_name)

            # Test with minimal context
            context = {
                'first_name': 'Test User',
                'vendor_name': 'Test Vendor',
                'order_number': 'ORD-TEST-001',
                'order_date': 'January 1, 2024',
                'items': [
                    {
                        'name': 'Test Product',
                        'quantity': 1,
                        'unit_price': 99.99,
                        'variant': 'Blue'
                    }
                ],
                'subtotal': 99.99,
                'shipping': 10.00,
                'tax': 11.00,
                'total': 120.99,
                'currency': 'USD',
                'shipping_address': {
                    'name': 'Test User',
                    'street': '123 Test St',
                    'apartment': 'Apt 1',
                    'city': 'Test City',
                    'state': 'TS',
                    'zip': '12345',
                    'country': 'Test Country',
                    'phone': '+1 555-1234'
                },
                'reset_url': 'https://example.com/reset',
                'tracking_number': '1Z999AA10123456784',
                'carrier': 'UPS',
                'tracking_url': 'https://ups.com/track',
                'estimated_delivery': 'Jan 15-18',
                'delivered_date': 'January 15, 2024',
                'shipped_date': 'January 12, 2024',
                'payment_method': 'Visa •••• 4242',
                'transaction_id': 'ch_123456',
                'amount': 120.99,
                'payment_date': 'January 1, 2024',
                'customer_name': 'Test Customer',
                'customer_email': 'customer@example.com',
                'customer_phone': '+1 555-5678',
                'commission': 10.00,
                'vendor_earnings': 89.99,
                'commission_percent': 10.0,
                'vendor_email': 'vendor@example.com',
                'vendor_id': 'vendor_123',
                'vendor_phone': '+1 555-9876',
                'payout_id': 'payout_456',
                'payout_amount': 1500.00,
                'available_balance': 2000.00,
                'bank_name': 'Test Bank',
                'account_number': '1234567890',
                'account_holder': 'Test Holder',
                'estimated_arrival': '3-5 business days',
                'approval_date': 'January 1, 2024',
                'request_date': 'January 1, 2024',
                'current_year': 2024,
                'app_url': 'http://localhost:3000',
                'admin_url': 'http://localhost:3001',
                'vendor_url': 'http://localhost:3002',
            }

            # Render template
            html = template.render(**context)

            # Check that HTML was generated
            if len(html) > 100 and '<html' in html.lower():
                print(f"[OK] {template_name:<30} - Success ({len(html):,} bytes)")
            else:
                print(f"[WARN] {template_name:<30} - WARNING: Short output ({len(html)} bytes)")

        except Exception as e:
            print(f"[ERROR] {template_name:<30} - ERROR: {str(e)}")

    print("-" * 60)
    print("\nTemplate testing complete!")

if __name__ == "__main__":
    try:
        test_templates()
    except Exception as e:
        print(f"Fatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
