# Mobile App Feature Index

Quick reference guide to find specific features and components in the codebase.

## New Features (This Update)

| Feature | Location | Description |
|---------|----------|-------------|
| **Reviews Screen** | `src/screens/main/ReviewsScreen.tsx` | Full list of reviews with filtering and sorting |
| **Photo Upload** | `src/screens/main/WriteReviewScreen.tsx` | Upload photos when writing reviews |
| **Order Tracking** | `src/screens/main/OrderDetailScreen.tsx` | Enhanced tracking timeline and history |
| **Notification Settings** | `src/screens/main/NotificationSettingsScreen.tsx` | Manage push notification preferences |
| **Loading Skeletons** | `src/components/LoadingSkeleton.tsx` | Reusable loading state components |
| **Empty States** | `src/components/EmptyState.tsx` | Reusable empty state component |
| **Error Views** | `src/components/ErrorView.tsx` | Reusable error component with retry |

## Screen Directory

### Main App Screens
```
src/screens/main/
├── HomeScreen.tsx                    - Dashboard with featured products
├── ProductsScreen.tsx                - Browse all products with filters
├── ProductDetailScreen.tsx           - Product details with reviews
├── ReviewsScreen.tsx                 - ✅ NEW: Full review list
├── WriteReviewScreen.tsx             - ✅ ENHANCED: Write review with photos
├── CartScreen.tsx                    - Shopping cart
├── CheckoutScreen.tsx                - Checkout flow
├── OrdersScreen.tsx                  - Order history
├── OrderDetailScreen.tsx             - ✅ ENHANCED: Order tracking
├── SearchScreen.tsx                  - Search with autocomplete
├── WishlistScreen.tsx                - Saved products
├── ProfileScreen.tsx                 - User profile
├── NotificationsScreen.tsx           - Notification inbox
├── NotificationSettingsScreen.tsx    - ✅ NEW: Push preferences
├── ChatScreen.tsx                    - Messaging
├── VendorProfileScreen.tsx           - Vendor store page
├── AddressesScreen.tsx               - Manage addresses
├── CategoryBrowseScreen.tsx          - Browse categories
├── DealsScreen.tsx                   - Hot deals
├── BestSellersScreen.tsx             - Top products
├── NewArrivalsScreen.tsx             - Latest products
├── RFQListScreen.tsx                 - Request for quotes
├── RFQCreateScreen.tsx               - Create RFQ
└── RFQDetailScreen.tsx               - RFQ details
```

### Auth Screens
```
src/screens/auth/
├── LoginScreen.tsx                   - Sign in
├── RegisterScreen.tsx                - Sign up
└── ForgotPasswordScreen.tsx          - Password reset
```

### Info Screens
```
src/screens/info/
├── AboutScreen.tsx                   - About company
├── TermsScreen.tsx                   - Terms of service
├── PrivacyScreen.tsx                 - Privacy policy
├── HelpScreen.tsx                    - Help & FAQ
└── ContactScreen.tsx                 - Contact form
```

## Component Directory

```
src/components/
├── LoadingSkeleton.tsx               - ✅ NEW: Loading animations
├── EmptyState.tsx                    - ✅ NEW: Empty state views
├── ErrorView.tsx                     - ✅ NEW: Error displays
├── CurrencySelector.tsx              - Currency picker
└── ErrorBoundary.tsx                 - Error boundary wrapper
```

## Service Directory

```
src/services/
└── notifications.ts                  - ✅ ENHANCED: Push notifications
```

## Store (State Management)

```
src/store/
├── authStore.ts                      - Authentication state
├── cartStore.ts                      - Shopping cart state
└── currencyStore.ts                  - Currency preferences
```

## API Integration

```
shared/api/
└── customer-api.ts                   - All API endpoints
    ├── authAPI                       - Auth operations
    ├── productsAPI                   - Product operations
    ├── reviewsAPI                    - Review operations ✅
    ├── ordersAPI                     - Order operations ✅
    ├── cartAPI                       - Cart operations
    ├── wishlistAPI                   - Wishlist operations
    ├── notificationsAPI              - Notifications ✅
    └── [more APIs...]
```

## Key Features by Category

### 🛒 Shopping
- **Product Browsing**: `ProductsScreen.tsx`, `HomeScreen.tsx`
- **Product Details**: `ProductDetailScreen.tsx`
- **Search**: `SearchScreen.tsx`
- **Cart**: `CartScreen.tsx`
- **Checkout**: `CheckoutScreen.tsx`
- **Wishlist**: `WishlistScreen.tsx`

### 📦 Orders
- **Order History**: `OrdersScreen.tsx`
- **Order Details**: `OrderDetailScreen.tsx` ✅ Enhanced
- **Order Tracking**: Integrated in `OrderDetailScreen.tsx` ✅ NEW
- **RFQ System**: `RFQListScreen.tsx`, `RFQCreateScreen.tsx`, `RFQDetailScreen.tsx`

### ⭐ Reviews
- **Write Review**: `WriteReviewScreen.tsx` ✅ Enhanced
- **View Reviews**: `ReviewsScreen.tsx` ✅ NEW
- **Product Reviews**: Section in `ProductDetailScreen.tsx`

### 🔔 Notifications
- **Push Setup**: `src/services/notifications.ts` ✅ Enhanced
- **Settings**: `NotificationSettingsScreen.tsx` ✅ NEW
- **Inbox**: `NotificationsScreen.tsx`
- **Integration**: `App.tsx` ✅ Enhanced

### 💬 Communication
- **Chat**: `ChatScreen.tsx`
- **Vendor Contact**: Via `VendorProfileScreen.tsx`

### 👤 Account
- **Profile**: `ProfileScreen.tsx`
- **Addresses**: `AddressesScreen.tsx`
- **Login/Register**: `src/screens/auth/`

## Quick Search Guide

### "Where is...?"

| Looking for | File Location |
|-------------|---------------|
| Review list with filters | `src/screens/main/ReviewsScreen.tsx` |
| Photo upload for reviews | `src/screens/main/WriteReviewScreen.tsx` |
| Order tracking timeline | `src/screens/main/OrderDetailScreen.tsx` |
| Push notification setup | `src/services/notifications.ts` |
| Notification preferences | `src/screens/main/NotificationSettingsScreen.tsx` |
| Loading skeletons | `src/components/LoadingSkeleton.tsx` |
| Empty state component | `src/components/EmptyState.tsx` |
| Error view component | `src/components/ErrorView.tsx` |
| Search with filters | `src/screens/main/SearchScreen.tsx` |
| Navigation setup | `App.tsx` |

### "How do I...?"

| Task | Reference |
|------|-----------|
| Add a new screen | See `App.tsx` Stack.Navigator |
| Create a loading state | Use `<ProductCardSkeleton />` |
| Show empty state | Use `<EmptyState />` component |
| Handle errors | Use `<ErrorView />` component |
| Navigate to reviews | `navigation.navigate('Reviews', { productId, productName })` |
| Add pull-to-refresh | Add `RefreshControl` to `ScrollView`/`FlatList` |
| Setup notifications | See `USAGE_EXAMPLES.md` |
| Filter reviews | See `ReviewsScreen.tsx` implementation |

## API Endpoint Quick Reference

### Reviews
```typescript
reviewsAPI.getProductReviews(productId)  // Get all reviews
reviewsAPI.create(data)                   // Create review
reviewsAPI.update(id, data)               // Update review
reviewsAPI.delete(id)                     // Delete review
```

### Orders
```typescript
ordersAPI.list()                          // Get all orders
ordersAPI.getByNumber(orderNumber)        // Get order details
ordersAPI.trackOrder(orderNumber)         // Get tracking info ✅
ordersAPI.cancel(orderNumber)             // Cancel order
```

### Notifications
```typescript
notificationsAPI.getAll()                 // Get all notifications
notificationsAPI.markAsRead(id)           // Mark one as read
notificationsAPI.markAllAsRead()          // Mark all as read
```

### Products
```typescript
productsAPI.getAll(params)                // List products
productsAPI.getBySlug(slug)               // Get by slug
productsAPI.search(query, params)         // Search products
productsAPI.getFeatured()                 // Featured products
productsAPI.getNewArrivals()              // New arrivals
productsAPI.getBestSellers()              // Best sellers
```

## Navigation Routes

```typescript
// Main tabs
'Home'                  → HomeScreen
'Products'              → ProductsScreen
'Cart'                  → CartScreen
'Profile'               → ProfileScreen

// Stack screens
'ProductDetail'         → ProductDetailScreen
'Reviews'               → ReviewsScreen ✅ NEW
'WriteReview'           → WriteReviewScreen
'OrderDetail'           → OrderDetailScreen
'NotificationSettings'  → NotificationSettingsScreen ✅ NEW
'Search'                → SearchScreen
'Checkout'              → CheckoutScreen
'Orders'                → OrdersScreen
'Wishlist'              → WishlistScreen
'Chat'                  → ChatScreen
'VendorProfile'         → VendorProfileScreen
// ... more routes
```

## File Sizes (Approximate)

| File | Lines | Complexity |
|------|-------|------------|
| ReviewsScreen.tsx | ~450 | Medium |
| WriteReviewScreen.tsx | ~200 | Low |
| OrderDetailScreen.tsx | ~400 | Medium |
| NotificationSettingsScreen.tsx | ~250 | Low |
| LoadingSkeleton.tsx | ~120 | Low |
| EmptyState.tsx | ~60 | Low |
| ErrorView.tsx | ~70 | Low |
| notifications.ts | ~220 | Medium |

## Testing Checklist by Feature

### Reviews
- [ ] View product reviews
- [ ] Filter by rating
- [ ] Sort reviews
- [ ] Write review
- [ ] Upload photos
- [ ] Submit review

### Order Tracking
- [ ] View order status
- [ ] See tracking timeline
- [ ] View tracking history
- [ ] Open tracking URL
- [ ] Pull to refresh

### Notifications
- [ ] Receive push notification
- [ ] Tap notification (navigate)
- [ ] Change preferences
- [ ] Disable all notifications

### Search
- [ ] Search products
- [ ] Apply filters
- [ ] View recent searches
- [ ] Clear recent searches

### UI/UX
- [ ] Loading skeletons show
- [ ] Empty states display
- [ ] Error messages appear
- [ ] Retry buttons work
- [ ] Pull-to-refresh works

## Common Code Patterns

### Screen Structure
```typescript
export default function MyScreen({ navigation, route }: any) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => { /* ... */ };
  const handleRefresh = async () => { /* ... */ };

  if (loading) return <Skeleton />;
  if (error) return <ErrorView />;
  if (!data.length) return <EmptyState />;

  return <FlatList data={data} refreshControl={...} />;
}
```

### API Call Pattern
```typescript
try {
  setLoading(true);
  const response = await api.call();
  setData(response.results || response);
} catch (error) {
  setError(error.message);
  Alert.alert('Error', error.message);
} finally {
  setLoading(false);
}
```

## Version Control

- **Branch**: master
- **Last Updated**: 2026-02-03
- **Major Changes**:
  - ✅ Added ReviewsScreen with filtering
  - ✅ Enhanced WriteReviewScreen with photos
  - ✅ Enhanced OrderDetailScreen with tracking
  - ✅ Added NotificationSettingsScreen
  - ✅ Created reusable UI components
  - ✅ Integrated push notifications

## Support & Documentation

- **Main Documentation**: `MOBILE_APP_ENHANCEMENTS.md`
- **Usage Examples**: `USAGE_EXAMPLES.md`
- **This Index**: `FEATURE_INDEX.md`

---

**Pro Tip**: Use Ctrl+F (or Cmd+F) to quickly search this document for specific features or file names!
