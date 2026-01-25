# Customer-Vendor Messaging System - Demo Guide

## Overview
A professional messaging system that allows customers to contact vendors they've purchased from. This is for order-related inquiries and customer support.

---

## 🎯 What's Been Implemented

### Backend (✅ Complete)
- ✅ Database models for chats and messages
- ✅ REST API endpoints for all chat operations
- ✅ Security: Customers can only message vendors they've ordered from
- ✅ Message history and read receipts
- ✅ Vendor filtering based on purchase history

### Frontend (✅ Complete)
- ✅ Messages list page (`/account/messages`)
- ✅ Individual chat page (`/account/messages/[chatId]`)
- ✅ Contact Vendor button component
- ✅ Professional, modern UI (Blue/Purple theme)
- ✅ Real-time UI updates
- ✅ Responsive design

### Pending
- ⏳ WebSocket for real-time messaging
- ⏳ Voice calls with WebRTC
- ⏳ Video calls with WebRTC
- ⏳ File/image sharing
- ⏳ Emoji picker

---

## 🚀 How to Test

### Prerequisites

1. **Backend Running**:
   ```bash
   cd backend
   python main.py
   ```

2. **Frontend Running**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Database Setup**:
   ```bash
   cd backend
   # Run migrations to create new tables
   alembic revision --autogenerate -m "Add customer vendor chat"
   alembic upgrade head
   ```

4. **Test Data Required**:
   - At least 1 customer account
   - At least 1 vendor account
   - At least 1 order from customer to vendor

---

## 📋 Test Scenarios

### Scenario 1: Customer Starts New Conversation

**Steps**:
1. Log in as a **customer** who has placed orders
2. Navigate to `/account/messages`
3. Click **"New Message"** button
4. Select a vendor from dropdown (only shows vendors customer ordered from)
5. Enter subject: "Question about my order"
6. Enter message: "Hello, I have a question about my recent purchase"
7. Click **"Send Message"**

**Expected Result**:
- Chat is created successfully
- Redirected to chat page
- Message appears in chat
- Message shows as "unread" for vendor

### Scenario 2: Send Messages in Existing Chat

**Steps**:
1. Open an existing chat from `/account/messages`
2. Type a message in the input field at bottom
3. Click Send button (or press Enter)

**Expected Result**:
- Message appears instantly in chat
- Message timestamp shows
- Message is saved to database
- Vendor will see unread indicator

### Scenario 3: Vendor Responds to Customer

**Steps**:
1. Log in as the **vendor**
2. Navigate to `/account/messages` (vendor dashboard)
3. See customer's chat with unread badge
4. Click on chat to open
5. Type response and send

**Expected Result**:
- Vendor sees customer's messages
- Can send replies
- Customer sees vendor's response
- Chat updates in real-time (with refresh)

### Scenario 4: Contact Vendor from Order Page

**Steps**:
1. Go to order details page
2. Add the ContactVendorButton component:
   ```tsx
   import { ContactVendorButton } from '@/components/customer/contact-vendor-button'

   <ContactVendorButton
     vendorId={order.vendor_id}
     vendorName={order.vendor_name}
     orderId={order.id}
     orderNumber={order.order_number}
   />
   ```
3. Click "Contact Vendor" button
4. Dialog opens with order pre-filled
5. Enter message and send

**Expected Result**:
- Quick access to contact vendor
- Order context automatically included
- Redirects to chat after sending

---

## 🎨 UI Features

### Messages List Page
- **Search**: Filter conversations by vendor name or message content
- **New Message Button**: Start conversation with any vendor you've ordered from
- **Unread Indicators**: Blue badge for new messages
- **Status Badges**: "Resolved" status indicator
- **Time Stamps**: Relative time ("2h ago", "Yesterday")

### Chat Page
- **Header**: Vendor name, subject, action buttons
- **Voice Call Button**: Placeholder (ready for WebRTC)
- **Video Call Button**: Placeholder (ready for WebRTC)
- **Messages**: Chat bubble design, grouped by date
- **Date Dividers**: "Today", "Yesterday", or date
- **Message Input**: Rich text input with file/emoji buttons (placeholders)
- **Auto-scroll**: Automatically scrolls to latest message

### Contact Vendor Button
- **Reusable Component**: Can be placed anywhere
- **Context-Aware**: Auto-fills order information
- **Direct Navigation**: Takes user to chat after sending

---

## 🧪 API Testing with cURL

### 1. Get Vendors Customer Can Contact
```bash
curl -X GET "http://localhost:8000/api/v1/chats/vendors-contacted" \
  -H "Authorization: Bearer YOUR_CUSTOMER_TOKEN"
```

### 2. Create New Chat
```bash
curl -X POST "http://localhost:8000/api/v1/chats" \
  -H "Authorization: Bearer YOUR_CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vendor_id": "VENDOR_UUID",
    "subject": "Question about my order",
    "initial_message": "Hello, I need help with my order"
  }'
```

### 3. Get All Chats
```bash
curl -X GET "http://localhost:8000/api/v1/chats" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Get Chat Messages
```bash
curl -X GET "http://localhost:8000/api/v1/chats/CHAT_ID/messages" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Send Message
```bash
curl -X POST "http://localhost:8000/api/v1/chats/CHAT_ID/messages" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Thank you for your help!",
    "message_type": "text"
  }'
```

---

## 🔧 Adding to Existing Pages

### Add to Order Details Page

```tsx
// In your order details page (e.g., /account/orders/[id]/page.tsx)
import { ContactVendorButton } from '@/components/customer/contact-vendor-button'

// Inside your component
<ContactVendorButton
  vendorId={order.vendor_id}
  vendorName={order.vendor.business_name}
  orderId={order.id}
  orderNumber={order.order_number}
  variant="outline"
/>
```

### Add to Product Page (After Purchase)

```tsx
// Show only if customer has ordered from this vendor
{hasOrderedFromVendor && (
  <ContactVendorButton
    vendorId={product.vendor_id}
    vendorName={product.vendor.business_name}
    variant="ghost"
    size="sm"
  />
)}
```

---

## 🎯 Next Steps: Voice & Video Calls

### Implementation Plan

1. **Install Dependencies**:
   ```bash
   npm install simple-peer socket.io-client
   # or
   npm install peerjs socket.io-client
   ```

2. **Backend WebSocket**:
   - Add WebSocket endpoint for real-time signaling
   - Handle WebRTC offer/answer exchange
   - Manage ICE candidates

3. **Frontend WebRTC**:
   - Create VoiceCallModal component
   - Create VideoCallModal component
   - Implement peer connection setup
   - Handle media streams (camera/microphone)

4. **Call Flow**:
   ```
   Customer clicks "Voice Call"
   → Backend creates call record
   → Vendor receives call notification (WebSocket)
   → Vendor accepts/declines
   → WebRTC peer connection established
   → Audio/Video streams exchanged
   ```

---

## 🐛 Troubleshooting

### Messages not showing?
- Check browser console for errors
- Verify customer has orders from vendor
- Check API response in Network tab
- Ensure backend is running on correct port

### Can't create chat?
- Verify customer has purchased from vendor
- Check `order_items` table for vendor products
- Review backend logs for error details

### Vendor dropdown empty?
- Customer needs to have placed orders first
- Check `/api/v1/chats/vendors-contacted` response
- Verify order_items has vendor_id set correctly

### 404 errors?
- Ensure backend migrations are run
- Check if tables exist: `customer_vendor_chats`, `chat_messages`
- Verify API router is configured correctly

---

## 📊 Database Tables

### customer_vendor_chats
- Stores conversation metadata
- Links customer, vendor, and optionally order
- Tracks unread status for both parties

### chat_messages
- Individual messages in conversations
- Supports text, images, files
- Read receipts and timestamps

---

## 🔒 Security

- ✅ Customers can ONLY contact vendors they've purchased from
- ✅ Access control on all endpoints
- ✅ JWT authentication required
- ✅ Vendor verification on chat creation
- ✅ Participant verification on message send

---

## 💡 Tips

1. **Testing with 2 Browsers**:
   - Chrome (Customer)
   - Firefox or Incognito (Vendor)
   - Log in as different users

2. **Quick Test Setup**:
   - Create test customer
   - Create test vendor
   - Create test order linking them
   - Start messaging!

3. **UI Customization**:
   - Colors defined in `tailwind.config.ts`
   - Components use shadcn/ui
   - Easy to rebrand

---

**Status**: ✅ Messaging system complete and ready to test!
**Next**: WebRTC voice/video calls (optional enhancement)
