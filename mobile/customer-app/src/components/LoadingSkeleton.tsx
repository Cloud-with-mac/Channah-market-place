import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';

interface LoadingSkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function LoadingSkeleton({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}: LoadingSkeletonProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <View style={styles.productCard}>
      <LoadingSkeleton height={160} borderRadius={8} />
      <View style={styles.productInfo}>
        <LoadingSkeleton height={16} style={{ marginBottom: 8 }} />
        <LoadingSkeleton height={14} width="60%" style={{ marginBottom: 8 }} />
        <LoadingSkeleton height={18} width="40%" />
      </View>
    </View>
  );
}

export function ListItemSkeleton() {
  return (
    <View style={styles.listItem}>
      <LoadingSkeleton width={60} height={60} borderRadius={8} />
      <View style={styles.listItemInfo}>
        <LoadingSkeleton height={16} style={{ marginBottom: 6 }} />
        <LoadingSkeleton height={14} width="70%" style={{ marginBottom: 6 }} />
        <LoadingSkeleton height={12} width="40%" />
      </View>
    </View>
  );
}

export function ReviewCardSkeleton() {
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <LoadingSkeleton width={100} height={14} />
        <LoadingSkeleton width={80} height={12} />
      </View>
      <LoadingSkeleton height={14} style={{ marginBottom: 6 }} />
      <LoadingSkeleton height={14} width="90%" style={{ marginBottom: 6 }} />
      <LoadingSkeleton height={14} width="70%" />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#e5e7eb',
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  productInfo: {
    marginTop: 12,
  },
  listItem: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  listItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  reviewCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
});
