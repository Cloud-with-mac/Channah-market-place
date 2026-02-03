# Email Service Quick Reference

## Import
```python
from app.services import email
```

## Customer Emails

### Welcome Email
```python
email.send_welcome_email(
    to_email="user@example.com",
    first_name="John"
)
```

### Password Reset
```python
email.send_password_reset_email(
    to_email="user@example.com",
    first_name="John",
    reset_token="abc123"
)
```

### Order Confirmation
```python
email.send_order_confirmation_email(
    to_email="customer@example.com",
    first_name="John",
    order_number="ORD-001",
    items=[
        {
            "name": "Product Name",
            "quantity": 1,
            "unit_price": 99.99,
            "variant": "Blue"  # optional
        }
    ],
    subtotal=99.99,
    shipping=10.00,
    tax=11.00,
    total=120.99,
    shipping_address={
        "name": "John Doe",
        "street": "123 Main St",
        "apartment": "Apt 4B",  # optional
        "city": "San Francisco",
        "state": "CA",
        "zip": "94102",
        "country": "United States",
        "phone": "+1 555-1234"  # optional
    },
    estimated_delivery="Jan 15-18"  # optional
)
```

### Order Shipped
```python
email.send_order_shipped_email(
    to_email="customer@example.com",
    first_name="John",
    order_number="ORD-001",
    items=[{"name": "Product", "quantity": 1, "variant": "Blue"}],
    shipping_address={...},  # same as confirmation
    tracking_number="1Z999AA10123456784",
    carrier="UPS",
    tracking_url="https://ups.com/track?num=...",  # optional
    estimated_delivery="Jan 15-18"  # optional
)
```

### Order Delivered
```python
email.send_order_delivered_email(
    to_email="customer@example.com",
    first_name="John",
    order_number="ORD-001",
    items=[{"name": "Product", "quantity": 1}]
)
```

### Payment Received
```python
email.send_payment_received_email(
    to_email="customer@example.com",
    first_name="John",
    order_number="ORD-001",
    items=[{
        "name": "Product",
        "quantity": 1,
        "unit_price": 99.99,
        "variant": "Blue"  # optional
    }],
    subtotal=99.99,
    shipping=10.00,
    tax=11.00,
    total=120.99,
    amount=120.99,
    payment_method="Visa •••• 4242",
    transaction_id="ch_123456",  # optional
    currency="USD"  # default
)
```

## Vendor Emails

### New Order Notification
```python
email.send_vendor_new_order_email(
    to_email="vendor@store.com",
    vendor_name="Tech Store",
    order_number="ORD-001",
    customer_name="John Doe",
    customer_email="john@example.com",  # optional
    customer_phone="+1 555-1234",  # optional
    items=[
        {
            "name": "Product Name",
            "quantity": 1,
            "unit_price": 99.99,
            "variant": "Blue",  # optional
            "sku": "PROD-001"  # optional
        }
    ],
    subtotal=99.99,
    commission=10.00,
    vendor_earnings=89.99,
    commission_percent=10.0,
    shipping_address={...}
)
```

## Admin Emails

### Payout Request (to admin)
```python
email.send_payout_request_email(
    to_email="admin@channah.com",
    vendor_name="Tech Store",
    vendor_email="vendor@store.com",
    vendor_id="vendor_123",
    payout_id="payout_456",
    payout_amount=1500.00,
    available_balance=2000.00,
    payment_method="Bank Transfer",
    vendor_phone="+1 555-9876",  # optional
    bank_name="Chase",  # optional
    account_number="1234567890",  # optional
    account_holder="Tech Store LLC"  # optional
)
```

### Payout Approved (to vendor)
```python
email.send_payout_approved_email(
    to_email="vendor@store.com",
    vendor_name="Tech Store",
    payout_id="payout_456",
    payout_amount=1500.00,
    payment_method="Bank Transfer",
    bank_name="Chase",  # optional
    account_number="1234567890",  # optional
    account_holder="Tech Store LLC",  # optional
    estimated_arrival="3-5 business days"  # optional
)
```

## Testing

### Send Test Email (Admin Endpoint)
```bash
POST /api/v1/admin/test-email
Authorization: Bearer <admin_token>

{
  "email_type": "welcome",
  "recipient_email": "test@example.com"
}
```

**Available types:**
- `welcome`
- `password_reset`
- `order_confirmation`
- `order_shipped`
- `order_delivered`
- `payment_received`
- `vendor_new_order`
- `payout_request`
- `payout_approved`

## Configuration

**.env file:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@channah.com
```

## Common Patterns

### Order Creation
```python
# After creating order
email.send_order_confirmation_email(...)
email.send_vendor_new_order_email(...)  # for each vendor
```

### Order Status Updates
```python
# When shipped
email.send_order_shipped_email(...)

# When delivered
email.send_order_delivered_email(...)
```

### Payment Processing
```python
# After payment success
email.send_payment_received_email(...)
```

### Payout Workflow
```python
# Vendor requests payout
email.send_payout_request_email(...)  # to admin

# Admin approves payout
email.send_payout_approved_email(...)  # to vendor
```

## Return Values

All functions return `bool`:
- `True` - Email sent successfully
- `False` - SMTP not configured (email logged to console)

## Error Handling

```python
try:
    success = email.send_welcome_email(to_email, first_name)
    if not success:
        logger.warning("Email not sent (SMTP not configured)")
except Exception as e:
    logger.error(f"Failed to send email: {e}")
```
