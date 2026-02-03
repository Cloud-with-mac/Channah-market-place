import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Animated skeleton loader for loading states
 *
 * @example
 * <Skeleton width={200} height={20} borderRadius={4} />
 */
export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

/**
 * Product card skeleton loader
 */
export function ProductCardSkeleton() {
  return (
    <View style={styles.productCard}>
      <Skeleton width="100%" height={150} borderRadius={8} />
      <View style={styles.productInfo}>
        <Skeleton width="80%" height={16} />
        <Skeleton width="60%" height={14} style={{ marginTop: 8 }} />
        <Skeleton width="40%" height={18} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

/**
 * Order item skeleton loader
 */
export function OrderItemSkeleton() {
  return (
    <View style={styles.orderItem}>
      <Skeleton width={80} height={80} borderRadius={8} />
      <View style={styles.orderInfo}>
        <Skeleton width="70%" height={16} />
        <Skeleton width="50%" height={14} style={{ marginTop: 6 }} />
        <Skeleton width="40%" height={14} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

/**
 * List item skeleton loader
 */
export function ListItemSkeleton() {
  return (
    <View style={styles.listItem}>
      <Skeleton width={50} height={50} borderRadius={25} />
      <View style={styles.listContent}>
        <Skeleton width="60%" height={16} />
        <Skeleton width="80%" height={14} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

/**
 * Product detail skeleton loader
 */
export function ProductDetailSkeleton() {
  return (
    <View style={styles.container}>
      <Skeleton width="100%" height={300} />
      <View style={styles.detailContent}>
        <Skeleton width="90%" height={24} />
        <Skeleton width="70%" height={18} style={{ marginTop: 12 }} />
        <Skeleton width="100%" height={16} style={{ marginTop: 12 }} />
        <Skeleton width="100%" height={16} style={{ marginTop: 8 }} />
        <Skeleton width="80%" height={16} style={{ marginTop: 8 }} />
        <Skeleton width="100%" height={48} borderRadius={8} style={{ marginTop: 24 }} />
      </View>
    </View>
  );
}

/**
 * Dashboard stats skeleton loader
 */
export function DashboardStatsSkeleton() {
  return (
    <View style={styles.statsGrid}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.statCard}>
          <Skeleton width={40} height={40} borderRadius={20} />
          <Skeleton width="60%" height={16} style={{ marginTop: 12 }} />
          <Skeleton width="80%" height={24} style={{ marginTop: 8 }} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E5E7EB',
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  productInfo: {
    marginTop: 12,
  },
  orderItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  listContent: {
    flex: 1,
    marginLeft: 12,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  detailContent: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    margin: '1%',
    alignItems: 'center',
  },
});
