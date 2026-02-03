# Channah Email System Documentation

## Overview

Professional HTML email template system for Channah Marketplace built with Jinja2 templating engine.

## Directory Structure

```
backend/
├── app/
│   ├── services/
│   │   └── email.py                    # Email service with Jinja2 rendering
│   ├── templates/
│   │   └── emails/
│   │       ├── base.html               # Base template with header/footer
│   │       ├── welcome.html            # Welcome new users
│   │       ├── password_reset.html     # Password reset
│   │       ├── order_confirmation.html # Order confirmation
│   │       ├── order_shipped.html      # Shipping notification
│   │       ├── order_delivered.html    # Delivery confirmation
│   │       ├── payment_received.html   # Payment receipt
│   │       ├── vendor_new_order.html   # Vendor order notification
│   │       ├── payout_request.html     # Admin payout notification
│   │       ├── payout_approved.html    # Vendor payout approval
│   │       └── README.md               # Template documentation
│   └── api/
│       └── v1/
│           └── endpoints/
│               └── admin.py            # Test email endpoint
```

## Features

### Professional Design
- ✅ Gradient brand header (primary: #3b82f6, secondary: #8b5cf6)
- ✅ Responsive mobile-first layout
- ✅ Email client compatible (Gmail, Outlook, Apple Mail, etc.)
- ✅ Inline CSS for maximum compatibility
- ✅ Table-based layout (no flexbox/grid)
- ✅ Consistent footer with social links

### Email Types

#### Customer Emails
1. **Welcome** - Onboard new users
2. **Password Reset** - Secure password recovery
3. **Order Confirmation** - Order placed successfully
4. **Order Shipped** - Tracking information
5. **Order Delivered** - Request review
6. **Payment Received** - Receipt confirmation

#### Vendor Emails
7. **New Order** - Vendor receives order with earnings breakdown

#### Admin Emails
8. **Payout Request** - Vendor requests withdrawal
9. **Payout Approved** - Confirmation to vendor

## API Reference

### Email Service Functions

Located in `app/services/email.py`:

#### `send_welcome_email(to_email: str, first_name: str) -> bool`
Send welcome email to new users.

**Example:**
```python
from app.services import email

email.send_welcome_email(
    to_email="john@example.com",
    first_name="John"
)
```

#### `send_password_reset_email(to_email: str, first_name: str, reset_token: str) -> bool`
Send password reset link.

**Example:**
```python
email.send_password_reset_email(
    to_email="john@example.com",
    first_name="John",
    reset_token="abc123xyz789"
)
```

#### `send_order_confirmation_email(...) -> bool`
Send order confirmation with full details.

**Parameters:**
- `to_email` (str): Customer email
- `first_name` (str): Customer first name
- `order_number` (str): Order reference
- `items` (List[dict]): Order items
  - `name` (str): Product name
  - `quantity` (int): Quantity ordered
  - `unit_price` (float): Price per unit
  - `variant` (str, optional): Product variant
- `subtotal` (float): Items subtotal
- `shipping` (float): Shipping cost
- `tax` (float): Tax amount
- `total` (float): Total amount
- `shipping_address` (dict): Delivery address
  - `name` (str): Recipient name
  - `street` (str): Street address
  - `apartment` (str, optional): Apt/Suite number
  - `city` (str): City
  - `state` (str): State/Province
  - `zip` (str): ZIP/Postal code
  - `country` (str): Country
  - `phone` (str, optional): Phone number
- `currency` (str): Currency code (default: "USD")
- `estimated_delivery` (str, optional): Delivery estimate
- `order_date` (str, optional): Order date

**Example:**
```python
email.send_order_confirmation_email(
    to_email="john@example.com",
    first_name="John",
    order_number="ORD-2024-001",
    items=[
        {
            "name": "Wireless Headphones",
            "quantity": 1,
            "unit_price": 149.99,
            "variant": "Black"
        }
    ],
    subtotal=149.99,
    shipping=10.00,
    tax=16.00,
    total=175.99,
    shipping_address={
        "name": "John Doe",
        "street": "123 Main St",
        "apartment": "Apt 4B",
        "city": "San Francisco",
        "state": "CA",
        "zip": "94102",
        "country": "United States",
        "phone": "+1 (555) 123-4567"
    },
    estimated_delivery="Jan 15-18, 2024"
)
```

#### `send_order_shipped_email(...) -> bool`
Send shipping notification with tracking.

**Example:**
```python
email.send_order_shipped_email(
    to_email="john@example.com",
    first_name="John",
    order_number="ORD-2024-001",
    items=[{"name": "Headphones", "quantity": 1}],
    shipping_address={...},
    tracking_number="1Z999AA10123456784",
    carrier="UPS",
    tracking_url="https://ups.com/track?num=...",
    estimated_delivery="Jan 15-18, 2024"
)
```

#### `send_order_delivered_email(...) -> bool`
Send delivery confirmation and request review.

**Example:**
```python
email.send_order_delivered_email(
    to_email="john@example.com",
    first_name="John",
    order_number="ORD-2024-001",
    items=[{"name": "Headphones", "quantity": 1}]
)
```

#### `send_payment_received_email(...) -> bool`
Send payment confirmation receipt.

**Example:**
```python
email.send_payment_received_email(
    to_email="john@example.com",
    first_name="John",
    order_number="ORD-2024-001",
    items=[...],
    subtotal=149.99,
    shipping=10.00,
    tax=16.00,
    total=175.99,
    amount=175.99,
    payment_method="Visa •••• 4242",
    transaction_id="ch_1234567890"
)
```

#### `send_vendor_new_order_email(...) -> bool`
Notify vendor of new order with earnings breakdown.

**Example:**
```python
email.send_vendor_new_order_email(
    to_email="vendor@store.com",
    vendor_name="Tech Store",
    order_number="ORD-2024-001",
    customer_name="John Doe",
    customer_email="john@example.com",
    items=[{
        "name": "Headphones",
        "quantity": 1,
        "unit_price": 149.99,
        "sku": "WH-1000-BLK"
    }],
    subtotal=149.99,
    commission=15.00,
    vendor_earnings=134.99,
    commission_percent=10.0,
    shipping_address={...}
)
```

#### `send_payout_request_email(...) -> bool`
Notify admin of vendor payout request.

**Example:**
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
    bank_name="Chase",
    account_number="1234567890"
)
```

#### `send_payout_approved_email(...) -> bool`
Notify vendor of approved payout.

**Example:**
```python
email.send_payout_approved_email(
    to_email="vendor@store.com",
    vendor_name="Tech Store",
    payout_id="payout_456",
    payout_amount=1500.00,
    payment_method="Bank Transfer",
    bank_name="Chase",
    account_number="1234567890"
)
```

## Testing Emails

### Admin Test Endpoint

**Endpoint:** `POST /api/v1/admin/test-email`

**Authentication:** Admin only (Bearer token)

**Request Body:**
```json
{
  "email_type": "order_confirmation",
  "recipient_email": "test@example.com"
}
```

**Available Email Types:**
- `welcome`
- `password_reset`
- `order_confirmation`
- `order_shipped`
- `order_delivered`
- `payment_received`
- `vendor_new_order`
- `payout_request`
- `payout_approved`

**Response:**
```json
{
  "message": "Test email 'order_confirmation' sent successfully to test@example.com"
}
```

### cURL Example

```bash
# Login as admin first
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Send test email
curl -X POST http://localhost:8000/api/v1/admin/test-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"email_type":"welcome","recipient_email":"test@example.com"}'
```

## Configuration

### Environment Variables

Set these in `.env` file:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@channah.com

# App URLs (for email links)
ALLOWED_ORIGINS=["http://localhost:3000","http://localhost:3001","http://localhost:3002"]
```

### Gmail Setup

1. Enable 2-Step Verification
2. Generate App Password:
   - Go to Google Account → Security
   - Select "App passwords"
   - Generate password for "Mail"
   - Use generated password as `SMTP_PASSWORD`

### Development Mode

If SMTP is not configured, emails are logged to console:

```python
logger.info("Email would be sent to=%s subject=%s", to_email, subject)
logger.debug("Email body:\n%s", html_body)
```

## Integration Examples

### User Registration

```python
from app.services import email

@router.post("/auth/register")
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    # Create user...
    user = create_user(db, user_data)

    # Send welcome email
    email.send_welcome_email(
        to_email=user.email,
        first_name=user.first_name
    )

    return {"message": "Registration successful"}
```

### Order Processing

```python
from app.services import email

@router.post("/orders")
async def create_order(order_data: OrderCreate, db: AsyncSession = Depends(get_db)):
    # Create order...
    order = create_order(db, order_data)

    # Send confirmation to customer
    email.send_order_confirmation_email(
        to_email=order.customer.email,
        first_name=order.customer.first_name,
        order_number=order.order_number,
        items=format_order_items(order.items),
        subtotal=order.subtotal,
        shipping=order.shipping,
        tax=order.tax,
        total=order.total,
        shipping_address=format_address(order.shipping_address)
    )

    # Notify vendors
    for vendor_order in group_by_vendor(order.items):
        email.send_vendor_new_order_email(
            to_email=vendor_order.vendor.email,
            vendor_name=vendor_order.vendor.business_name,
            order_number=order.order_number,
            customer_name=order.customer.full_name,
            items=format_order_items(vendor_order.items),
            subtotal=vendor_order.subtotal,
            commission=calculate_commission(vendor_order),
            vendor_earnings=vendor_order.subtotal - calculate_commission(vendor_order),
            shipping_address=format_address(order.shipping_address)
        )

    return order
```

### Order Shipping

```python
@router.put("/vendor/orders/{order_id}/ship")
async def ship_order(
    order_id: str,
    tracking: TrackingInfo,
    db: AsyncSession = Depends(get_db)
):
    # Update order status...
    order.status = OrderStatus.SHIPPED
    order.tracking_number = tracking.number

    # Send shipping notification
    email.send_order_shipped_email(
        to_email=order.customer.email,
        first_name=order.customer.first_name,
        order_number=order.order_number,
        items=format_order_items(order.items),
        shipping_address=format_address(order.shipping_address),
        tracking_number=tracking.number,
        carrier=tracking.carrier,
        tracking_url=tracking.url
    )

    return order
```

## Customization

### Brand Colors

Edit `backend/app/templates/emails/base.html`:

```css
:root {
    --primary-color: #3b82f6;      /* Change to your brand color */
    --secondary-color: #8b5cf6;    /* Change to secondary color */
}
```

### Logo

Replace text logo with image in `base.html`:

```html
<div class="email-header">
    <img src="https://yourdomain.com/logo.png" alt="Channah" width="150">
    <p>Your Trusted Marketplace</p>
</div>
```

### Footer Links

Update social and footer links in `base.html`:

```html
<div class="social-links">
    <a href="https://facebook.com/yourpage">Facebook</a> |
    <a href="https://twitter.com/yourhandle">Twitter</a> |
    <a href="https://instagram.com/yourhandle">Instagram</a>
</div>
```

## Troubleshooting

### Emails Not Sending

1. **Check SMTP credentials:**
   ```bash
   # Verify .env file has correct SMTP settings
   cat .env | grep SMTP
   ```

2. **Check server logs:**
   ```bash
   # Look for email-related errors
   tail -f logs/app.log | grep email
   ```

3. **Test SMTP connection:**
   ```python
   import smtplib
   server = smtplib.SMTP('smtp.gmail.com', 587)
   server.starttls()
   server.login('your-email', 'your-password')
   ```

### Template Rendering Issues

1. **Verify Jinja2 installed:**
   ```bash
   pip list | grep Jinja2
   ```

2. **Check template paths:**
   ```bash
   ls backend/app/templates/emails/
   ```

3. **Test template rendering:**
   ```python
   from app.services.email import render_template
   html = render_template('welcome.html', {'first_name': 'Test'})
   print(html)
   ```

### Email Display Issues

1. **Test in multiple clients:**
   - Gmail (web and mobile)
   - Outlook (desktop and web)
   - Apple Mail

2. **Use email testing tools:**
   - [Litmus](https://litmus.com)
   - [Email on Acid](https://www.emailonacid.com)
   - [Mail Tester](https://www.mail-tester.com)

3. **Validate HTML:**
   - Use online validators
   - Check inline CSS
   - Verify table structure

## Best Practices

1. **Personalization:** Always use recipient's name
2. **Clear CTAs:** One primary action per email
3. **Mobile-first:** Test on mobile devices
4. **Plain text:** Provide text alternative
5. **Unsubscribe:** Include opt-out link (for marketing)
6. **Testing:** Test before deploying to production
7. **Monitoring:** Track delivery and open rates
8. **Security:** Never include sensitive data in plain text

## Next Steps

- [ ] Set up email analytics (open rates, clicks)
- [ ] Add email queue for high-volume sending
- [ ] Implement email preferences for users
- [ ] Create marketing email templates
- [ ] Add multi-language support
- [ ] Set up email verification tracking
- [ ] Add retry logic for failed sends
- [ ] Implement rate limiting

## Support

For issues or questions:
- Check server logs: `tail -f logs/app.log`
- Review template documentation: `backend/app/templates/emails/README.md`
- Test with admin endpoint: `POST /api/v1/admin/test-email`
