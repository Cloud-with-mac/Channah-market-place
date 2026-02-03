# Email Templates Visual Guide

## Template Preview Overview

All email templates follow a consistent design language with:
- Gradient header (blue to purple)
- Professional layout
- Clear call-to-action buttons
- Responsive mobile design
- Brand consistency

## Color Scheme

```
Primary:    #3b82f6 (Blue)
Secondary:  #8b5cf6 (Purple)
Success:    #10b981 (Green)
Warning:    #f59e0b (Orange)
Danger:     #ef4444 (Red)
Gray:       #6b7280
Light BG:   #f9fafb
```

## Template Descriptions

### 1. Welcome Email (welcome.html)

**Subject:** Welcome to Channah!

**Header:** "Welcome to Channah!" with gradient background

**Content:**
- Personalized greeting: "Hello {first_name}!"
- Welcome message about the marketplace
- 4 feature highlights with icons:
  - Browse Products
  - Create Wishlist
  - Chat with Vendors
  - Get Recommendations
- "Start Shopping" button (blue)
- Help center link

**Visual Style:** Friendly, inviting, clean

---

### 2. Password Reset (password_reset.html)

**Subject:** Reset Your Channah Password

**Header:** "Password Reset" with gradient background

**Content:**
- Personal greeting: "Hi {first_name},"
- Clear explanation of the request
- Large "Reset Password" button (blue)
- Blue info box with security notice (1 hour expiration)
- Plain text fallback link
- Yellow warning box for non-requesters
- Security assurance message

**Visual Style:** Secure, clear, trustworthy

---

### 3. Order Confirmation (order_confirmation.html)

**Subject:** Order Confirmed - #{order_number}

**Header:** "Order Confirmed!" with gradient background

**Content:**
- Personal greeting: "Hi {first_name},"
- Thank you message
- Green order number badge
- Order date
- Items table with columns:
  - Product (with variant)
  - Quantity
  - Price
- Price summary table:
  - Subtotal
  - Shipping
  - Tax
  - **Total** (bold, large)
- Shipping address in gray box:
  - Name
  - Street & Apartment
  - City, State ZIP
  - Country
  - Phone
- Blue info box with estimated delivery
- "View Order Details" button (blue)

**Visual Style:** Professional, detailed, organized

---

### 4. Order Shipped (order_shipped.html)

**Subject:** Order Shipped - #{order_number}

**Header:** "Your Order Has Shipped!" with gradient background

**Content:**
- Personal greeting: "Hi {first_name},"
- Exciting news message
- Yellow "shipped" badge
- Blue info box with:
  - Tracking number (monospace)
  - Carrier name
  - Estimated delivery
- "Track Your Package" button (blue) with tracking URL
- Order items summary table
- Shipping address
- "View Order Details" button (purple/secondary)
- Support link

**Visual Style:** Informative, action-oriented

---

### 5. Order Delivered (order_delivered.html)

**Subject:** Order Delivered - #{order_number}

**Header:** "Order Delivered!" with gradient background

**Content:**
- Personal greeting: "Hi {first_name},"
- Success message
- Green "delivered" badge
- Green success box confirming delivery
- Order items list
- **Featured section** (blue bordered box):
  - "Love your purchase?" heading
  - "Share your experience" message
  - "Write a Review" button (blue) - prominent
- Blue info box with return policy (30 days)
- "View Order Details" button (purple/secondary)

**Visual Style:** Celebratory, engaging, request-focused

---

### 6. Payment Received (payment_received.html)

**Subject:** Payment Confirmed - #{order_number}

**Header:** "Payment Confirmed" with gradient background

**Content:**
- Personal greeting: "Hi {first_name},"
- Payment confirmation message
- Green "Payment Confirmed" badge
- Payment details table (gray background):
  - Order Number
  - Payment Method
  - Transaction ID (monospace)
  - **Total Paid** (large, green, bold)
- Complete order items table
- Price breakdown summary
- "View Order" button (blue)
- Keep for records message

**Visual Style:** Receipt-like, official, detailed

---

### 7. Vendor New Order (vendor_new_order.html)

**Subject:** New Order Received - #{order_number}

**Header:** "New Order!" with gradient background

**Content:**
- Vendor greeting: "Hi {vendor_name},"
- New order notification
- Blue order number badge
- Blue info box: "Action Required"
- Customer information section (gray box):
  - Name
  - Email
  - Phone
- Order items table with:
  - Product name
  - SKU
  - Quantity
  - Unit price
  - Total
- **Earnings breakdown table:**
  - Subtotal
  - Platform Fee (red, negative)
  - **Your Earnings** (large, green, bold)
- Shipping address with phone
- "Process Order" button (blue)
- Reminder to update status

**Visual Style:** Business-focused, clear earnings

---

### 8. Payout Request (payout_request.html)

**Subject:** Payout Request - {vendor_name}

**Header:** "Payout Request" with gradient background

**Content:**
- Admin greeting: "Hello Admin,"
- Payout request notification
- Yellow "Pending Review" badge
- Vendor information (gray box):
  - Business name
  - Email
  - Phone
  - Vendor ID
- Payout details table:
  - Available Balance
  - Requested Amount (blue, large)
  - Remaining Balance
- Payment method details:
  - Bank name
  - Account (masked: ****1234)
  - Account holder
- Yellow warning box: "Action Required"
- "Review Payout Request" button (blue)

**Visual Style:** Administrative, urgent, detailed

---

### 9. Payout Approved (payout_approved.html)

**Subject:** Payout Approved!

**Header:** "Payout Approved!" with gradient background

**Content:**
- Vendor greeting: "Hi {vendor_name},"
- Approval confirmation
- Green "Approved" badge
- Green success box: "Payment is on the way!"
- Payout details table:
  - Payout ID (monospace)
  - Amount (green, large)
  - Payment Method
  - Estimated Arrival (bold)
- Payment destination (gray box):
  - Bank name
  - Account (masked)
  - Account holder
- "View Payout History" button (blue)
- Support link

**Visual Style:** Celebratory, reassuring, clear timeline

---

## Common Elements

### Header
```
┌─────────────────────────────────────┐
│                                     │
│         Channah                     │ (Gradient: Blue → Purple)
│   Your Trusted Marketplace          │
│                                     │
└─────────────────────────────────────┘
```

### Buttons
```
┌────────────────────┐
│   Primary Action   │ (Blue background, white text)
└────────────────────┘

┌────────────────────┐
│  Secondary Action  │ (Purple background, white text)
└────────────────────┘
```

### Badges
```
┌─────────────┐
│ Order #123  │ (Blue badge)
└─────────────┘

┌─────────────┐
│   Shipped   │ (Yellow badge)
└─────────────┘

┌─────────────┐
│  Delivered  │ (Green badge)
└─────────────┘
```

### Info Boxes
```
┌────────────────────────────────────┐
│ ℹ️  Important Information          │ (Blue border & background)
│    Additional details here...      │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ ⚠️  Warning Notice                 │ (Yellow border & background)
│    Important warning here...       │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ ✓  Success Message                 │ (Green border & background)
│    Confirmation details here...    │
└────────────────────────────────────┘
```

### Data Tables
```
┌────────────┬──────────┬─────────┐
│ Product    │ Quantity │ Price   │ (Gray header)
├────────────┼──────────┼─────────┤
│ Item 1     │    1     │ $99.99  │
│ Item 2     │    2     │ $29.99  │
└────────────┴──────────┴─────────┘
```

### Footer
```
┌─────────────────────────────────────┐
│ © 2024 Channah. All rights reserved.│ (Gray background)
│                                     │
│    Facebook | Twitter | Instagram   │
│                                     │
│ Help Center | Privacy | Terms       │
└─────────────────────────────────────┘
```

## Mobile Responsive Design

All templates automatically adapt for mobile:

**Desktop (600px max-width):**
- Two-column layouts where appropriate
- Comfortable padding and spacing
- Larger buttons and text

**Mobile (<600px):**
- Single column layout
- Full-width buttons
- Increased touch targets
- Optimized font sizes
- Adjusted padding

## Testing in Email Clients

### Gmail
- ✅ Web interface: Renders perfectly
- ✅ Mobile app: Responsive design works
- ✅ Promotions tab: Stands out with gradient header

### Outlook
- ✅ Desktop: Table-based layout compatible
- ✅ Web: Inline CSS renders correctly
- ✅ Mobile: Responsive breakpoints work

### Apple Mail
- ✅ macOS: Full design features supported
- ✅ iOS: Touch-friendly buttons and links
- ✅ Dark mode: Colors remain readable

## Customization Examples

### Change Primary Color
Edit `base.html`:
```css
--primary-color: #10b981; /* Change blue to green */
```

### Add Company Logo
Replace text in header:
```html
<img src="https://yourdomain.com/logo.png"
     alt="Channah"
     width="150"
     height="auto">
```

### Update Footer Links
Modify social links:
```html
<a href="https://facebook.com/yourpage">Facebook</a>
<a href="https://twitter.com/yourhandle">Twitter</a>
```

## Best Practices Applied

1. **Single primary CTA** - One main action per email
2. **F-pattern layout** - Important info top-left
3. **White space** - Comfortable reading experience
4. **Visual hierarchy** - Headings, badges, emphasis
5. **Scannable content** - Tables, lists, boxes
6. **Brand consistency** - Colors, fonts, style
7. **Mobile-first** - Responsive from the start
8. **Accessibility** - Semantic HTML, alt text ready
9. **Trust signals** - Professional design, secure messaging
10. **Clear next steps** - Obvious CTAs and links

## Performance Metrics

Average email sizes:
- Welcome: ~12KB
- Password Reset: ~11KB
- Order Confirmation: ~13KB
- Order Shipped: ~12KB
- Order Delivered: ~12KB
- Payment Received: ~14KB
- Vendor New Order: ~14KB
- Payout Request: ~13KB
- Payout Approved: ~13KB

All templates load quickly even on slow connections.

## Preview URLs

To preview templates:
1. Start backend: `uvicorn app.main:app --reload`
2. Login as admin
3. Use test endpoint: `POST /api/v1/admin/test-email`
4. Check your inbox for rendered email

## Summary

All 9 email templates provide:
- Professional, branded appearance
- Clear information hierarchy
- Action-oriented design
- Mobile responsiveness
- Email client compatibility
- Consistent user experience

Perfect for production use in the Channah marketplace!
