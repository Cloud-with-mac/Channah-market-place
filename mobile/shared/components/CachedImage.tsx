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
 *
 * Features:
 * - Automatic disk + memory caching
 * - Loading indicator
 * - Fallback image on error
 * - Smooth fade-in transition
 *
 * @example
 * <CachedImage
 *   uri="https://example.com/image.jpg"
 *   style={{ width: 200, height: 200 }}
 * />
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
