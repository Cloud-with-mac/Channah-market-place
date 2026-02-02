import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { rfqAPI } from '../../../../shared/api/customer-api';
import { useAuthStore } from '../../store/authStore';

const STATUS_COLORS: Record<string, string> = {
  open: '#3b82f6',
  quoted: '#f59e0b',
  awarded: '#22c55e',
  closed: '#6b7280',
  draft: '#9ca3af',
  negotiating: '#8b5cf6',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  quoted: 'Quoted',
  awarded: 'Awarded',
  closed: 'Closed',
  draft: 'Draft',
  negotiating: 'Negotiating',
};

export default function RFQListScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRFQs = async () => {
    try {
      const data = await rfqAPI.getAll();
      const items = Array.isArray(data) ? data : data?.results || data?.items || [];
      setRfqs(items);
    } catch (error: any) {
      // silently handle - show empty state
      setRfqs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadRFQs();
      } else {
        setLoading(false);
      }
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadRFQs();
  };

  if (!user) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="lock-closed-outline" size={64} color="#9ca3af" />
        <Text style={styles.emptyTitle}>Sign In Required</Text>
        <Text style={styles.emptyText}>Please sign in to view your quote requests.</Text>
        <TouchableOpacity style={styles.signInButton} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.signInButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const renderItem = ({ item }: { item: any }) => {
    const status = (item.status || 'open').toLowerCase();
    const statusColor = STATUS_COLORS[status] || '#6b7280';
    const quotesCount = item.quotes_count ?? item.quotes?.length ?? 0;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('RFQDetail', { rfqId: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title || item.product_name || item.productName || 'Untitled RFQ'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {STATUS_LABELS[status] || status}
            </Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardRow}>
            <Icon name="cube-outline" size={16} color="#6b7280" />
            <Text style={styles.cardRowText}>Qty: {item.quantity || '-'}</Text>
          </View>
          <View style={styles.cardRow}>
            <Icon name="chatbubbles-outline" size={16} color="#6b7280" />
            <Text style={styles.cardRowText}>{quotesCount} quote{quotesCount !== 1 ? 's' : ''} received</Text>
          </View>
          <View style={styles.cardRow}>
            <Icon name="calendar-outline" size={16} color="#6b7280" />
            <Text style={styles.cardRowText}>
              {item.created_at || item.createdAt
                ? new Date(item.created_at || item.createdAt).toLocaleDateString()
                : '-'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={rfqs}
        keyExtractor={(item) => item.id?.toString()}
        renderItem={renderItem}
        contentContainerStyle={rfqs.length === 0 ? styles.emptyList : styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="document-text-outline" size={64} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No quote requests yet</Text>
            <Text style={styles.emptyText}>
              Request custom pricing from any product page!
            </Text>
          </View>
        }
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('RFQCreate')}
        activeOpacity={0.8}
      >
        <Icon name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  emptyList: { flex: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1f2937', marginTop: 16 },
  emptyText: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginTop: 8 },
  signInButton: { backgroundColor: '#3b82f6', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 32, marginTop: 20 },
  signInButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937', flex: 1, marginRight: 12 },
  statusBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
  cardBody: { gap: 6 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardRowText: { fontSize: 13, color: '#6b7280' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
