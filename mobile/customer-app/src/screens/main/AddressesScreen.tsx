import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { addressesAPI } from '../../../../shared/api/customer-api';

interface Address {
  id: string;
  label?: string;
  first_name: string;
  last_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default_shipping: boolean;
}

const emptyForm = {
  label: '',
  first_name: '',
  last_name: '',
  phone: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: '',
};

export default function AddressesScreen({ navigation }: any) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadAddresses = useCallback(async () => {
    try {
      const data = await addressesAPI.getAll();
      setAddresses(Array.isArray(data) ? data : data.items || []);
    } catch (error) {
      console.error('Failed to load addresses:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (addr: Address) => {
    setForm({
      label: addr.label || '',
      first_name: addr.first_name,
      last_name: addr.last_name,
      phone: addr.phone,
      address_line1: addr.address_line1,
      address_line2: addr.address_line2 || '',
      city: addr.city,
      state: addr.state,
      postal_code: addr.postal_code,
      country: addr.country,
    });
    setEditingId(addr.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.first_name || !form.last_name || !form.phone || !form.address_line1 || !form.city || !form.state || !form.postal_code || !form.country) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await addressesAPI.update(editingId, form);
      } else {
        await addressesAPI.create(form);
      }
      setShowForm(false);
      loadAddresses();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Address', 'Are you sure you want to delete this address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await addressesAPI.delete(id);
            setAddresses(prev => prev.filter(a => a.id !== id));
          } catch (error: any) {
            Alert.alert('Error', 'Failed to delete address');
          }
        },
      },
    ]);
  };

  const handleSetDefault = async (id: string) => {
    try {
      await addressesAPI.setDefaultShipping(id);
      setAddresses(prev =>
        prev.map(a => ({ ...a, is_default_shipping: a.id === id }))
      );
    } catch (error: any) {
      Alert.alert('Error', 'Failed to set default address');
    }
  };

  const renderAddress = ({ item }: { item: Address }) => (
    <View style={[styles.addressCard, item.is_default_shipping && styles.defaultCard]}>
      <View style={styles.cardHeader}>
        <View style={styles.labelRow}>
          {item.label && <Text style={styles.label}>{item.label}</Text>}
          {item.is_default_shipping && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>Default</Text>
            </View>
          )}
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity onPress={() => openEdit(item)} style={styles.actionBtn}>
            <Icon name="create-outline" size={18} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionBtn}>
            <Icon name="trash-outline" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.nameText}>{item.first_name} {item.last_name}</Text>
      <Text style={styles.addressText}>{item.address_line1}</Text>
      {item.address_line2 && <Text style={styles.addressText}>{item.address_line2}</Text>}
      <Text style={styles.addressText}>{item.city}, {item.state} {item.postal_code}</Text>
      <Text style={styles.addressText}>{item.country}</Text>
      <Text style={styles.phoneText}>{item.phone}</Text>

      {!item.is_default_shipping && (
        <TouchableOpacity style={styles.setDefaultBtn} onPress={() => handleSetDefault(item.id)}>
          <Text style={styles.setDefaultText}>Set as Default</Text>
        </TouchableOpacity>
      )}
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
      <FlatList
        data={addresses}
        keyExtractor={(item) => item.id}
        renderItem={renderAddress}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="location-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Addresses</Text>
            <Text style={styles.emptyText}>Add your first delivery address</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.addButton} onPress={openAdd}>
        <Icon name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Address Form Modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowForm(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editingId ? 'Edit Address' : 'New Address'}</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color="#3b82f6" />
              ) : (
                <Text style={styles.saveText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} contentContainerStyle={styles.formContent}>
            {[
              { key: 'label', label: 'Label (e.g. Home, Office)', optional: true },
              { key: 'first_name', label: 'First Name *' },
              { key: 'last_name', label: 'Last Name *' },
              { key: 'phone', label: 'Phone *', keyboard: 'phone-pad' as const },
              { key: 'address_line1', label: 'Address Line 1 *' },
              { key: 'address_line2', label: 'Address Line 2', optional: true },
              { key: 'city', label: 'City *' },
              { key: 'state', label: 'State/Province *' },
              { key: 'postal_code', label: 'Postal Code *' },
              { key: 'country', label: 'Country *' },
            ].map(({ key, label, keyboard, optional }) => (
              <View key={key} style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{label}</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={(form as any)[key]}
                  onChangeText={(val) => setForm(prev => ({ ...prev, [key]: val }))}
                  placeholder={label.replace(' *', '')}
                  placeholderTextColor="#9ca3af"
                  keyboardType={keyboard || 'default'}
                />
              </View>
            ))}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 80 },
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  defaultCard: { borderColor: '#3b82f6' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  labelRow: { flexDirection: 'row', alignItems: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: '#3b82f6', marginRight: 8 },
  defaultBadge: { backgroundColor: '#eff6ff', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 },
  defaultBadgeText: { fontSize: 11, fontWeight: '600', color: '#3b82f6' },
  cardActions: { flexDirection: 'row' },
  actionBtn: { padding: 4, marginLeft: 12 },
  nameText: { fontSize: 15, fontWeight: '600', color: '#1f2937', marginBottom: 4 },
  addressText: { fontSize: 14, color: '#6b7280', lineHeight: 20 },
  phoneText: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  setDefaultBtn: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  setDefaultText: { fontSize: 13, fontWeight: '600', color: '#3b82f6', textAlign: 'center' },
  emptyContainer: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#6b7280', marginTop: 16 },
  emptyText: { fontSize: 14, color: '#9ca3af', marginTop: 4 },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  // Modal
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  cancelText: { fontSize: 15, color: '#6b7280' },
  modalTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  saveText: { fontSize: 15, fontWeight: '600', color: '#3b82f6' },
  formScroll: { flex: 1 },
  formContent: { padding: 16 },
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
});
