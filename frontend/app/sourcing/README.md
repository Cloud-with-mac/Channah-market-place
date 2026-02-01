# Product Sourcing Page

## Overview
A comprehensive B2B product sourcing platform that connects buyers with vendors through a competitive bidding system.

## Features

### 1. Browse Sourcing Requests
- View all open sourcing requests from buyers
- Search and filter by status, category, and keywords
- See request details including quantity, budget, and specifications
- Real-time bid count and status updates

### 2. Create Sourcing Request
- Complete form with all necessary fields:
  - Title, category, and description
  - Quantity and destination
  - Optional target price and budget
  - Optional deadline
  - Custom specifications (name-value pairs)
- Field validation and user-friendly error messages
- Instant posting with unique ID generation

### 3. Submit Bids (Vendor View)
- Professional bid submission form
- Required fields:
  - Unit price
  - Minimum order quantity (MOQ)
  - Lead time
  - Payment terms
- Optional fields:
  - Certifications (comma-separated)
  - Additional notes
- Live total bid calculation
- Automatic status tracking

### 4. Bid Management (Buyer View)
- View all bids on your requests
- Compare bids side-by-side:
  - Unit price and total cost
  - MOQ requirements
  - Lead times
  - Payment terms
  - Vendor certifications
- Award contract to winning bid
- Accept/reject individual bids

### 5. Request Management
- Edit request details (coming soon)
- Close requests without awarding
- Delete requests with confirmation
- Track request status:
  - Open (accepting bids)
  - Bidding (has received bids)
  - Awarded (contract awarded)
  - Closed (no award)

## User Interface

### Design Principles
- Professional B2B aesthetic
- Clean, modern card-based layout
- Responsive grid system
- Clear visual hierarchy
- Accessible color-coded status badges

### Components Used
- **shadcn/ui**: Button, Card, Dialog, AlertDialog, Tabs, Badge, Select, Input, Textarea, Label, Separator
- **Lucide Icons**: Comprehensive icon set for all actions
- **date-fns**: Date formatting and manipulation

### Color Coding
- **Blue/Primary**: Active, open requests
- **Yellow/Warning**: Requests in bidding phase
- **Green/Success**: Awarded/accepted items
- **Gray/Secondary**: Closed requests
- **Red/Destructive**: Rejected bids or destructive actions

## Data Flow

### Store Integration
Uses `useSourcingStore` from `frontend/store/sourcing-store.ts`:
- Zustand for state management
- Persisted to localStorage
- Type-safe with TypeScript interfaces

### CRUD Operations
- **Create**: `createRequest()` - Generate new sourcing request
- **Read**: `getOpenRequests()`, `getMyRequests()` - Filtered lists
- **Update**: `updateRequest()` - Modify request details
- **Delete**: `deleteRequest()` - Remove request permanently

### Bid Operations
- **Submit**: `addBid()` - Vendor submits competitive bid
- **Accept**: `acceptBid()` - Buyer accepts specific bid
- **Reject**: `rejectBid()` - Buyer rejects specific bid
- **Award**: `awardRequest()` - Award contract and close request

## Usage Examples

### Creating a Request
1. Click "Create Sourcing Request"
2. Fill in required fields (marked with *)
3. Add specifications if needed
4. Submit to post immediately

### Submitting a Bid
1. Browse open requests
2. Click "Submit Bid" on relevant request
3. Provide pricing and terms
4. Submit to send to buyer

### Awarding a Contract
1. Go to "My Requests" tab
2. Expand request to view bids
3. Click "Award" on preferred bid
4. Confirm to close request and award vendor

## Mock Data
The page uses mock user IDs for demonstration:
- `CURRENT_USER_ID`: 'buyer-123' (for buyers)
- `CURRENT_VENDOR_ID`: 'vendor-456' (for vendors)
- `CURRENT_VENDOR_NAME`: 'Premium Supplies Co.'

In production, these should be replaced with real authentication data.

## File Location
`frontend/app/sourcing/page.tsx`

## Dependencies
- React 18+
- Next.js 14+
- Zustand (state management)
- date-fns (date formatting)
- shadcn/ui (UI components)
- Lucide React (icons)

## Future Enhancements
- [ ] Real-time notifications for new bids
- [ ] File attachments for specifications
- [ ] Vendor ratings and reviews
- [ ] Bid comparison matrix view
- [ ] Export requests/bids to PDF
- [ ] Negotiation messaging system
- [ ] Advanced analytics dashboard
- [ ] Email notifications
- [ ] Multi-currency support
- [ ] Bulk request creation
