# Product Sourcing - Quick Start Guide

## 🚀 Access the Page

```
http://localhost:3000/sourcing
```

## 📦 Seed Sample Data (First Time)

Open browser console (F12) and run:
```javascript
window.seedSourcingData()
```

This creates 6 requests with 10 bids for testing.

## 🎯 Quick Actions

### As a Buyer

#### Create a Request
1. Click "Create Sourcing Request"
2. Fill in:
   - Title: What you need
   - Category: Product type
   - Quantity: How many units
   - Destination: Delivery location
   - Description: Detailed requirements
3. Add optional: Target price, Budget, Deadline
4. Add specifications (name-value pairs)
5. Click "Create Request"

#### Review Bids
1. Go to "My Requests" tab
2. Click on your request to expand
3. Scroll to "Bids Received"
4. Compare: Price, MOQ, Lead Time, Payment Terms

#### Award Contract
1. Expand your request
2. Click "Award" on best bid
3. Confirm in dialog
4. Done! Request closes automatically

### As a Vendor

#### Find Opportunities
1. Stay on "Browse Requests" tab
2. Use search and filters
3. Click request to view details

#### Submit a Bid
1. Click "Submit Bid" on open request
2. Fill in:
   - Unit Price: Your quote per unit
   - MOQ: Minimum order quantity
   - Lead Time: e.g., "30 days"
   - Payment Terms: Select from dropdown
3. Add optional: Certifications, Notes
4. Review total bid amount
5. Click "Submit Bid"

## 🔍 Features at a Glance

| Feature | Location | Action |
|---------|----------|--------|
| Create Request | Hero section | Click button |
| Browse Requests | Browse tab | View all open |
| My Requests | My Requests tab | Manage yours |
| Search | Filter card | Type keywords |
| Filter Status | Filter card | Select dropdown |
| Filter Category | Filter card | Select dropdown |
| Submit Bid | Request card | Click button |
| Award Contract | Bid card | Click Award |
| Close Request | Request footer | Click Close |
| Delete Request | Request footer | Click Delete |

## 🎨 Status Colors

- 🔵 **Open** - Accepting bids
- 🟡 **Bidding** - Has received bids
- 🟢 **Awarded** - Contract awarded
- ⚫ **Closed** - Closed, no award

## 💡 Pro Tips

### For Buyers
- Be specific in descriptions
- Set realistic target prices
- Add detailed specifications
- Review all bids, not just lowest price
- Consider MOQ, lead time, certifications

### For Vendors
- Read requirements carefully
- Provide competitive quotes
- Highlight your certifications
- Use notes to add value
- Quote realistic lead times

## 🛠️ Common Tasks

### Find Electronics Requests
1. Set Category filter to "Electronics"
2. Set Status to "Open"
3. Browse results

### Compare All Bids on a Request
1. Expand the request
2. Scroll to "Bids Received"
3. Compare side-by-side

### Clear All Data (Reset)
```javascript
localStorage.removeItem('vendora-sourcing')
location.reload()
```

## 📱 Mobile Usage

- Fully responsive
- Touch-friendly buttons
- Swipe to scroll bids
- Tap to expand requests

## ⌨️ Keyboard Shortcuts

- **Tab**: Navigate form fields
- **Enter**: Submit forms
- **Esc**: Close dialogs
- **Arrow Keys**: Select dropdowns

## 🔧 Troubleshooting

### No requests showing?
- Check filters (Status, Category)
- Clear search box
- Seed sample data

### Can't submit bid?
- Check all required fields
- Verify numbers are valid
- Ensure request is open/bidding

### Changes not saving?
- Check browser console for errors
- Verify localStorage is enabled
- Try refreshing page

## 📚 More Help

- **USAGE.md** - Detailed user guide
- **README.md** - Feature overview
- **FEATURES.md** - Complete feature list
- **INTEGRATION.md** - API integration

## 🎊 That's It!

You're ready to start sourcing products!

**Questions?** Check the documentation files above.
