import React, { useState, useEffect, useCallback } from 'react';
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
import { notificationsAPI } from '../../../../../shared/api/vendor-api';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

const getIcon = (type: string) => {
  switch (type) {
    case 'order': return { name: 'receipt-outline', color: '#1e40af' };
    case 'review': return { name: 'star-outline', color: '#f59e0b' };
    case 'payout': return { name: 'cash-outline', color: '#059669' };
    case 'product': return { name: 'cube-outline', color: '#8b5cf6' };
    default: return { name: 'notifications-outline', color: '#1e40af' };
  }
};

export default function VendorNotificationsScreen({ navigation }: any) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await notificationsAPI.getAll();
      setNotifications(Array.isArray(data) ? data : data.items || []);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'Just now';
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(diff / 3600000);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(diff / 86400000);
    if (day < 7) return `${day}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  if (loading) {
    return <View style={styles.loader}><ActivityIndicator size="large" color="#1e40af" /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        renderItem={({ item }) => {
          const icon = getIcon(item.type);
          return (
            <TouchableOpacity
              style={[styles.item, !item.is_read && styles.unread]}
              onPress={() => handleMarkAsRead(item.id)}
            >
              <View style={[styles.iconBox, { backgroundColor: `${icon.color}15` }]}>
                <Icon name={icon.name} size={22} color={icon.color} />
              </View>
              <View style={styles.content}>
                <View style={styles.headerRow}>
                  <Text style={[styles.title, !item.is_read && styles.boldTitle]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.time}>{formatTime(item.created_at)}</Text>
                </View>
                <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
              </View>
              {!item.is_read && <View style={styles.dot} />}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="notifications-off-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Notifications</Text>
          </View>
        }
        contentContainerStyle={notifications.length === 0 ? { flexGrow: 1 } : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  unread: { backgroundColor: '#eff6ff' },
  iconBox: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  content: { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 15, fontWeight: '500', color: '#1f2937', flex: 1, marginRight: 8 },
  boldTitle: { fontWeight: '700' },
  time: { fontSize: 12, color: '#9ca3af' },
  message: { fontSize: 13, color: '#6b7280', lineHeight: 18 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1e40af', marginLeft: 8 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#6b7280', marginTop: 16 },
});
