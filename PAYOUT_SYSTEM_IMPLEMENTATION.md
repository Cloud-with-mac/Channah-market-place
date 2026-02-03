# Vendor Payout System Implementation

## Overview
This document describes the comprehensive vendor payout system implemented for the Channah marketplace platform.

## Features Implemented

### 1. Backend Models (Python/FastAPI)

#### New Models Created
- **`Payout`** (`backend/app/models/payout.py`)
  - Enhanced payout tracking with detailed status management
  - Fields: id, vendor_id, amount, status, stripe_transfer_id, scheduled_date, paid_date, etc.
  - Status enum: PENDING, PROCESSING, PAID, FAILED

- **`PayoutItem`** (`backend/app/models/payout.py`)
  - Tracks individual orders included in each payout
  - Fields: payout_id, order_id, commission_amount, order_amount, vendor_amount

#### Model Updates
- Models registered in `backend/app/models/__init__.py`
- Relationships established between Payout, PayoutItem, Vendor, and Order models

### 2. Backend API Endpoints

#### Vendor Endpoints (`backend/app/api/v1/endpoints/payouts.py`)
- `GET /payouts/vendors/earnings` - Get current balance, lifetime earnings, pending orders
- `GET /payouts/vendors/payouts` - Get payout history with filtering
- `POST /payouts/vendors/payouts/request` - Request new payout (with minimum threshold validation)

#### Admin Endpoints
- `GET /payouts/admin/payouts` - List all payouts with filtering by status/vendor
- `GET /payouts/admin/payouts/{id}` - Get detailed payout information
- `PUT /payouts/admin/payouts/{id}/approve` - Approve and process payout
- `PUT /payouts/admin/payouts/{id}/reject` - Reject payout and refund vendor balance

#### Features
- Minimum payout threshold: $10
- Automatic commission calculation from orders
- Balance verification before payout request
- Support for multiple payment methods (bank_transfer, stripe, paypal)
- Refund mechanism for rejected payouts

### 3. Automated Commission Calculation

#### Order Processing Integration
The commission calculation is integrated into the order processing flow:

```python
# When order item is marked as DELIVERED:
- Calculate vendor_amount = order_total - commission_amount
- Update vendor.balance += vendor_amount
- Update vendor.total_earnings += vendor_amount
- Update vendor.total_sales += order_total
```

This happens automatically in the existing order status update endpoint at:
`backend/app/api/v1/endpoints/orders.py` (lines 524-528)

### 4. Vendor Portal UI

#### Earnings Page (`vendor/app/(dashboard)/earnings/page.tsx`)
- **Dashboard Cards:**
  - Available Balance (ready for payout)
  - Pending Balance (payouts being processed)
  - This Month Earnings (with growth percentage)
  - Lifetime Earnings

- **Earnings Chart:**
  - Interactive line chart showing earnings over time
  - Configurable time periods (7, 30, 90 days)
  - Built with Recharts

- **Payout Request Dialog:**
  - Amount input with validation
  - Payment method selection
  - Real-time balance checking
  - Minimum threshold enforcement

- **Payout History Table:**
  - All past payout requests
  - Status badges with color coding
  - Payment method display
  - Timestamp information

#### Existing Payouts Page (`vendor/app/(dashboard)/payouts/page.tsx`)
- Enhanced to work with new API endpoints
- Shows balance summary cards
- Request payout functionality
- Detailed payout history

### 5. Admin Dashboard

#### Finance Page (`admin/app/(dashboard)/finance/page.tsx`)
Enhanced with comprehensive payout management:

- **Payout Queue Section:**
  - Filterable payout list (all, pending, processing, paid, failed)
  - Search by vendor name
  - Quick actions: View, Approve, Reject

- **Payout Status Overview:**
  - Visual breakdown of payout statuses
  - Total amounts per status category
  - Count of payouts in each state

- **Approve/Reject Actions:**
  - Approve dialog with transaction ID input
  - Reject dialog with reason input (refunds balance)
  - Real-time status updates

- **Commission Settings Tab:**
  - Configure default platform commission rate
  - Set minimum payout amount
  - Configure payout schedule

- **Seller Plans Tab:**
  - Manage seller plan tiers
  - Configure commission rates per plan
  - Set features for each plan tier

### 6. API Client Integration

#### Vendor API (`vendor/lib/api.ts`)
```typescript
vendorPayoutsAPI: {
  list(params)           // Get payout history
  requestPayout(amount, method)  // Request new payout
  getBalance()           // Get balance info
  getEarnings()          // Get comprehensive earnings data
}
```

#### Admin API (`admin/lib/api.ts`)
```typescript
financeAPI: {
  getPayouts(params)           // List all payouts
  getPayoutById(id)            // Get payout details
  processPayout(id)            // Approve payout
  rejectPayout(id, reason)     // Reject payout
  getTransactions(params)      // Financial transactions
  getCommissionSettings()      // Platform settings
  updateCommissionSettings()   // Update settings
}
```

## Database Schema

### Payouts Table
```sql
CREATE TABLE payouts (
    id UUID PRIMARY KEY,
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) NOT NULL, -- pending, processing, paid, failed
    payment_method VARCHAR(50) NOT NULL,
    stripe_transfer_id VARCHAR(255),
    transaction_id VARCHAR(255),
    scheduled_date TIMESTAMP,
    paid_date TIMESTAMP,
    notes TEXT,
    admin_notes TEXT,
    failure_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Payout Items Table
```sql
CREATE TABLE payout_items (
    id UUID PRIMARY KEY,
    payout_id UUID REFERENCES payouts(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    order_amount NUMERIC(12,2) NOT NULL,
    commission_amount NUMERIC(12,2) NOT NULL,
    vendor_amount NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Payment Flow

### 1. Order Completion
```
Order Delivered → Calculate Commission → Update Vendor Balance
```

### 2. Payout Request (Vendor)
```
Vendor Requests Payout → Validate Balance → Create Payout Record → Deduct from Balance
```

### 3. Payout Processing (Admin)
```
Admin Approves → Integrate with Payment Gateway → Update Status to PAID → Notify Vendor
```

### 4. Payout Rejection (Admin)
```
Admin Rejects → Refund to Vendor Balance → Mark as FAILED → Notify Vendor with Reason
```

## Security Features

1. **Authorization:**
   - Vendors can only access their own payouts
   - Admin-only endpoints for approval/rejection
   - JWT token-based authentication

2. **Validation:**
   - Minimum payout threshold ($10)
   - Balance sufficiency checks
   - Payment method validation
   - Bank details verification

3. **Audit Trail:**
   - All payout status changes tracked
   - Admin notes for approvals/rejections
   - Timestamps for all state transitions

## Payment Gateway Integration

### Current Implementation
The system is designed to integrate with:
- Stripe Connect (for direct transfers)
- PayPal Payouts API
- Bank Transfer (manual processing)

### Integration Points
In `backend/app/api/v1/endpoints/payouts.py`, the `approve_payout` function includes placeholders for payment gateway integration:

```python
# TODO: Integrate with actual payment gateway
# Example for Stripe:
# stripe_transfer = stripe.Transfer.create(
#     amount=int(payout.amount * 100),
#     currency=payout.currency,
#     destination=vendor.stripe_account_id,
#     transfer_group=f"payout_{payout.id}"
# )
# payout.stripe_transfer_id = stripe_transfer.id
```

## Setup and Migration

### 1. Run Database Migration
```bash
cd backend
alembic revision --autogenerate -m "Add payout system tables"
alembic upgrade head
```

### 2. Update Environment Variables
Add to `.env`:
```
PLATFORM_COMMISSION_PERCENT=10.0
MIN_PAYOUT_AMOUNT=10.00
STRIPE_SECRET_KEY=your_stripe_key
PAYPAL_CLIENT_ID=your_paypal_id
```

### 3. Initialize Commission Settings
Platform commission and minimum payout settings can be configured via the admin dashboard under Finance → Commissions tab.

## Testing

### Test Scenarios

1. **Vendor Payout Request:**
   - ✓ Request payout with sufficient balance
   - ✓ Request payout with insufficient balance (should fail)
   - ✓ Request payout below minimum threshold (should fail)
   - ✓ Request payout without bank details (should fail for bank_transfer)

2. **Admin Payout Approval:**
   - ✓ Approve pending payout
   - ✓ Reject pending payout (balance should be refunded)
   - ✓ Cannot approve already processed payout

3. **Commission Calculation:**
   - ✓ Verify commission calculated correctly on order delivery
   - ✓ Verify vendor balance updated
   - ✓ Verify total earnings tracked

## Future Enhancements

1. **Automated Payouts:**
   - Schedule automatic payouts on specific dates
   - Batch processing for multiple vendors
   - Configurable payout frequency (weekly, bi-weekly, monthly)

2. **Payment Gateway Integration:**
   - Complete Stripe Connect integration
   - PayPal Payouts API integration
   - Add more payment method options

3. **Reporting:**
   - Detailed payout reports
   - Commission breakdown reports
   - Export functionality (CSV, PDF)
   - Tax documentation generation

4. **Notifications:**
   - Email notifications for payout status changes
   - SMS alerts for approved payouts
   - In-app notifications

5. **Advanced Features:**
   - Split payments for multi-vendor orders
   - Hold periods for fraud prevention
   - Instant payout options (with fees)
   - Currency conversion support

## Files Created/Modified

### Backend Files Created:
- `backend/app/models/payout.py` - Payout and PayoutItem models
- `backend/app/schemas/payout.py` - Payout request/response schemas
- `backend/app/api/v1/endpoints/payouts.py` - Payout API endpoints

### Backend Files Modified:
- `backend/app/models/__init__.py` - Added payout model imports
- `backend/app/api/v1/router.py` - Registered payout routes

### Frontend Files Created:
- `vendor/app/(dashboard)/earnings/page.tsx` - Comprehensive earnings dashboard

### Frontend Files Modified:
- `vendor/lib/api.ts` - Added earnings API endpoint
- `admin/lib/api.ts` - Updated payout API endpoints to use new routes
- `admin/app/(dashboard)/finance/page.tsx` - Updated status names and field mappings

## API Documentation

### Vendor Endpoints

#### GET /payouts/vendors/earnings
Returns comprehensive earnings information.

**Response:**
```json
{
  "current_balance": 1250.50,
  "pending_balance": 300.00,
  "lifetime_earnings": 15000.00,
  "this_month_earnings": 2500.00,
  "pending_orders_count": 5,
  "pending_orders_value": 450.00
}
```

#### POST /payouts/vendors/payouts/request
Request a new payout.

**Request:**
```json
{
  "amount": 500.00,
  "payment_method": "bank_transfer"
}
```

**Response:**
```json
{
  "id": "uuid",
  "amount": 500.00,
  "status": "pending",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Admin Endpoints

#### GET /payouts/admin/payouts
List all payouts with optional filters.

**Query Parameters:**
- `status`: pending, processing, paid, failed
- `vendor_id`: Filter by vendor UUID
- `limit`: Number of results (default: 20)
- `skip`: Pagination offset (default: 0)

#### PUT /payouts/admin/payouts/{id}/approve
Approve a pending payout.

**Request:**
```json
{
  "stripe_transfer_id": "tr_xxxxx",
  "transaction_id": "TXN123456",
  "notes": "Processed via Stripe"
}
```

#### PUT /payouts/admin/payouts/{id}/reject
Reject a payout request.

**Request:**
```json
{
  "reason": "Insufficient verification documents"
}
```

## Support and Maintenance

For issues or questions:
1. Check the backend logs for API errors
2. Verify database migrations are up to date
3. Ensure payment gateway credentials are configured
4. Review vendor balance calculations in the database

## License
This implementation is part of the Channah Marketplace platform.
