# Image Caching Strategy - Mobile Apps

## Overview

This guide implements automatic image caching using `expo-image` for better performance and offline support.

## Why expo-image?

- **Automatic caching**: Caches images to disk automatically
- **Memory management**: Better memory handling than React Native Image
- **Placeholder support**: Blurhash, thumbhash, and transition effects
- **Performance**: Hardware-accelerated rendering
- **Cross-platform**: Works on iOS, Android, and web

## Installation

```bash
cd mobile/customer-app
npx expo install expo-image

cd ../vendor-app
npx expo install expo-image
```

## Basic Usage

### Replace React Native Image

```typescript
// ❌ OLD: React Native Image (no caching)
import { Image } from 'react-native';

<Image
  source={{ uri: 'https://example.com/image.jpg' }}
  style={{ width: 100, height: 100 }}
  resizeMode="cover"
/>

// ✅ NEW: Expo Image (with automatic caching)
import { Image } from 'expo-image';

<Image
  source={{ uri: 'https://example.com/image.jpg' }}
  style={{ width: 100, height: 100 }}
  contentFit="cover"
  cachePolicy="memory-disk"  // Cache to memory and disk
  transition={200}            // Smooth fade-in
/>
```

## Cache Policies

```typescript
// Memory + Disk caching (recommended for most images)
<Image cachePolicy="memory-disk" />

// Memory only (for temporary/frequently changing images)
<Image cachePolicy="memory" />

// Disk only (for large images to save memory)
<Image cachePolicy="disk" />

// No caching (for secure/private images)
<Image cachePolicy="none" />
```

## Optimized Image Component

Create `mobile/shared/components/CachedImage.tsx`:

```typescript
import React from 'react';
import { Image, ImageProps } from 'expo-image';
import { View, StyleSheet, ActivityIndicator } from 'react-native';

interface CachedImageProps extends Omit<ImageProps, 'source'> {
  uri: string;
  fallback?: string;
  showLoader?: boolean;
}

/**
 * Optimized cached image with loading state and fallback
 */
export function CachedImage({
  uri,
  fallback = 'https://via.placeholder.com/400x400?text=No+Image',
  showLoader = true,
  style,
  ...props
}: CachedImageProps) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  return (
    <View style={[styles.container, style]}>
      <Image
        source={{ uri: error ? fallback : uri }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={200}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
        {...props}
      />
      {loading && showLoader && (
        <View style={styles.loader}>
          <ActivityIndicator size="small" color="#3b82f6" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
});
```

## Product Image Component

Create `mobile/shared/components/ProductImage.tsx`:

```typescript
import React from 'react';
import { Image } from 'expo-image';
import { View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface ProductImageProps {
  uri: string | null | undefined;
  style?: any;
  contentFit?: 'cover' | 'contain' | 'fill';
}

/**
 * Product image with placeholder icon for missing images
 */
export function ProductImage({ uri, style, contentFit = 'cover' }: ProductImageProps) {
  if (!uri) {
    return (
      <View style={[styles.placeholder, style]}>
        <Icon name="image-outline" size={48} color="#d1d5db" />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={style}
      contentFit={contentFit}
      cachePolicy="memory-disk"
      transition={200}
      placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }} // Generic blurhash
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

## Preloading Images

```typescript
import { Image } from 'expo-image';

// Preload critical images on app start
async function preloadImages() {
  const imagesToPreload = [
    'https://example.com/logo.png',
    'https://example.com/banner.jpg',
  ];

  await Promise.all(
    imagesToPreload.map(uri => Image.prefetch(uri))
  );
}

// In App.tsx or similar
useEffect(() => {
  preloadImages();
}, []);
```

## Clearing Cache

```typescript
import { Image } from 'expo-image';

// Clear all cached images
async function clearImageCache() {
  await Image.clearDiskCache();
  await Image.clearMemoryCache();
}

// Clear specific image
async function clearSpecificImage(uri: string) {
  await Image.clearDiskCache(uri);
}
```

## Usage in FlatList

```typescript
import { FlatList } from 'react-native';
import { ProductImage } from '../../shared/components/ProductImage';

const renderProduct = ({ item }) => (
  <View>
    <ProductImage
      uri={item.primary_image}
      style={{ width: 150, height: 150 }}
    />
  </View>
);

<FlatList
  data={products}
  renderItem={renderProduct}
  // ... other props
/>
```

## Performance Tips

### 1. Image Dimensions
```typescript
// ✅ GOOD: Specify dimensions
<Image
  source={{ uri }}
  style={{ width: 100, height: 100 }}
/>

// ❌ BAD: No dimensions (causes layout shifts)
<Image source={{ uri }} />
```

### 2. Use Appropriate Sizes
```typescript
// Request appropriately sized images from backend
const imageUrl = `https://api.example.com/images/${id}?width=400&height=400`;

// Don't load 4K images for 100x100 thumbnails
```

### 3. Lazy Loading
```typescript
// Only load images when they enter viewport
<FlatList
  data={products}
  renderItem={renderProduct}
  initialNumToRender={10}
  // Images outside viewport won't load until scrolled
/>
```

### 4. Recycling
```typescript
// expo-image automatically recycles image views
// No additional configuration needed
```

## Migration Checklist

- [ ] Install expo-image in both mobile apps
- [ ] Create CachedImage component in shared folder
- [ ] Create ProductImage component in shared folder
- [ ] Replace React Native Image imports with expo-image
- [ ] Update product cards to use ProductImage
- [ ] Update avatar images to use CachedImage
- [ ] Update banner images to use CachedImage
- [ ] Add preloading for critical images
- [ ] Test cache behavior (airplane mode)
- [ ] Monitor memory usage with large lists

## Testing Cache

```typescript
// Test offline image loading
// 1. Load images while online
// 2. Turn on airplane mode
// 3. Close and reopen app
// 4. Images should load from cache
```

## Cache Storage

- **iOS**: `Library/Caches/expo-image/`
- **Android**: `cache/expo-image/`
- **Automatic cleanup**: When device storage is low

## Benefits

✅ **Faster loading**: Images cached on device
✅ **Offline support**: View cached images offline
✅ **Reduced bandwidth**: Only download once
✅ **Better UX**: Smooth transitions and placeholders
✅ **Lower memory**: Better memory management than RN Image
✅ **Zero configuration**: Works out of the box

## Documentation

- [Expo Image Docs](https://docs.expo.dev/versions/latest/sdk/image/)
- [Caching Guide](https://docs.expo.dev/versions/latest/sdk/image/#caching)
- [Performance Tips](https://docs.expo.dev/versions/latest/sdk/image/#performance)
