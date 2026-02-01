# Trade Finance - Quick Start Guide

## Access the Page

Navigate to: **`/trade-finance`**

## Using the Finance Store

```typescript
import { useFinanceStore } from '@/store'

function MyComponent() {
  const {
    // Applications
    createApplication,
    updateApplication,
    submitApplication,
    applications,

    // Credit Lines
    creditLines,
    activeCreditLine,
    updateCreditUtilization,

    // Payment Plans
    createPaymentPlan,
    paymentPlans,
    calculateInstallments,

    // Invoice Factoring
    submitFactoringRequest,
    factoringRequests,
    calculateFactoringCost,

    // Partners
    financePartners,
    getPartner,
  } = useFinanceStore()

  // Your logic here
}
```

## Quick Examples

### 1. Create a Credit Application

```typescript
const handleApply = () => {
  const appId = createApplication({
    companyName: 'ABC Trading Ltd',
    businessType: 'llc',
    taxId: '12-3456789',
    registrationNumber: 'REG123456',
    yearsInBusiness: 5,
    annualRevenue: 1000000,
    requestedCreditLimit: 50000,
    paymentTerms: 'NET_30',
    industryType: 'wholesale',
  })

  console.log('Application created with ID:', appId)
}
```

### 2. Calculate Payment Plan

```typescript
const installments = calculateInstallments(
  10000,      // amount
  6,          // number of installments
  3.5,        // interest rate (%)
  'monthly'   // frequency
)

// Returns array of installments with dates and amounts
console.log(installments)
```

### 3. Calculate Factoring Cost

```typescript
const costs = calculateFactoringCost(
  25000,  // invoice amount
  80,     // advance rate (%)
  2.5     // fee percentage
)

console.log(costs)
// {
//   advanceAmount: 20000,
//   factoringFee: 625,
//   netAmount: 19375
// }
```

### 4. Submit Factoring Request

```typescript
const requestId = submitFactoringRequest({
  invoiceNumber: 'INV-001',
  invoiceAmount: 25000,
  invoiceDate: new Date().toISOString(),
  dueDate: addDays(new Date(), 30).toISOString(),
  customerName: 'Customer Inc',
  advanceRate: 80,
  advanceAmount: 20000,
  factoringFee: 625,
  feePercentage: 2.5,
  netAmount: 19375,
})
```

### 5. Create Payment Plan

```typescript
const planId = createPaymentPlan({
  amount: 10000,
  planType: 'installment',
  numberOfInstallments: 6,
  installmentAmount: 1750,
  firstPaymentDate: new Date().toISOString(),
  paymentFrequency: 'monthly',
  interestRate: 3.5,
  totalWithInterest: 10500,
  installments: [
    {
      number: 1,
      amount: 1750,
      dueDate: new Date().toISOString(),
      status: 'pending'
    },
    // ... more installments
  ]
})
```

## Component Structure

```
/trade-finance
├── FinancingOptions          # Display Net 30/60/90 options
├── CreditApplicationForm     # Multi-step application
├── PaymentPlanCalculator     # Interactive calculator
├── CreditLimitTracker        # Credit utilization display
├── PaymentScheduleBuilder    # Milestone-based schedules
├── InvoiceFactoring          # Factoring calculator & form
├── FinancePartnersDirectory  # Partner listings
└── ApplicationStatusTracking # Application tracking
```

## Available Finance Terms

```typescript
type FinanceTermType = 'NET_30' | 'NET_60' | 'NET_90' | 'NET_120'
```

## Application Statuses

```typescript
type ApplicationStatus =
  | 'draft'          // Incomplete application
  | 'pending'        // Submitted, awaiting review
  | 'under_review'   // Being reviewed
  | 'approved'       // Approved
  | 'rejected'       // Rejected
  | 'active'         // Active credit line
```

## Payment Plan Types

```typescript
type PaymentPlanType =
  | 'installment'    // Regular installments
  | 'deferred'       // Deferred payment
  | 'milestone'      // Milestone-based
```

## Finance Partners (Pre-loaded)

- **Global Trade Finance** - £5K-£500K, 3.5%, 2-3 days
- **Business Capital Partners** - £10K-£1M, 4.2%, 1-2 days
- **Invoice Advance Solutions** - £2.5K-£250K, 2.8%, 24 hours
- **SME Growth Finance** - £3K-£300K, 3.9%, 2-4 days

## Styling Classes

All components use Tailwind CSS with shadcn/ui components:
- Cards: `<Card>`, `<CardHeader>`, `<CardContent>`
- Forms: `<Input>`, `<Label>`, `<Select>`, `<RadioGroup>`
- Buttons: `<Button variant="outline|default|destructive">`
- Progress: `<Progress value={percentage}>`
- Badges: `<Badge variant="default|secondary|destructive">`

## Icons Used

From `lucide-react`:
- `DollarSign`, `TrendingUp`, `Calendar`, `Clock`
- `CreditCard`, `FileText`, `Calculator`, `Receipt`
- `Building2`, `Shield`, `CheckCircle2`, `AlertCircle`
- `Wallet`, `HandshakeIcon`, `BanknoteIcon`
- And more...

## Data Persistence

All data automatically persisted to localStorage:
- Storage key: `vendora-finance-storage`
- Automatic rehydration on app load
- Survives page refreshes

## Responsive Breakpoints

- Mobile: Default (< 768px)
- Tablet: `md:` (≥ 768px)
- Desktop: `lg:` (≥ 1024px)

## Common Tasks

### Update Application Status
```typescript
updateApplication(appId, { status: 'approved' })
```

### Mark Installment as Paid
```typescript
markInstallmentPaid(planId, installmentNumber)
```

### Update Credit Utilization
```typescript
updateCreditUtilization(creditLineId, usedAmount)
```

### Get Specific Partner
```typescript
const partner = getPartner(partnerId)
```

## Integration Checklist

When connecting to backend:

1. Replace mock data with API calls
2. Add authentication tokens to requests
3. Implement file upload to cloud storage
4. Add error handling for API failures
5. Set up WebSocket for real-time updates
6. Add payment gateway integration
7. Implement email notifications
8. Add document verification

## Troubleshooting

### Calculator not updating?
- Check if values are within slider ranges
- Ensure React.useMemo dependencies are correct

### Form not submitting?
- Verify all required fields are filled
- Check console for validation errors

### Data not persisting?
- Check localStorage is enabled
- Verify storage key is correct
- Clear cache and try again

## Next Steps

1. Test all features in development
2. Connect to backend APIs
3. Add payment processing
4. Implement document upload
5. Set up email notifications
6. Add analytics tracking
7. Configure security measures
8. Deploy to production

## Support

For issues or questions:
- Check the main README.md for detailed documentation
- Review the TRADE_FINANCE_IMPLEMENTATION.md for technical details
- Contact the development team

---

**Status**: ✅ Production Ready (Frontend)
**Last Updated**: 2026-01-29
