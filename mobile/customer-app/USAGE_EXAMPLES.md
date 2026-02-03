# Mobile App - Feature Usage Examples

This document provides practical examples of how to use the newly implemented features in the Channah mobile customer app.

## Table of Contents
- [Reviews System](#reviews-system)
- [Order Tracking](#order-tracking)
- [Push Notifications](#push-notifications)
- [Search & Filters](#search--filters)
- [Reusable UI Components](#reusable-ui-components)

---

## Reviews System

### Viewing Reviews

```typescript
// From ProductDetailScreen, navigate to full reviews
<TouchableOpacity
  onPress={() => navigation.navigate('Reviews', {
    productId: product.id,
    productName: product.name
  })}
>
  <Text>View All Reviews</Text>
</TouchableOpacity>
```

### Writing a Review

```typescript
// From OrderDetailScreen (after delivery) or ProductDetailScreen
<TouchableOpacity
  onPress={() => navigation.navigate('WriteReview', {
    productId: item.product_id,
    productName: item.product_name
  })}
>
  <Icon name="star-outline" size={18} color="#f59e0b" />
  <Text>Write Review</Text>
</TouchableOpacity>
```

### Review API Integration

```typescript
import { reviewsAPI } from '@/shared/api/customer-api';

// Get all reviews for a product
const reviews = await reviewsAPI.getProductReviews(productId);

// Create a review with photos
const newReview = await reviewsAPI.create({
  product_id: productId,
  rating: 5,
  title: 'Great product!',
  comment: 'I love this product. Highly recommend!',
  images: ['uri1', 'uri2', 'uri3'], // Optional
});

// Update a review
await reviewsAPI.update(reviewId, {
  rating: 4,
  comment: 'Updated my review...'
});

// Delete a review
await reviewsAPI.delete(reviewId);
```

---

## Order Tracking

### Viewing Order Details with Tracking

```typescript
// Navigate to order detail
navigation.navigate('OrderDetail', {
  orderNumber: 'ORD-123456'
});

// The OrderDetailScreen automatically:
// 1. Loads order details
// 2. Fetches tracking information
// 3. Displays tracking timeline
// 4. Shows tracking history
```

### Order Tracking API

```typescript
import { ordersAPI } from '@/shared/api/customer-api';

// Get order with details
const order = await ordersAPI.getByNumber('ORD-123456');

// Get tracking information
const tracking = await ordersAPI.trackOrder('ORD-123456');
// Returns:
// {
//   tracking_number: 'TRK123456',
//   carrier: 'UPS',
//   tracking_url: 'https://...',
//   status: 'shipped',
//   history: [
//     {
//       status: 'Package shipped',
//       location: 'New York, NY',
//       timestamp: '2024-01-15T10:00:00Z'
//     },
//     // More events...
//   ]
// }
```

### Opening Tracking URL

```typescript
import { Linking } from 'react-native';

// Open carrier tracking page in browser
if (trackingInfo.tracking_url) {
  Linking.openURL(trackingInfo.tracking_url);
}
```

---

## Push Notifications

### Setting Up Notifications (In App.tsx)

```typescript
import {
  initPushNotifications,
  handleNotificationRoute,
  registerPushForCurrentUser,
} from './src/services/notifications';

function App() {
  const navigationRef = useRef(null);
  const { user } = useAuthStore();

  useEffect(() => {
    // Initialize push notifications
    const cleanup = await initPushNotifications(
      // Foreground notification received
      (notification) => {
        console.log('Received:', notification);
      },
      // Notification tapped
      (response) => {
        if (navigationRef.current) {
          handleNotificationRoute(
            response.notification.request.content.data,
            navigationRef.current
          );
        }
      }
    );

    return () => cleanup();
  }, []);

  // Register on login
  useEffect(() => {
    if (user) {
      registerPushForCurrentUser();
    }
  }, [user]);

  return (
    <NavigationContainer ref={navigationRef}>
      {/* ... */}
    </NavigationContainer>
  );
}
```

### Notification Types and Routing

The system handles these notification types automatically:

```typescript
// Order updates
{
  type: 'order_update',
  order_number: 'ORD-123456'
}
// → Navigates to: OrderDetailScreen

// New message
{
  type: 'new_message',
  conversation_id: 'conv-123'
}
// → Navigates to: ChatScreen

// Price drop
{
  type: 'price_drop',
  product_id: 'prod-123'
}
// → Navigates to: ProductDetailScreen

// Promotion
{
  type: 'promotion'
}
// → Navigates to: DealsScreen
```

### Managing Notification Settings

```typescript
// Navigate to settings
navigation.navigate('NotificationSettings');

// The NotificationSettingsScreen provides toggles for:
// - Order Updates
// - Price Drops
// - Back in Stock
// - New Messages
// - Promotions & Deals
// - Newsletter
```

### Sending Local Notifications (Testing)

```typescript
import { showLocalNotification } from '@/services/notifications';

// Show a test notification
await showLocalNotification(
  'Order Shipped',
  'Your order has been shipped and is on its way!',
  {
    type: 'order_update',
    order_number: 'ORD-123456'
  }
);
```

---

## Search & Filters

### Basic Search

```typescript
// SearchScreen is already set up with:
// - Debounced search (500ms)
// - Recent searches (AsyncStorage)
// - Popular searches
// - Filters

// Navigate with query
navigation.navigate('Search', {
  query: 'laptop'
});
```

### Using Search with Filters

```typescript
import { productsAPI } from '@/shared/api/customer-api';

// Search with filters
const results = await productsAPI.search('laptop', {
  sort: 'price_asc',           // Sort by price low to high
  min_price: 500,              // Minimum price
  max_price: 1500,             // Maximum price
  min_rating: 4,               // Minimum rating
  category: 'electronics',     // Category slug
});
```

### Managing Recent Searches

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_SEARCHES_KEY = '@recent_searches';

// Save search
const saveRecentSearch = async (query: string) => {
  const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
  const searches = stored ? JSON.parse(stored) : [];

  // Add to front, remove duplicates, limit to 5
  const updated = [query, ...searches.filter(s => s !== query)].slice(0, 5);

  await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
};

// Load searches
const loadRecentSearches = async () => {
  const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
  return stored ? JSON.parse(stored) : [];
};

// Clear all
const clearRecentSearches = async () => {
  await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
};
```

---

## Reusable UI Components

### Loading Skeletons

```typescript
import {
  LoadingSkeleton,
  ProductCardSkeleton,
  ListItemSkeleton,
  ReviewCardSkeleton
} from '@/components/LoadingSkeleton';

// Base skeleton
<LoadingSkeleton width={200} height={20} borderRadius={4} />

// Product card skeleton
<FlatList
  data={loading ? [1, 2, 3, 4] : products}
  renderItem={({ item }) =>
    loading ? <ProductCardSkeleton /> : <ProductCard product={item} />
  }
/>

// List item skeleton
{loading ? (
  <View>
    <ListItemSkeleton />
    <ListItemSkeleton />
    <ListItemSkeleton />
  </View>
) : (
  <FlatList data={items} renderItem={renderItem} />
)}

// Review card skeleton
{loading ? (
  <ReviewCardSkeleton />
) : (
  <ReviewCard review={review} />
)}
```

### Empty States

```typescript
import { EmptyState } from '@/components/EmptyState';

// Basic empty state
<EmptyState
  icon="search-outline"
  title="No results found"
  message="Try searching with different keywords"
/>

// With action button
<EmptyState
  icon="cart-outline"
  title="Your cart is empty"
  message="Browse products and add items to your cart"
  actionLabel="Start Shopping"
  onAction={() => navigation.navigate('Products')}
/>

// Custom styling
<EmptyState
  icon="heart-outline"
  title="No favorites yet"
  message="Save products you love to your wishlist"
  style={{ paddingVertical: 100 }}
/>
```

### Error Views

```typescript
import { ErrorView } from '@/components/ErrorView';

// Basic error view
<ErrorView
  message="Failed to load products"
  onRetry={loadProducts}
/>

// Custom error message
<ErrorView
  message={error || 'Something went wrong'}
  onRetry={handleRetry}
/>

// Without retry button
<ErrorView
  message="This feature is not available"
/>
```

### Pull to Refresh

```typescript
import { RefreshControl } from 'react-native';

function MyScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      }
    >
      {/* Content */}
    </ScrollView>
  );
}
```

---

## Complete Screen Example

Here's a complete example showing all patterns together:

```typescript
import React, { useState, useEffect } from 'react';
import { View, FlatList, RefreshControl } from 'react-native';
import { ProductCardSkeleton } from '@/components/LoadingSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { ErrorView } from '@/components/ErrorView';
import { productsAPI } from '@/shared/api/customer-api';

export default function ProductListScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await productsAPI.getAll();
      setProducts(data.results || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  // Loading state
  if (loading) {
    return (
      <FlatList
        data={[1, 2, 3, 4, 5, 6]}
        numColumns={2}
        renderItem={() => <ProductCardSkeleton />}
      />
    );
  }

  // Error state
  if (error) {
    return <ErrorView message={error} onRetry={loadProducts} />;
  }

  // Empty state
  if (products.length === 0) {
    return (
      <EmptyState
        icon="cube-outline"
        title="No products found"
        message="Check back later for new products"
        actionLabel="Refresh"
        onAction={loadProducts}
      />
    );
  }

  // Content
  return (
    <FlatList
      data={products}
      numColumns={2}
      renderItem={({ item }) => (
        <ProductCard
          product={item}
          onPress={() => navigation.navigate('ProductDetail', {
            slug: item.slug
          })}
        />
      )}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      }
    />
  );
}
```

---

## Best Practices

### Error Handling

```typescript
// Always wrap API calls in try-catch
try {
  const data = await api.call();
  // Handle success
} catch (error) {
  // Show user-friendly message
  Alert.alert('Error', error.message || 'Something went wrong');
  // Log for debugging
  console.error('API Error:', error);
}
```

### Loading States

```typescript
// Use different states for initial load vs refresh
const [loading, setLoading] = useState(true);      // Initial load
const [refreshing, setRefreshing] = useState(false); // Pull to refresh

// Show skeleton on initial load
if (loading) return <Skeleton />;

// Show data with refresh control
return (
  <FlatList
    data={data}
    refreshControl={
      <RefreshControl refreshing={refreshing} onRefresh={refresh} />
    }
  />
);
```

### Navigation

```typescript
// Always pass required params
navigation.navigate('ScreenName', {
  requiredParam: value
});

// Check params before using
const { param } = route.params || {};
if (!param) {
  // Handle missing param
  navigation.goBack();
  return;
}
```

---

## Testing Tips

1. **Test with slow network:**
   - Enable network throttling in dev tools
   - Verify loading states appear
   - Check timeout handling

2. **Test offline mode:**
   - Disable network completely
   - Verify error messages are clear
   - Check retry buttons work

3. **Test edge cases:**
   - Empty lists
   - Single item
   - Very long lists
   - No permissions (camera, notifications)

4. **Test navigation:**
   - Deep links from notifications
   - Back button behavior
   - State preservation

---

## Common Issues & Solutions

### Issue: Notifications not working

**Solution:**
```typescript
// Check permissions
import * as Notifications from 'expo-notifications';

const { status } = await Notifications.getPermissionsAsync();
if (status !== 'granted') {
  const { status: newStatus } = await Notifications.requestPermissionsAsync();
  if (newStatus !== 'granted') {
    Alert.alert('Permission Required', 'Please enable notifications in settings');
  }
}
```

### Issue: Images not loading

**Solution:**
```typescript
// Always provide fallback
{product.image ? (
  <Image source={{ uri: product.image }} style={styles.image} />
) : (
  <View style={[styles.image, styles.placeholder]}>
    <Icon name="image-outline" size={32} color="#ccc" />
  </View>
)}
```

### Issue: Pull-to-refresh not working

**Solution:**
```typescript
// Use ScrollView or FlatList, not View
// ❌ Wrong
<View refreshControl={...}>

// ✅ Correct
<ScrollView refreshControl={...}>
<FlatList refreshControl={...}>
```

---

## Additional Resources

- [React Navigation Docs](https://reactnavigation.org/docs/getting-started)
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/)
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)

---

**Note:** All features are fully implemented and tested. Refer to the actual screen files for complete implementation details.
