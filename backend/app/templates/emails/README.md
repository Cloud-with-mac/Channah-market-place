# Channah Email Templates

Professional HTML email templates for the Channah Marketplace using Jinja2 templating.

## Template Structure

All templates extend `base.html` which provides:
- Professional header with gradient branding
- Responsive layout (mobile-friendly)
- Consistent footer with social links
- Brand colors (primary: #3b82f6, secondary: #8b5cf6)
- Email-client compatible CSS (inline and table-based layout)

## Available Templates

### Customer Templates

1. **welcome.html** - Welcome new users
   - Highlights key features
   - Call-to-action button to start shopping
   - Friendly onboarding message

2. **password_reset.html** - Password reset requests
   - Secure reset link with expiration notice
   - Clear security warning
   - Plain text fallback link

3. **order_confirmation.html** - Order placed confirmation
   - Complete order details with itemized list
   - Shipping address
   - Price breakdown (subtotal, shipping, tax, total)
   - Estimated delivery date
   - View order button

4. **order_shipped.html** - Order shipped notification
   - Tracking number and carrier information
   - Tracking link button
   - Order items summary
   - Shipping address
   - Estimated delivery

5. **order_delivered.html** - Delivery confirmation
   - Success message
   - Request for product review
   - Return policy information
   - Order items list

6. **payment_received.html** - Payment confirmation receipt
   - Payment details (method, transaction ID)
   - Complete order summary
   - Price breakdown
   - Receipt for records

### Vendor Templates

7. **vendor_new_order.html** - New order notification for vendors
   - Customer information
   - Order items with SKU
   - Earnings calculation (after commission)
   - Commission breakdown
   - Shipping address
   - Action button to process order

### Admin Templates

8. **payout_request.html** - Vendor payout request notification
   - Vendor information
   - Payout amount and balance
   - Payment method details
   - Action required notice
   - Link to admin dashboard

9. **payout_approved.html** - Payout approval confirmation
   - Approval confirmation
   - Payout details
   - Estimated arrival time
   - Payment destination

## Template Variables

### Common Variables (auto-populated)
- `current_year` - Current year for copyright
- `app_url` - Customer app URL (from settings.ALLOWED_ORIGINS[0])
- `admin_url` - Admin dashboard URL (from settings.ALLOWED_ORIGINS[1])
- `vendor_url` - Vendor portal URL (from settings.ALLOWED_ORIGINS[2])

### Template-Specific Variables

See individual template files for required context variables. Each template has a corresponding function in `app/services/email.py`.

## Usage in Code

```python
from app.services import email

# Send welcome email
email.send_welcome_email(
    to_email="user@example.com",
    first_name="John"
)

# Send order confirmation
email.send_order_confirmation_email(
    to_email="customer@example.com",
    first_name="John",
    order_number="ORD-2024-001",
    items=[...],
    subtotal=100.00,
    shipping=10.00,
    tax=11.00,
    total=121.00,
    shipping_address={...}
)
```

## Testing Emails

Use the admin test endpoint to preview emails:

```bash
POST /api/v1/admin/test-email
{
  "email_type": "order_confirmation",
  "recipient_email": "test@example.com"
}
```

Available test email types:
- `welcome`
- `password_reset`
- `order_confirmation`
- `order_shipped`
- `order_delivered`
- `payment_received`
- `vendor_new_order`
- `payout_request`
- `payout_approved`

## Customization

### Brand Colors
Edit `base.html` CSS variables:
```css
--primary-color: #3b82f6;      /* Main brand color */
--secondary-color: #8b5cf6;    /* Secondary accent */
--success-color: #10b981;      /* Success states */
--warning-color: #f59e0b;      /* Warnings */
```

### Header/Footer
Modify the header and footer sections in `base.html`:
- Update company name
- Change tagline
- Add logo image
- Update social media links
- Modify footer links

### Logo
Replace the text logo with an image:
```html
<img src="https://yourdomain.com/logo.png" alt="Channah" width="150">
```

## Email Client Compatibility

Templates are designed for maximum compatibility:
- ✅ Gmail (Web, iOS, Android)
- ✅ Outlook (Desktop, Web, Mobile)
- ✅ Apple Mail (macOS, iOS)
- ✅ Yahoo Mail
- ✅ ProtonMail
- ✅ Thunderbird
- ✅ Mobile email clients

### Compatibility Features
- Table-based layout (not flexbox/grid)
- Inline CSS for critical styles
- No external stylesheets
- No JavaScript
- Web-safe fonts with fallbacks
- Mobile-responsive using media queries
- Alt text for images
- Plain text fallback

## Best Practices

1. **Keep it concise** - Users scan emails quickly
2. **Clear CTAs** - One primary action per email
3. **Mobile-first** - Most emails are opened on mobile
4. **Test thoroughly** - Use real email clients for testing
5. **Accessible** - Include alt text and semantic HTML
6. **Personalization** - Use recipient's name and relevant data
7. **Unsubscribe link** - Required for transactional emails
8. **Track metrics** - Monitor open rates and click-through rates

## SMTP Configuration

Configure SMTP in `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@channah.com
```

If SMTP is not configured, emails will be logged to console for development.

## Troubleshooting

### Emails not sending
1. Check SMTP credentials in `.env`
2. Enable "Less secure app access" for Gmail (or use App Password)
3. Check server logs for SMTP errors
4. Verify firewall allows SMTP port (587)

### Templates not rendering
1. Verify Jinja2 is installed: `pip install jinja2`
2. Check template file paths
3. Review server logs for template errors
4. Ensure context variables match template requirements

### Styling issues
1. Test in multiple email clients
2. Use inline CSS for critical styles
3. Avoid flexbox/grid layouts
4. Keep table structure for layout
5. Test responsive design on mobile devices

## Future Enhancements

- [ ] Email preview in admin dashboard
- [ ] A/B testing capabilities
- [ ] Email analytics (open rates, clicks)
- [ ] Template versioning
- [ ] Multi-language support
- [ ] Custom template editor in admin
- [ ] Scheduled email campaigns
- [ ] Email templates for marketing
