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
 *
 * Features:
 * - Automatic caching
 * - Placeholder icon for null/undefined URIs
 * - Smooth transitions
 * - Memory efficient
 *
 * @example
 * <ProductImage
 *   uri={product.primary_image}
 *   style={{ width: 150, height: 150 }}
 * />
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
