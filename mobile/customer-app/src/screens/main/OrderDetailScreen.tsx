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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { ordersAPI } from '../../../../shared/api/customer-api';

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
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadOrder();
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
    try {
      const tracking = await ordersAPI.trackOrder(orderNumber);
      Alert.alert(
        'Order Tracking',
        tracking.tracking_number
          ? `Tracking Number: ${tracking.tracking_number}\nCarrier: ${tracking.carrier || 'N/A'}`
          : 'Tracking information not available yet'
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to get tracking info');
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
    <ScrollView style={styles.container}>
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

      {/* Order Items */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Items ({order.items?.length || 0})</Text>
        {order.items?.map((item: any, index: number) => (
          <TouchableOpacity
            key={index}
            style={styles.itemRow}
            onPress={() => item.product?.slug && navigation.navigate('ProductDetail', { slug: item.product.slug })}
          >
            <Image
              source={{ uri: item.product?.images?.[0]?.image || 'https://via.placeholder.com/60' }}
              style={styles.itemImage}
            />
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>{item.product?.name || 'Product'}</Text>
              <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
            </View>
            <Text style={styles.itemPrice}>${item.price}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Order Summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Order Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>${order.subtotal || '0.00'}</Text>
        </View>
        {order.shipping_amount > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={styles.summaryValue}>${order.shipping_amount}</Text>
          </View>
        )}
        {order.tax_amount > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax</Text>
            <Text style={styles.summaryValue}>${order.tax_amount}</Text>
          </View>
        )}
        {order.discount_amount > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Discount</Text>
            <Text style={[styles.summaryValue, { color: '#10b981' }]}>-${order.discount_amount}</Text>
          </View>
        )}
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${order.total}</Text>
        </View>
      </View>

      {/* Shipping Address */}
      {order.shipping_address && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Shipping Address</Text>
          <Text style={styles.addressText}>
            {order.shipping_address.full_name || `${order.shipping_address.first_name || ''} ${order.shipping_address.last_name || ''}`}
          </Text>
          <Text style={styles.addressText}>{order.shipping_address.address_line_1}</Text>
          {order.shipping_address.address_line_2 && (
            <Text style={styles.addressText}>{order.shipping_address.address_line_2}</Text>
          )}
          <Text style={styles.addressText}>
            {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip_code}
          </Text>
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
      {order.status?.toLowerCase() === 'delivered' && (
        <TouchableOpacity
          style={styles.reviewButton}
          onPress={() => navigation.navigate('WriteReview', { orderId: order.id })}
        >
          <Icon name="star-outline" size={18} color="#f59e0b" />
          <Text style={styles.reviewButtonText}>Write a Review</Text>
        </TouchableOpacity>
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
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fffbeb',
    borderRadius: 8,
    paddingVertical: 12,
    marginHorizontal: 16,
  },
  reviewButtonText: { fontSize: 14, fontWeight: '600', color: '#f59e0b', marginLeft: 6 },
});
