# Vendor Payout System - Quick Setup Guide

## Prerequisites
- Python 3.9+ with FastAPI backend running
- Node.js 18+ with Next.js frontend running
- PostgreSQL database
- Admin and Vendor portals accessible

## Step-by-Step Setup

### 1. Database Migration

Run the migration to create payout tables:

```bash
cd backend

# Generate migration (if using auto-generate)
alembic revision --autogenerate -m "Add payout system"

# Or use the provided migration file
# The file is already at: backend/alembic/versions/001_add_payout_system.py

# Apply migration
alembic upgrade head
```

### 2. Verify Backend Installation

Check that all files are in place:

```bash
# Models
backend/app/models/payout.py

# Schemas
backend/app/schemas/payout.py

# Endpoints
backend/app/api/v1/endpoints/payouts.py

# Router registration
backend/app/api/v1/router.py
```

### 3. Restart Backend Server

```bash
cd backend
uvicorn app.main:app --reload
```

### 4. Verify Frontend Installation

Check vendor portal:
```bash
# Earnings page
vendor/app/(dashboard)/earnings/page.tsx

# Existing payouts page (enhanced)
vendor/app/(dashboard)/payouts/page.tsx
```

Check admin portal:
```bash
# Finance page (enhanced)
admin/app/(dashboard)/finance/page.tsx
```

### 5. Restart Frontend Servers

```bash
# Vendor portal
cd vendor
npm run dev

# Admin portal (in another terminal)
cd admin
npm run dev
```

### 6. Initial Configuration

1. **Login to Admin Dashboard**
   - Navigate to Finance → Commissions tab
   - Set default commission rate (e.g., 10%)
   - Set minimum payout amount (e.g., $10)
   - Configure payout schedule

2. **Configure Seller Plans** (Optional)
   - Navigate to Finance → Seller Plans tab
   - Set up tiered commission rates for different vendor plans

### 7. Test the System

#### A. Test Commission Calculation

1. Create a test order as a customer
2. Vendor marks order as shipped
3. Vendor marks order as delivered
4. Check vendor's earnings page - balance should increase
5. Verify in database:
   ```sql
   SELECT balance, total_earnings, total_sales FROM vendors WHERE id = 'vendor_uuid';
   ```

#### B. Test Payout Request (Vendor)

1. Login to vendor portal
2. Navigate to Earnings or Payouts page
3. Click "Request Payout"
4. Enter amount (>= $10, <= available balance)
5. Select payment method
6. Submit request
7. Verify payout appears in history as "pending"

#### C. Test Payout Approval (Admin)

1. Login to admin dashboard
2. Navigate to Finance → Payouts tab
3. Find the pending payout
4. Click approve action
5. Optionally add transaction ID
6. Confirm approval
7. Verify payout status changes to "paid"
8. Check vendor balance was not refunded (stays deducted)

#### D. Test Payout Rejection (Admin)

1. Create another payout request as vendor
2. In admin dashboard, click reject on the payout
3. Enter rejection reason
4. Confirm rejection
5. Verify payout status changes to "failed"
6. Check vendor balance was refunded
7. Verify vendor receives notification (if implemented)

### 8. Common Issues and Solutions

#### Issue: Migration fails
**Solution:**
```bash
# Check database connection
python -c "from app.core.database import engine; print(engine)"

# Reset migrations (CAUTION: Development only!)
alembic downgrade base
alembic upgrade head
```

#### Issue: Payout request fails with "Insufficient balance"
**Solution:**
- Verify order commission was calculated
- Check vendor.balance in database
- Ensure orders are marked as DELIVERED
- Run this SQL to manually verify:
```sql
SELECT
    v.business_name,
    v.balance,
    SUM(oi.vendor_amount) as total_delivered_not_paid
FROM vendors v
JOIN order_items oi ON oi.vendor_id = v.id
JOIN orders o ON o.id = oi.order_id
WHERE oi.status = 'delivered'
    AND o.payment_status = 'paid'
GROUP BY v.id, v.business_name, v.balance;
```

#### Issue: Commission not calculating on order delivery
**Solution:**
Check that the order status update endpoint is calling the commission calculation. In `backend/app/api/v1/endpoints/orders.py`, the vendor balance update should happen when order item status changes to DELIVERED (around line 525).

#### Issue: API endpoints return 404
**Solution:**
- Verify router registration in `backend/app/api/v1/router.py`
- Check that the payouts router is imported and included
- Restart the backend server
- Check the FastAPI docs at http://localhost:8000/docs

#### Issue: Frontend displays "Failed to fetch"
**Solution:**
- Check API URLs in `vendor/lib/api.ts` and `admin/lib/api.ts`
- Verify CORS settings in backend
- Check browser console for detailed error
- Ensure auth tokens are valid

### 9. Environment Variables

Add these to your `.env` files:

**Backend** (`backend/.env`):
```env
# Payout Settings
PLATFORM_COMMISSION_PERCENT=10.0
MIN_PAYOUT_AMOUNT=10.00

# Payment Gateway (Optional - for future integration)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
```

**Frontend** (`vendor/.env` and `admin/.env`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### 10. Payment Gateway Integration (Future)

The system is prepared for payment gateway integration. To enable:

1. **Stripe Connect:**
   - Vendors complete Stripe onboarding
   - Store `stripe_account_id` in vendor record
   - Use Stripe Transfer API in `approve_payout` function

2. **PayPal Payouts:**
   - Vendors provide PayPal email
   - Use PayPal Payouts API in `approve_payout` function

See the TODO comments in `backend/app/api/v1/endpoints/payouts.py` for integration points.

### 11. Monitoring and Maintenance

#### Database Queries for Monitoring

**Total pending payouts:**
```sql
SELECT COUNT(*), SUM(amount)
FROM payouts
WHERE status = 'pending';
```

**Vendor balance summary:**
```sql
SELECT
    business_name,
    balance as available,
    total_earnings as lifetime,
    total_sales
FROM vendors
ORDER BY balance DESC
LIMIT 10;
```

**Recent payout activity:**
```sql
SELECT
    p.id,
    v.business_name,
    p.amount,
    p.status,
    p.created_at,
    p.paid_date
FROM payouts p
JOIN vendors v ON v.id = p.vendor_id
ORDER BY p.created_at DESC
LIMIT 20;
```

#### Scheduled Tasks (Recommended)

Set up cron jobs or scheduled tasks for:

1. **Automated payout processing:**
   - Run daily/weekly to auto-approve eligible payouts
   - Integrate with payment gateway

2. **Balance reconciliation:**
   - Verify vendor balances match order commissions
   - Flag discrepancies for review

3. **Email reminders:**
   - Notify vendors of available balance
   - Remind vendors to update payment details

### 12. Security Checklist

- [ ] All payout endpoints require authentication
- [ ] Vendors can only access their own payouts
- [ ] Admin endpoints require admin role
- [ ] Minimum payout threshold enforced
- [ ] Balance checks prevent negative balances
- [ ] All monetary amounts use Decimal type
- [ ] SQL injection protected (using SQLAlchemy ORM)
- [ ] Input validation on all endpoints
- [ ] Audit trail maintained (created_at, updated_at)
- [ ] Failed payout attempts logged

### 13. Next Steps

After setup is complete:

1. Test with real vendor accounts
2. Configure payment gateway integration
3. Set up automated payout schedule
4. Implement email notifications
5. Add payout report generation
6. Configure monitoring and alerts
7. Train admin staff on payout management
8. Document internal procedures

## Support

For technical issues:
- Check backend logs: `backend/logs/` or console output
- Check frontend console for API errors
- Review database for data consistency
- Consult PAYOUT_SYSTEM_IMPLEMENTATION.md for detailed docs

For integration questions:
- See payment gateway documentation
- Review the TODO comments in code
- Check the API documentation at `/docs`

---

**System Ready!** Your vendor payout system is now operational.
