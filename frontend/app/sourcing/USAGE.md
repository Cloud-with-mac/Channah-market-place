# Product Sourcing Page - Usage Guide

## Quick Start

### Accessing the Page
Navigate to: `http://localhost:3000/sourcing`

### First Time Setup

1. **Seed Sample Data** (Optional)
   Open browser console and run:
   ```javascript
   window.seedSourcingData()
   ```
   This will populate the page with 6 sample requests and 10 bids.

2. **Clear Data** (Reset)
   Open browser console and run:
   ```javascript
   localStorage.removeItem('vendora-sourcing')
   location.reload()
   ```

## User Flows

### As a Buyer (Creating Requests)

#### 1. Create a New Sourcing Request
1. Click "Create Sourcing Request" button in the hero section
2. Fill in required fields (marked with *):
   - **Request Title**: Clear, descriptive title (e.g., "1000 units of Industrial Safety Helmets")
   - **Category**: Select from dropdown
   - **Quantity**: Number of units needed
   - **Destination**: Delivery location
   - **Description**: Detailed requirements
3. Fill in optional fields:
   - **Target Unit Price**: Your ideal price per unit
   - **Total Budget**: Maximum spend
   - **Deadline**: When you need quotes by
4. Add specifications (optional):
   - Click "Add Specification"
   - Enter name-value pairs (e.g., "Material" = "ABS Plastic")
   - Remove unwanted specs with trash icon
5. Click "Create Request"
6. Request appears in "My Requests" tab

#### 2. Review Bids
1. Go to "My Requests" tab
2. Click on a request to expand it
3. View all bids in the "Bids Received" section
4. Compare vendors by:
   - Unit price and total cost
   - MOQ (Minimum Order Quantity)
   - Lead time
   - Payment terms
   - Certifications

#### 3. Award a Contract
1. Expand your request
2. Click "Award" button on the preferred bid
3. Confirm the award in the dialog
4. Request status changes to "Awarded"
5. Request is automatically closed

#### 4. Close a Request
1. Expand your request
2. Click "Close Request" at the bottom
3. Confirm in the dialog
4. Request closes without awarding

#### 5. Delete a Request
1. Expand your request
2. Click "Delete" button
3. Confirm deletion (irreversible)
4. Request and all bids are removed

### As a Vendor (Submitting Bids)

#### 1. Browse Open Requests
1. Stay on "Browse Requests" tab (default)
2. Use filters to find relevant requests:
   - **Search**: Keyword search in title/description
   - **Status**: Filter by status (Open, Bidding, etc.)
   - **Category**: Filter by product category
3. Click request card to expand and view details

#### 2. Submit a Bid
1. Click "Submit Bid" button on an open request
2. Review request summary (quantity, target price, budget)
3. Fill in required bid fields:
   - **Unit Price**: Your quoted price per unit
   - **MOQ**: Minimum order quantity you can accept
   - **Lead Time**: Production/delivery time (e.g., "30 days")
   - **Payment Terms**: Select from dropdown
4. Fill in optional fields:
   - **Certifications**: Comma-separated (e.g., "ISO 9001, CE, FDA")
   - **Additional Notes**: Any relevant information about your offer
5. Review calculated total bid amount
6. Click "Submit Bid"
7. Bid appears on the request immediately

#### 3. Track Your Bids
- Currently displays in request details
- Shows status: Pending, Accepted, or Rejected
- Awarded bids highlighted in green

## Features by Tab

### Browse Requests Tab
**Purpose**: For vendors to find and bid on opportunities

**Features**:
- View all open sourcing requests
- Search by keywords
- Filter by status and category
- Submit bids on relevant requests
- View bid counts on each request
- See request details and specifications

### My Requests Tab
**Purpose**: For buyers to manage their sourcing requests

**Features**:
- View only your created requests
- Search and filter your requests
- Review submitted bids
- Award contracts to vendors
- Close or delete requests
- Track request status

## Status Indicators

### Request Statuses
- **🔵 Open**: New request, accepting bids
- **🟡 Bidding**: Has received at least one bid
- **🟢 Awarded**: Contract awarded to a vendor
- **⚫ Closed**: Closed without awarding

### Bid Statuses
- **⚪ Pending**: Waiting for buyer decision
- **🟢 Accepted**: Buyer accepted the bid
- **🔴 Rejected**: Buyer rejected the bid

## Tips for Success

### For Buyers
1. **Be Specific**: Include detailed specifications and requirements
2. **Set Realistic Targets**: Target prices help vendors provide accurate quotes
3. **Add Deadlines**: Encourages timely responses
4. **Review All Bids**: Don't just pick the lowest price - consider MOQ, lead time, and certifications
5. **Use Specifications**: Structured specs help vendors understand exact requirements

### For Vendors
1. **Read Carefully**: Understand all requirements before bidding
2. **Be Competitive**: Research market rates
3. **Highlight Value**: Use notes to explain why your bid is best
4. **Show Credentials**: List relevant certifications
5. **Meet MOQ**: Ensure you can fulfill the requested quantity
6. **Be Realistic**: Quote achievable lead times

## Keyboard Shortcuts
- **Esc**: Close dialogs
- **Tab**: Navigate form fields
- **Enter**: Submit forms (when in text input)

## Common Actions

### Finding Specific Requests
1. Use search box: Type keywords
2. Apply filters: Status and category
3. Click request to expand: View full details

### Comparing Bids
1. Expand request (My Requests tab)
2. Scroll to "Bids Received" section
3. Compare side-by-side:
   - Look at unit price vs. total cost
   - Check MOQ requirements
   - Consider lead times
   - Review payment terms
   - Verify certifications

### Modifying Requests
- Currently: Delete and recreate
- Coming soon: Edit functionality

## Data Persistence
- All data stored in browser localStorage
- Persists across sessions
- Cleared when you clear browser data
- Key: `vendora-sourcing`

## Mobile Usage
- Fully responsive design
- Touch-friendly buttons
- Stacked layouts on small screens
- Scrollable tables and cards

## Troubleshooting

### "No requests found"
- Check your filters (Status, Category)
- Clear search query
- Seed sample data to test

### Bid not showing
- Ensure request is expanded
- Check if you're in correct tab
- Refresh page

### Can't submit bid
- Verify all required fields filled
- Check unit price is a valid number
- Ensure MOQ is a whole number

### Request not appearing
- Check "My Requests" tab
- Verify createdBy ID matches current user
- Check status filter

## Browser Console Commands

```javascript
// Seed sample data
window.seedSourcingData()

// Access store directly
const store = useSourcingStore.getState()

// Get all requests
console.log(store.requests)

// Get open requests
console.log(store.getOpenRequests())

// Clear all data
localStorage.removeItem('vendora-sourcing')
location.reload()
```

## Best Practices

### Creating Effective Requests
✅ Clear, descriptive title
✅ Detailed description with requirements
✅ Accurate quantity
✅ Realistic budget/target price
✅ Specific deadline
✅ Structured specifications
✅ Include quality standards

❌ Vague titles
❌ Missing critical info
❌ Unrealistic prices
❌ No deadline
❌ Incomplete specifications

### Submitting Competitive Bids
✅ Competitive pricing
✅ Meet or beat MOQ
✅ Realistic lead times
✅ Flexible payment terms
✅ List certifications
✅ Detailed notes
✅ Professional presentation

❌ Overpriced quotes
❌ High MOQ requirements
❌ Unrealistic delivery
❌ Inflexible terms
❌ Missing credentials
❌ Minimal information

## Support

For issues or questions:
1. Check this guide
2. Review the README.md
3. Inspect browser console for errors
4. Check localStorage data
5. Contact development team

## Next Steps

After using the sourcing page:
1. **Integration**: Connect to backend API
2. **Authentication**: Replace mock user IDs with real auth
3. **Notifications**: Add email/push notifications
4. **Messaging**: Integrate vendor-buyer chat
5. **Analytics**: Track bid conversion rates
6. **Export**: Generate PDF reports
