# FlatList Optimization Guide

## Performance Best Practices

### Essential Props for Performance

```typescript
<FlatList
  data={items}
  renderItem={renderItem}

  // CRITICAL: Unique key for each item (prevents re-renders)
  keyExtractor={(item) => item.id}

  // PERFORMANCE: Fixed item height (enables efficient scrolling)
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}

  // MEMORY: Control viewport rendering
  initialNumToRender={10}           // Items to render initially
  maxToRenderPerBatch={5}           // Items per render batch
  windowSize={5}                     // Viewport multiplier (5 = 2.5 screens above + 2.5 below)

  // SCROLL PERFORMANCE
  removeClippedSubviews={true}      // Unmount off-screen items (Android)
  updateCellsBatchingPeriod={50}    // Batch updates every 50ms

  // OPTIONAL: Pull-to-refresh
  refreshing={isRefreshing}
  onRefresh={handleRefresh}

  // OPTIONAL: Infinite scroll
  onEndReached={loadMore}
  onEndReachedThreshold={0.5}       // Trigger at 50% from bottom
/>
```

### Item Height Calculation

#### Fixed Height Items
```typescript
const ITEM_HEIGHT = 120; // px

const getItemLayout = (data: any, index: number) => ({
  length: ITEM_HEIGHT,
  offset: ITEM_HEIGHT * index,
  index,
});
```

#### Variable Height Items
```typescript
// Don't use getItemLayout if heights vary
// FlatList will calculate heights automatically
```

### KeyExtractor Best Practices

```typescript
// ✅ GOOD: Use unique, stable IDs
keyExtractor={(item) => item.id}
keyExtractor={(item) => item.id.toString()}

// ❌ BAD: Using index (causes re-renders on data changes)
keyExtractor={(item, index) => index.toString()}

// ❌ BAD: Generating new keys on each render
keyExtractor={(item) => `${Math.random()}`}
```

### RenderItem Optimization

```typescript
// ✅ GOOD: Memoized component
const ProductItem = React.memo(({ item, onPress }: Props) => {
  return (
    <TouchableOpacity onPress={() => onPress(item.id)}>
      <Text>{item.name}</Text>
    </TouchableOpacity>
  );
});

const renderItem = useCallback(
  ({ item }: { item: Product }) => (
    <ProductItem item={item} onPress={handlePress} />
  ),
  [handlePress]
);

// ❌ BAD: Inline component (recreates on every render)
const renderItem = ({ item }) => (
  <TouchableOpacity onPress={() => console.log(item)}>
    <Text>{item.name}</Text>
  </TouchableOpacity>
);
```

### Separator Components

```typescript
// ✅ GOOD: Memoized separator
const ItemSeparator = React.memo(() => (
  <View style={{ height: 1, backgroundColor: '#E0E0E0' }} />
));

<FlatList
  ItemSeparatorComponent={ItemSeparator}
/>

// ❌ BAD: Inline separator (recreates on every render)
<FlatList
  ItemSeparatorComponent={() => <View style={{ height: 1 }} />}
/>
```

### Empty State

```typescript
const EmptyList = React.memo(() => (
  <View style={styles.emptyContainer}>
    <Text>No items found</Text>
  </View>
));

<FlatList
  ListEmptyComponent={EmptyList}
/>
```

## Common Performance Issues

### 1. Large Images
```typescript
// ✅ GOOD: Use optimized image library
import { Image } from 'expo-image';

<Image
  source={{ uri: product.image }}
  style={{ width: 100, height: 100 }}
  contentFit="cover"
  cachePolicy="memory-disk" // Cache images
/>
```

### 2. Expensive Calculations in renderItem
```typescript
// ❌ BAD: Calculating on every render
const renderItem = ({ item }) => {
  const price = calculatePrice(item); // Expensive!
  return <Text>{price}</Text>;
};

// ✅ GOOD: Pre-calculate or memoize
const items = useMemo(() =>
  rawItems.map(item => ({
    ...item,
    price: calculatePrice(item)
  })),
  [rawItems]
);
```

### 3. Inline Functions
```typescript
// ❌ BAD: Creates new function on every render
<TouchableOpacity onPress={() => handlePress(item.id)}>

// ✅ GOOD: Stable function reference
const handleItemPress = useCallback((id: string) => {
  handlePress(id);
}, [handlePress]);

<TouchableOpacity onPress={() => handleItemPress(item.id)}>
```

## Performance Metrics

### windowSize Impact
- `windowSize={5}` (default): 2.5 screens above + 2.5 screens below
- `windowSize={10}`: 5 screens above + 5 screens below (more memory, smoother scroll)
- `windowSize={2}`: 1 screen above + 1 screen below (less memory, may see blank areas)

### Memory vs. Smoothness Trade-off
- **More items rendered** = Smoother scrolling, higher memory usage
- **Fewer items rendered** = Lower memory, possible blank areas during fast scroll

## Testing Performance

```typescript
// Add performance monitoring (development only)
if (__DEV__) {
  console.log('FlatList rendered', items.length, 'items');
}

// Monitor scroll performance
const onScrollBeginDrag = () => {
  console.time('scroll');
};

const onScrollEndDrag = () => {
  console.timeEnd('scroll');
};

<FlatList
  onScrollBeginDrag={onScrollBeginDrag}
  onScrollEndDrag={onScrollEndDrag}
/>
```

## Checklist

- [ ] `keyExtractor` uses unique, stable IDs
- [ ] `getItemLayout` defined for fixed-height items
- [ ] `renderItem` uses memoized component
- [ ] Callbacks wrapped in `useCallback`
- [ ] Separator/Empty components memoized
- [ ] Images optimized and cached
- [ ] No expensive calculations in renderItem
- [ ] `initialNumToRender` set appropriately
- [ ] `removeClippedSubviews={true}` on Android
- [ ] Pull-to-refresh implemented (if needed)
- [ ] Infinite scroll implemented (if needed)
