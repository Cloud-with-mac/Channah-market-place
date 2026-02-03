import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { customerApiClient } from '../../../../shared/api/client';

const NOTIFICATION_PREFS_KEY = '@notification_preferences';

interface NotificationPreferences {
  orderUpdates: boolean;
  promotions: boolean;
  newMessages: boolean;
  priceDrops: boolean;
  backInStock: boolean;
  newsletter: boolean;
}

const defaultPreferences: NotificationPreferences = {
  orderUpdates: true,
  promotions: true,
  newMessages: true,
  priceDrops: true,
  backInStock: true,
  newsletter: false,
};

export default function NotificationSettingsScreen({ navigation }: any) {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      // Try to load from backend first
      try {
        const response = await customerApiClient.get('/users/me/notification-preferences');
        setPreferences(response.data);
      } catch {
        // Fall back to local storage
        const stored = await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY);
        if (stored) {
          setPreferences(JSON.parse(stored));
        }
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (newPreferences: NotificationPreferences) => {
    try {
      setSaving(true);
      // Save to backend
      await customerApiClient.put('/users/me/notification-preferences', newPreferences);
      // Also save locally
      await AsyncStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(newPreferences));
      setPreferences(newPreferences);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save preferences');
      // Revert the change
      loadPreferences();
    } finally {
      setSaving(false);
    }
  };

  const togglePreference = (key: keyof NotificationPreferences) => {
    const newPreferences = { ...preferences, [key]: !preferences[key] };
    savePreferences(newPreferences);
  };

  const renderSettingItem = (
    key: keyof NotificationPreferences,
    icon: string,
    title: string,
    description: string
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIconContainer}>
        <Icon name={icon} size={24} color="#3b82f6" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={preferences[key]}
        onValueChange={() => togglePreference(key)}
        trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
        thumbColor={preferences[key] ? '#3b82f6' : '#f3f4f6'}
        disabled={saving}
      />
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          Manage your notification preferences to stay informed about what matters to you.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Notifications</Text>
        {renderSettingItem(
          'orderUpdates',
          'receipt-outline',
          'Order Updates',
          'Get notified about order confirmations, shipping, and delivery'
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shopping Notifications</Text>
        {renderSettingItem(
          'priceDrops',
          'trending-down-outline',
          'Price Drops',
          'Get alerts when items in your wishlist go on sale'
        )}
        {renderSettingItem(
          'backInStock',
          'cube-outline',
          'Back in Stock',
          'Be notified when out-of-stock items become available'
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Communication</Text>
        {renderSettingItem(
          'newMessages',
          'chatbubble-outline',
          'New Messages',
          'Receive notifications for new chat messages from vendors'
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Marketing</Text>
        {renderSettingItem(
          'promotions',
          'pricetag-outline',
          'Promotions & Deals',
          'Get exclusive offers and special deals'
        )}
        {renderSettingItem(
          'newsletter',
          'mail-outline',
          'Newsletter',
          'Receive our weekly newsletter with product highlights'
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.infoBox}>
          <Icon name="information-circle-outline" size={20} color="#6b7280" />
          <Text style={styles.infoText}>
            You can change these settings at any time. Some notifications like security alerts
            cannot be disabled.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.clearAllButton}
          onPress={() => {
            Alert.alert(
              'Disable All Notifications?',
              'This will turn off all non-essential notifications. You can enable them again later.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Disable All',
                  style: 'destructive',
                  onPress: () => {
                    const allDisabled = {
                      orderUpdates: false,
                      promotions: false,
                      newMessages: false,
                      priceDrops: false,
                      backInStock: false,
                      newsletter: false,
                    };
                    savePreferences(allDisabled);
                  },
                },
              ]
            );
          }}
        >
          <Icon name="notifications-off-outline" size={20} color="#ef4444" />
          <Text style={styles.clearAllText}>Disable All Notifications</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  headerText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 8,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    paddingVertical: 14,
    gap: 8,
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
});
