import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { ordersAPI } from '../../../../shared/api/customer-api';

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'pending':
      return '#f59e0b';
    case 'processing':
      return '#3b82f6';
    case 'shipped':
      return '#8b5cf6';
    case 'delivered':
      return '#10b981';
    case 'cancelled':
      return '#ef4444';
    default:
      return '#6b7280';
  }
};

const getStatusIcon = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'pending':
      return 'time-outline';
    case 'processing':
      return 'cube-outline';
    case 'shipped':
      return 'airplane-outline';
    case 'delivered':
      return 'checkmark-circle-outline';
    case 'cancelled':
      return 'close-circle-outline';
    default:
      return 'help-circle-outline';
  }
};

export default function OrdersScreen({ navigation }: any) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await ordersAPI.list();
      const ordersList = Array.isArray(response) ? response : response.results || [];
      setOrders(ordersList);
    } catch (error: any) {
      console.error('Failed to load orders:', error);
      Alert.alert('Error', error.message || 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCancelOrder = async (orderNumber: string) => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelling(orderNumber);
              await ordersAPI.cancel(orderNumber);
              Alert.alert('Success', 'Order cancelled successfully');
              await loadOrders();
            } catch (error: any) {
              console.error('Failed to cancel order:', error);
              Alert.alert('Error', error.message || 'Failed to cancel order');
            } finally {
              setCancelling(null);
            }
          },
        },
      ]
    );
  };

  const handleTrackOrder = async (orderNumber: string) => {
    try {
      const tracking = await ordersAPI.trackOrder(orderNumber);
      Alert.alert(
        'Order Tracking',
        tracking.tracking_number
          ? `Tracking Number: ${tracking.tracking_number}\n\nCarrier: ${tracking.carrier || 'N/A'}`
          : 'Tracking information not available yet'
      );
    } catch (error: any) {
      console.error('Failed to track order:', error);
      Alert.alert('Error', error.message || 'Failed to get tracking information');
    }
  };

  const handleViewOrder = (orderNumber: string) => {
    navigation.navigate('OrderDetail', { orderNumber });
  };

  const renderOrderItem = ({ item }: any) => {
    const isCancelling = cancelling === item.order_number;
    const canCancel = item.status?.toLowerCase() === 'pending';
    const statusColor = getStatusColor(item.status);
    const statusIcon = getStatusIcon(item.status);

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => handleViewOrder(item.order_number)}
        activeOpacity={0.7}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderNumberRow}>
            <Icon name="receipt-outline" size={18} color="#6b7280" />
            <Text style={styles.orderNumber}>#{item.order_number}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Icon name={statusIcon} size={14} color="#fff" />
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.orderInfo}>
          <View style={styles.infoRow}>
            <Icon name="calendar-outline" size={16} color="#6b7280" />
            <Text style={styles.infoText}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Icon name="cube-outline" size={16} color="#6b7280" />
            <Text style={styles.infoText}>
              {item.items?.length || 0} item(s)
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Icon name="cash-outline" size={16} color="#6b7280" />
            <Text style={styles.totalText}>${item.total}</Text>
          </View>
        </View>

        {/* Order Items Preview */}
        {item.items && item.items.length > 0 && (
          <View style={styles.itemsPreview}>
            {item.items.slice(0, 2).map((orderItem: any, index: number) => (
              <Text key={index} style={styles.itemPreviewText} numberOfLines={1}>
                • {orderItem.product?.name || 'Product'} x{orderItem.quantity}
              </Text>
            ))}
            {item.items.length > 2 && (
              <Text style={styles.moreItemsText}>
                +{item.items.length - 2} more item(s)
              </Text>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.trackButton}
            onPress={() => handleTrackOrder(item.order_number)}
          >
            <Icon name="location-outline" size={16} color="#3b82f6" />
            <Text style={styles.trackButtonText}>Track</Text>
          </TouchableOpacity>

          {canCancel && (
            <TouchableOpacity
              style={[styles.cancelButton, isCancelling && styles.buttonDisabled]}
              onPress={() => handleCancelOrder(item.order_number)}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <ActivityIndicator size="small" color="#ef4444" />
              ) : (
                <>
                  <Icon name="close-circle-outline" size={16} color="#ef4444" />
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => handleViewOrder(item.order_number)}
          >
            <Text style={styles.viewButtonText}>View Details</Text>
            <Icon name="chevron-forward" size={16} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="bag-outline" size={64} color="#9ca3af" />
      <Text style={styles.emptyText}>No orders yet</Text>
      <Text style={styles.emptySubtext}>
        Start shopping to create your first order
      </Text>
      <TouchableOpacity
        style={styles.shopButton}
        onPress={() => navigation.navigate('Products')}
      >
        <Text style={styles.shopButtonText}>Start Shopping</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
        <Text style={styles.headerSubtitle}>{orders.length} order(s)</Text>
      </View>

      {/* Orders List */}
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id?.toString() || item.order_number || Math.random().toString()}
        contentContainerStyle={orders.length === 0 ? styles.emptyList : styles.listContent}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadOrders(true)}
            colors={['#3b82f6']}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  listContent: {
    padding: 16,
  },
  emptyList: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 4,
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginLeft: 4,
  },
  itemsPreview: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  itemPreviewText: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  moreItemsText: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  trackButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3b82f6',
    marginLeft: 4,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    marginRight: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
