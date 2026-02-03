import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { ordersAPI } from '../../../../shared/api/customer-api';
import { usePrice } from '../../hooks/usePrice';

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'pending': return '#f59e0b';
    case 'processing': return '#3b82f6';
    case 'shipped': return '#8b5cf6';
    case 'delivered': return '#10b981';
    case 'cancelled': return '#ef4444';
    default: return '#6b7280';
  }
};

const getStatusIcon = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'pending': return 'time-outline';
    case 'processing': return 'cube-outline';
    case 'shipped': return 'airplane-outline';
    case 'delivered': return 'checkmark-circle-outline';
    case 'cancelled': return 'close-circle-outline';
    default: return 'help-circle-outline';
  }
};

const statusSteps = ['pending', 'processing', 'shipped', 'delivered'];

export default function OrderDetailScreen({ route, navigation }: any) {
  const { orderNumber } = route.params;
  const { formatPrice } = usePrice();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState<any>(null);

  useEffect(() => {
    loadOrder();
    loadTrackingInfo();
  }, [orderNumber]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const data = await ordersAPI.getByNumber(orderNumber);
      setOrder(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load order details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const loadTrackingInfo = async () => {
    try {
      const data = await ordersAPI.trackOrder(orderNumber);
      setTrackingInfo(data);
    } catch (error) {
      // Tracking info may not be available for all orders
      console.log('Tracking info not available:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadOrder(), loadTrackingInfo()]);
    setRefreshing(false);
  };

  const handleCancel = () => {
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            setCancelling(true);
            await ordersAPI.cancel(orderNumber);
            Alert.alert('Success', 'Order cancelled successfully');
            await loadOrder();
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to cancel order');
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  };

  const handleTrack = async () => {
    if (!trackingInfo) {
      await loadTrackingInfo();
      return;
    }

    if (trackingInfo.tracking_url) {
      Linking.openURL(trackingInfo.tracking_url);
    } else if (trackingInfo.tracking_number) {
      Alert.alert(
        'Tracking Information',
        `Tracking Number: ${trackingInfo.tracking_number}\nCarrier: ${trackingInfo.carrier || 'N/A'}\n\nCopy this number to track your package on the carrier's website.`,
        [
          { text: 'OK', style: 'cancel' },
        ]
      );
    } else {
      Alert.alert('Tracking Not Available', 'Tracking information will be available once your order ships.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!order) return null;

  const currentStep = statusSteps.indexOf(order.status?.toLowerCase());
  const isCancelled = order.status?.toLowerCase() === 'cancelled';
  const canCancel = order.status?.toLowerCase() === 'pending';

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Order Header */}
      <View style={styles.headerCard}>
        <View style={styles.orderNumberRow}>
          <Text style={styles.orderNumber}>Order #{order.order_number}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
            <Icon name={getStatusIcon(order.status)} size={14} color="#fff" />
            <Text style={styles.statusText}>{order.status}</Text>
          </View>
        </View>
        <Text style={styles.orderDate}>
          Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
          })}
        </Text>
      </View>

      {/* Status Timeline */}
      {!isCancelled && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Progress</Text>
          <View style={styles.timeline}>
            {statusSteps.map((step, index) => {
              const isActive = index <= currentStep;
              const isCurrent = index === currentStep;
              return (
                <View key={step} style={styles.timelineStep}>
                  <View style={[
                    styles.timelineDot,
                    isActive && styles.timelineDotActive,
                    isCurrent && styles.timelineDotCurrent,
                  ]}>
                    {isActive && <Icon name="checkmark" size={12} color="#fff" />}
                  </View>
                  <Text style={[styles.timelineLabel, isActive && styles.timelineLabelActive]}>
                    {step.charAt(0).toUpperCase() + step.slice(1)}
                  </Text>
                  {index < statusSteps.length - 1 && (
                    <View style={[styles.timelineLine, isActive && styles.timelineLineActive]} />
                  )}
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Tracking Information */}
      {trackingInfo && trackingInfo.tracking_number && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tracking Information</Text>
          <View style={styles.trackingInfo}>
            <View style={styles.trackingRow}>
              <Icon name="cube-outline" size={20} color="#6b7280" />
              <View style={styles.trackingDetails}>
                <Text style={styles.trackingLabel}>Tracking Number</Text>
                <Text style={styles.trackingValue}>{trackingInfo.tracking_number}</Text>
              </View>
            </View>
            {trackingInfo.carrier && (
              <View style={styles.trackingRow}>
                <Icon name="car-outline" size={20} color="#6b7280" />
                <View style={styles.trackingDetails}>
                  <Text style={styles.trackingLabel}>Carrier</Text>
                  <Text style={styles.trackingValue}>{trackingInfo.carrier}</Text>
                </View>
              </View>
            )}
            {trackingInfo.tracking_url && (
              <TouchableOpacity
                style={styles.trackingLinkButton}
                onPress={() => Linking.openURL(trackingInfo.tracking_url)}
              >
                <Icon name="open-outline" size={18} color="#3b82f6" />
                <Text style={styles.trackingLinkText}>Track on Carrier Website</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Tracking History */}
          {trackingInfo.history && trackingInfo.history.length > 0 && (
            <View style={styles.trackingHistory}>
              <Text style={styles.trackingHistoryTitle}>Tracking History</Text>
              {trackingInfo.history.map((event: any, index: number) => (
                <View key={index} style={styles.historyItem}>
                  <View style={styles.historyDot}>
                    <View style={styles.historyDotInner} />
                  </View>
                  <View style={styles.historyContent}>
                    <Text style={styles.historyStatus}>{event.status}</Text>
                    <Text style={styles.historyLocation}>{event.location}</Text>
                    <Text style={styles.historyDate}>
                      {new Date(event.timestamp).toLocaleString()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Estimated Delivery */}
      {order.estimated_delivery && !isCancelled && (
        <View style={styles.card}>
          <View style={styles.estimatedDeliveryRow}>
            <Icon name="calendar-outline" size={20} color="#3b82f6" />
            <View style={styles.estimatedDeliveryText}>
              <Text style={styles.estimatedDeliveryLabel}>Estimated Delivery</Text>
              <Text style={styles.estimatedDeliveryDate}>
                {new Date(order.estimated_delivery).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Order Items */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Items ({order.items?.length || 0})</Text>
        {order.items?.map((item: any, index: number) => (
          <TouchableOpacity
            key={index}
            style={styles.itemRow}
            onPress={() => item.product_id && navigation.navigate('ProductDetail', { id: item.product_id })}
          >
            {item.product_image ? (
              <Image
                source={{ uri: item.product_image }}
                style={styles.itemImage}
              />
            ) : (
              <View style={[styles.itemImage, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' }]}>
                <Icon name="image-outline" size={20} color="#d1d5db" />
              </View>
            )}
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>{item.product_name || 'Product'}</Text>
              {item.variant_name && <Text style={styles.itemQty}>{item.variant_name}</Text>}
              <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
            </View>
            <Text style={styles.itemPrice}>{formatPrice(Number(item.unit_price))}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Order Summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Order Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>{formatPrice(Number(order.subtotal || 0))}</Text>
        </View>
        {order.shipping_amount > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={styles.summaryValue}>{formatPrice(Number(order.shipping_amount))}</Text>
          </View>
        )}
        {order.tax_amount > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax</Text>
            <Text style={styles.summaryValue}>{formatPrice(Number(order.tax_amount))}</Text>
          </View>
        )}
        {order.discount_amount > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Discount</Text>
            <Text style={[styles.summaryValue, { color: '#10b981' }]}>-{formatPrice(Number(order.discount_amount))}</Text>
          </View>
        )}
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatPrice(Number(order.total))}</Text>
        </View>
      </View>

      {/* Shipping Address */}
      {order.shipping_first_name && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Shipping Address</Text>
          <Text style={styles.addressText}>
            {order.shipping_first_name} {order.shipping_last_name}
          </Text>
          <Text style={styles.addressText}>{order.shipping_address_line1}</Text>
          {order.shipping_address_line2 && (
            <Text style={styles.addressText}>{order.shipping_address_line2}</Text>
          )}
          <Text style={styles.addressText}>
            {order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}
          </Text>
          <Text style={styles.addressText}>{order.shipping_country}</Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.trackButton} onPress={handleTrack}>
          <Icon name="location-outline" size={18} color="#3b82f6" />
          <Text style={styles.trackButtonText}>Track Order</Text>
        </TouchableOpacity>

        {canCancel && (
          <TouchableOpacity
            style={[styles.cancelButton, cancelling && { opacity: 0.6 }]}
            onPress={handleCancel}
            disabled={cancelling}
          >
            {cancelling ? (
              <ActivityIndicator size="small" color="#ef4444" />
            ) : (
              <>
                <Icon name="close-circle-outline" size={18} color="#ef4444" />
                <Text style={styles.cancelButtonText}>Cancel Order</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Write Review */}
      {order.status?.toLowerCase() === 'delivered' && order.items?.length > 0 && (
        <View style={styles.reviewSection}>
          <Text style={styles.reviewSectionTitle}>Review Your Items</Text>
          {order.items.map((item: any, index: number) => (
            <TouchableOpacity
              key={index}
              style={styles.reviewButton}
              onPress={() => navigation.navigate('WriteReview', {
                productId: item.product_id,
                productName: item.product_name || 'Product',
              })}
            >
              <Icon name="star-outline" size={18} color="#f59e0b" />
              <Text style={styles.reviewButtonText} numberOfLines={1}>
                Review {item.product_name || 'Product'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  orderNumberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: { fontSize: 12, fontWeight: '600', color: '#fff', marginLeft: 4, textTransform: 'capitalize' },
  orderDate: { fontSize: 13, color: '#6b7280' },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 12 },
  // Timeline
  timeline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 8 },
  timelineStep: { alignItems: 'center', flex: 1 },
  timelineDot: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center',
    marginBottom: 6,
  },
  timelineDotActive: { backgroundColor: '#3b82f6' },
  timelineDotCurrent: { backgroundColor: '#3b82f6', borderWidth: 3, borderColor: '#bfdbfe' },
  timelineLabel: { fontSize: 11, color: '#9ca3af', textAlign: 'center' },
  timelineLabelActive: { color: '#3b82f6', fontWeight: '600' },
  timelineLine: {
    position: 'absolute', top: 12, left: '60%', right: '-40%',
    height: 2, backgroundColor: '#e5e7eb',
  },
  timelineLineActive: { backgroundColor: '#3b82f6' },
  // Items
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemImage: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#f3f4f6' },
  itemInfo: { flex: 1, marginLeft: 12 },
  itemName: { fontSize: 14, fontWeight: '500', color: '#1f2937', marginBottom: 4 },
  itemQty: { fontSize: 12, color: '#6b7280' },
  itemPrice: { fontSize: 15, fontWeight: '600', color: '#1f2937' },
  // Summary
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 14, color: '#6b7280' },
  summaryValue: { fontSize: 14, fontWeight: '500', color: '#1f2937' },
  totalRow: { borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 10, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  totalValue: { fontSize: 16, fontWeight: 'bold', color: '#3b82f6' },
  // Address
  addressText: { fontSize: 14, color: '#4b5563', lineHeight: 22 },
  // Actions
  actionsRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  trackButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    paddingVertical: 12,
  },
  trackButtonText: { fontSize: 14, fontWeight: '600', color: '#3b82f6', marginLeft: 6 },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    paddingVertical: 12,
  },
  cancelButtonText: { fontSize: 14, fontWeight: '600', color: '#ef4444', marginLeft: 6 },
  // Tracking
  trackingInfo: { marginTop: 8 },
  trackingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  trackingDetails: { flex: 1 },
  trackingLabel: { fontSize: 12, color: '#9ca3af', marginBottom: 4 },
  trackingValue: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  trackingLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 8,
    gap: 6,
  },
  trackingLinkText: { fontSize: 14, fontWeight: '600', color: '#3b82f6' },
  trackingHistory: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  trackingHistoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  historyItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  historyDot: {
    width: 24,
    alignItems: 'center',
    paddingTop: 4,
  },
  historyDotInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3b82f6',
    borderWidth: 3,
    borderColor: '#bfdbfe',
  },
  historyContent: {
    flex: 1,
    marginLeft: 12,
  },
  historyStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  historyLocation: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  estimatedDeliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  estimatedDeliveryText: { flex: 1 },
  estimatedDeliveryLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  estimatedDeliveryDate: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3b82f6',
  },
  reviewSection: { paddingHorizontal: 16 },
  reviewSectionTitle: { fontSize: 15, fontWeight: '600', color: '#1f2937', marginBottom: 8 },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fffbeb',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  reviewButtonText: { fontSize: 14, fontWeight: '600', color: '#f59e0b', marginLeft: 6, flex: 1 },
});
