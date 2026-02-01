import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { payoutsAPI } from '../../../../../shared/api/vendor-api';

interface Payout {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  paid_at?: string;
  method?: string;
}

export default function PayoutsScreen({ navigation }: any) {
  const [balance, setBalance] = useState<any>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [balanceData, payoutsData] = await Promise.all([
        payoutsAPI.getBalance().catch(() => ({ available: 0, pending: 0, total_earned: 0 })),
        payoutsAPI.list().catch(() => []),
      ]);
      setBalance(balanceData);
      setPayouts(Array.isArray(payoutsData) ? payoutsData : payoutsData.items || []);
    } catch (error) {
      console.error('Failed to load payouts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRequestPayout = () => {
    Alert.alert(
      'Request Payout',
      `Request payout of $${balance?.available?.toFixed(2) || '0.00'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request',
          onPress: async () => {
            setRequesting(true);
            try {
              await payoutsAPI.requestPayout();
              Alert.alert('Success', 'Payout request submitted');
              loadData();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to request payout');
            } finally {
              setRequesting(false);
            }
          },
        },
      ]
    );
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'paid': return { bg: '#d1fae5', text: '#059669' };
      case 'pending': return { bg: '#fef3c7', text: '#d97706' };
      case 'failed': return { bg: '#fee2e2', text: '#dc2626' };
      default: return { bg: '#f3f4f6', text: '#6b7280' };
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#1e40af" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Balance Cards */}
      <View style={styles.balanceSection}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available</Text>
          <Text style={styles.balanceAmount}>${balance?.available?.toFixed(2) || '0.00'}</Text>
        </View>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Pending</Text>
          <Text style={[styles.balanceAmount, { color: '#d97706' }]}>
            ${balance?.pending?.toFixed(2) || '0.00'}
          </Text>
        </View>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Earned</Text>
          <Text style={[styles.balanceAmount, { color: '#059669' }]}>
            ${balance?.total_earned?.toFixed(2) || '0.00'}
          </Text>
        </View>
      </View>

      {/* Request Payout Button */}
      <TouchableOpacity
        style={[styles.requestButton, (requesting || !balance?.available) && styles.buttonDisabled]}
        onPress={handleRequestPayout}
        disabled={requesting || !balance?.available}
      >
        {requesting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Icon name="wallet-outline" size={20} color="#fff" />
            <Text style={styles.requestButtonText}>Request Payout</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Payout History */}
      <Text style={styles.historyTitle}>Payout History</Text>
      <FlatList
        data={payouts}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />
        }
        renderItem={({ item }) => {
          const statusStyle = getStatusStyle(item.status);
          return (
            <View style={styles.payoutItem}>
              <View style={styles.payoutLeft}>
                <Text style={styles.payoutAmount}>${item.amount.toFixed(2)}</Text>
                <Text style={styles.payoutDate}>
                  {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                <Text style={[styles.statusText, { color: statusStyle.text }]}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="cash-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No payouts yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  balanceSection: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  balanceCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  balanceLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  balanceAmount: { fontSize: 18, fontWeight: '700', color: '#1e40af' },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e40af',
    marginHorizontal: 16,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  buttonDisabled: { opacity: 0.5 },
  requestButtonText: { color: '#fff', fontSize: 15, fontWeight: '600', marginLeft: 8 },
  historyTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937', marginLeft: 16, marginBottom: 8 },
  payoutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  payoutLeft: {},
  payoutAmount: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  payoutDate: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', paddingTop: 48 },
  emptyText: { fontSize: 14, color: '#9ca3af', marginTop: 8 },
});
