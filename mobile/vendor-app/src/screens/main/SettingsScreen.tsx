import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { settingsAPI } from '../../../../../shared/api/vendor-api';

export default function SettingsScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    business_name: '',
    description: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    website: '',
  });
  const [notifications, setNotifications] = useState({
    order_notifications: true,
    review_notifications: true,
    promotional_notifications: false,
    email_notifications: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [profileData, notifData] = await Promise.all([
        settingsAPI.getProfile().catch(() => null),
        settingsAPI.getNotificationSettings().catch(() => null),
      ]);
      if (profileData) {
        setProfile({
          business_name: profileData.business_name || '',
          description: profileData.description || '',
          phone: profileData.phone || '',
          address: profileData.address || '',
          city: profileData.city || '',
          state: profileData.state || '',
          country: profileData.country || '',
          website: profileData.website || '',
        });
      }
      if (notifData) {
        setNotifications(prev => ({ ...prev, ...notifData }));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile.business_name.trim()) {
      Alert.alert('Error', 'Business name is required');
      return;
    }
    setSaving(true);
    try {
      await settingsAPI.updateProfile(profile);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleNotification = async (key: string, value: boolean) => {
    const updated = { ...notifications, [key]: value };
    setNotifications(updated);
    try {
      await settingsAPI.updateNotificationSettings(updated);
    } catch (error) {
      setNotifications(notifications); // revert
      Alert.alert('Error', 'Failed to update notification settings');
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Store Profile */}
      <Text style={styles.sectionTitle}>Store Profile</Text>
      <View style={styles.card}>
        {[
          { key: 'business_name', label: 'Business Name *' },
          { key: 'description', label: 'Description', multiline: true },
          { key: 'phone', label: 'Phone', keyboard: 'phone-pad' as const },
          { key: 'address', label: 'Address' },
          { key: 'city', label: 'City' },
          { key: 'state', label: 'State' },
          { key: 'country', label: 'Country' },
          { key: 'website', label: 'Website', keyboard: 'url' as const },
        ].map(({ key, label, multiline, keyboard }) => (
          <View key={key} style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <TextInput
              style={[styles.fieldInput, multiline && styles.multilineInput]}
              value={(profile as any)[key]}
              onChangeText={(val) => setProfile(prev => ({ ...prev, [key]: val }))}
              placeholder={label.replace(' *', '')}
              placeholderTextColor="#9ca3af"
              multiline={multiline}
              keyboardType={keyboard || 'default'}
            />
          </View>
        ))}

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.buttonDisabled]}
          onPress={handleSaveProfile}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Profile</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Notification Settings */}
      <Text style={styles.sectionTitle}>Notification Settings</Text>
      <View style={styles.card}>
        {[
          { key: 'order_notifications', label: 'Order Updates', desc: 'Get notified about new orders' },
          { key: 'review_notifications', label: 'Review Alerts', desc: 'Get notified about new reviews' },
          { key: 'promotional_notifications', label: 'Promotions', desc: 'Receive promotional notifications' },
          { key: 'email_notifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
        ].map(({ key, label, desc }) => (
          <View key={key} style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>{label}</Text>
              <Text style={styles.switchDesc}>{desc}</Text>
            </View>
            <Switch
              value={(notifications as any)[key]}
              onValueChange={(val) => handleToggleNotification(key, val)}
              trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
              thumbColor={(notifications as any)[key] ? '#1e40af' : '#f4f3f4'}
            />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 40 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1f2937', marginBottom: 12, marginTop: 8 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20 },
  fieldGroup: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '500', color: '#6b7280', marginBottom: 6 },
  fieldInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    fontSize: 15,
    color: '#1f2937',
  },
  multilineInput: { minHeight: 80, textAlignVertical: 'top' },
  saveButton: {
    backgroundColor: '#1e40af',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  switchInfo: { flex: 1, marginRight: 12 },
  switchLabel: { fontSize: 15, fontWeight: '500', color: '#1f2937' },
  switchDesc: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
});
