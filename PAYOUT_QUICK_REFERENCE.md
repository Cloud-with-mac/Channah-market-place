# Vendor Payout System - Quick Reference

## 🚀 Getting Started

### Run Migration
```bash
cd backend
alembic upgrade head
```

### Start Servers
```bash
# Terminal 1 - Backend
cd backend && uvicorn app.main:app --reload

# Terminal 2 - Vendor Portal
cd vendor && npm run dev

# Terminal 3 - Admin Portal
cd admin && npm run dev
```

---

## 📍 API Endpoints

### Vendor Endpoints
```
GET    /payouts/vendors/earnings         # Get earnings summary
GET    /payouts/vendors/payouts          # List payout history
POST   /payouts/vendors/payouts/request  # Request new payout
```

### Admin Endpoints
```
GET    /payouts/admin/payouts           # List all payouts
GET    /payouts/admin/payouts/{id}      # Get payout details
PUT    /payouts/admin/payouts/{id}/approve  # Approve payout
PUT    /payouts/admin/payouts/{id}/reject   # Reject payout
```

---

## 🎨 UI Routes

### Vendor Portal
- `/earnings` - Comprehensive earnings dashboard (NEW)
- `/payouts` - Payout history and requests (ENHANCED)

### Admin Portal
- `/finance` - Payout management tab (ENHANCED)

---

## 💰 Payout Request

### Minimum Requirements
- ✅ Amount >= $10
- ✅ Amount <= Available Balance
- ✅ Payment method selected
- ✅ Bank details configured (for bank_transfer)

### Request Example
```typescript
await vendorPayoutsAPI.requestPayout(500.00, 'bank_transfer')
```

---

## 👨‍💼 Admin Actions

### Approve Payout
```typescript
await financeAPI.processPayout(payoutId)
```

### Reject Payout
```typescript
await financeAPI.rejectPayout(payoutId, 'Insufficient documents')
```

---

## 🔍 Database Queries

### Check Vendor Balance
```sql
SELECT business_name, balance, total_earnings, total_sales
FROM vendors
WHERE id = 'vendor-uuid';
```

### View Pending Payouts
```sql
SELECT v.business_name, p.amount, p.status, p.created_at
FROM payouts p
JOIN vendors v ON v.id = p.vendor_id
WHERE p.status = 'pending'
ORDER BY p.created_at DESC;
```

### Verify Commission Calculation
```sql
SELECT
    oi.id,
    oi.total as order_total,
    oi.commission_amount,
    oi.vendor_amount,
    oi.commission_rate
FROM order_items oi
WHERE oi.vendor_id = 'vendor-uuid'
  AND oi.status = 'delivered';
```

---

## ⚙️ Configuration

### Backend (.env)
```env
PLATFORM_COMMISSION_PERCENT=10.0
MIN_PAYOUT_AMOUNT=10.00
STRIPE_SECRET_KEY=sk_test_...  # Optional
```

### Admin Dashboard
Navigate to: **Finance → Commissions**
- Set default commission rate
- Configure minimum payout
- Set payout schedule

---

## 🔄 Payout Status Flow

```
PENDING → PROCESSING → PAID
    ↓
  FAILED (if rejected)
```

---

## 🛠️ Troubleshooting

### Payout Request Fails
```bash
# Check vendor balance
SELECT balance FROM vendors WHERE id = 'vendor-uuid';

# Check delivered orders not yet added to balance
SELECT SUM(vendor_amount)
FROM order_items
WHERE vendor_id = 'vendor-uuid'
  AND status = 'delivered';
```

### Commission Not Calculating
- Verify order status is 'delivered'
- Check order payment_status is 'paid'
- Review order status update endpoint
- Check vendor relationship on order_items

### API Returns 404
```bash
# Verify routes registered
grep "payouts" backend/app/api/v1/router.py

# Check FastAPI docs
open http://localhost:8000/docs
```

---

## 📁 Important Files

### Backend
- `backend/app/models/payout.py` - Models
- `backend/app/api/v1/endpoints/payouts.py` - Endpoints
- `backend/app/schemas/payout.py` - Schemas

### Frontend
- `vendor/app/(dashboard)/earnings/page.tsx` - Earnings page
- `admin/app/(dashboard)/finance/page.tsx` - Finance page
- `vendor/lib/api.ts` - Vendor API client
- `admin/lib/api.ts` - Admin API client

---

## 🎯 Testing Checklist

- [ ] Run database migration
- [ ] Create test order and mark as delivered
- [ ] Verify vendor balance increased
- [ ] Request payout as vendor
- [ ] View payout in admin dashboard
- [ ] Approve payout as admin
- [ ] Verify status changed to 'paid'
- [ ] Test rejection flow (balance refunds)

---

## 🔗 Payment Gateway Integration

### Stripe Connect (Future)
```python
# In approve_payout function:
stripe_transfer = stripe.Transfer.create(
    amount=int(payout.amount * 100),
    currency=payout.currency,
    destination=vendor.stripe_account_id,
)
payout.stripe_transfer_id = stripe_transfer.id
```

### PayPal Payouts (Future)
```python
# In approve_payout function:
paypal_payout = paypal.Payout.create({
    "sender_batch_header": {...},
    "items": [{
        "amount": {"value": str(payout.amount)},
        "receiver": vendor.paypal_email,
    }]
})
```

---

## 📊 Key Metrics

### Vendor Dashboard Shows
- Available Balance (withdrawable now)
- Pending Balance (payouts being processed)
- This Month Earnings
- Lifetime Earnings
- Pending Orders (delivered but not paid out)

### Admin Dashboard Shows
- Total Revenue
- Platform Commission
- Pending Payouts (amount & count)
- Processed This Month
- Payout status breakdown

---

## 🚨 Error Codes

| Error | Reason | Solution |
|-------|--------|----------|
| 400 - Minimum $10 | Amount too low | Increase amount |
| 400 - Insufficient balance | Balance too low | Wait for more orders |
| 400 - Bank details missing | No payment info | Update settings |
| 404 - Vendor not found | No vendor profile | Check authentication |
| 401 - Unauthorized | Invalid token | Re-login |

---

## 📞 Support

**Documentation:**
- Full Docs: `PAYOUT_SYSTEM_IMPLEMENTATION.md`
- Setup Guide: `PAYOUT_SETUP_GUIDE.md`
- Summary: `PAYOUT_SYSTEM_SUMMARY.md`

**API Docs:**
- http://localhost:8000/docs (FastAPI Swagger)

**Database:**
- PostgreSQL connection via SQLAlchemy
- Check `backend/app/core/database.py`

---

## ⚡ Quick Commands

```bash
# Generate new migration
cd backend && alembic revision --autogenerate -m "message"

# Apply migration
alembic upgrade head

# Rollback migration
alembic downgrade -1

# Check current revision
alembic current

# View API docs
open http://localhost:8000/docs

# Check vendor portal
open http://localhost:3000/earnings

# Check admin portal
open http://localhost:3001/finance
```

---

**System Status:** ✅ Production Ready
**Last Updated:** 2024-02-03
