import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { rfqAPI } from '../../../../shared/api/customer-api';

const UNITS = ['pieces', 'kg', 'meters', 'boxes', 'pallets'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'NGN', 'KES', 'ZAR'];

export default function RFQCreateScreen({ route, navigation }: any) {
  const productInfo = route.params?.product;

  const [title, setTitle] = useState(productInfo?.name || '');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('pieces');
  const [targetPrice, setTargetPrice] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [deliveryDeadline, setDeliveryDeadline] = useState('');
  const [specifications, setSpecifications] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a title for your quote request.');
      return;
    }
    if (!quantity.trim() || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      Alert.alert('Required', 'Please enter a valid quantity.');
      return;
    }

    try {
      setSubmitting(true);
      await rfqAPI.create({
        title: title.trim(),
        description: description.trim(),
        quantity: Number(quantity),
        unit,
        target_price: targetPrice ? Number(targetPrice) : undefined,
        currency,
        delivery_deadline: deliveryDeadline.trim() || undefined,
        specifications: specifications.trim() || undefined,
        product_id: productInfo?.id || undefined,
        category: productInfo?.category || undefined,
      });
      Alert.alert('Success', 'Your quote request has been submitted!', [
        { text: 'OK', onPress: () => navigation.navigate('RFQList') },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit quote request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderPickerModal = (
    visible: boolean,
    onClose: () => void,
    options: string[],
    selected: string,
    onSelect: (v: string) => void,
    label: string,
  ) => {
    if (!visible) return null;
    return (
      <View style={styles.pickerOverlay}>
        <View style={styles.pickerModal}>
          <Text style={styles.pickerTitle}>{label}</Text>
          {options.map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.pickerOption, selected === option && styles.pickerOptionSelected]}
              onPress={() => { onSelect(option); onClose(); }}
            >
              <Text style={[styles.pickerOptionText, selected === option && styles.pickerOptionTextSelected]}>
                {option}
              </Text>
              {selected === option && <Icon name="checkmark" size={20} color="#3b82f6" />}
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.pickerCancel} onPress={onClose}>
            <Text style={styles.pickerCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
        {productInfo && (
          <View style={styles.prefillBanner}>
            <Icon name="information-circle" size={20} color="#3b82f6" />
            <Text style={styles.prefillText}>Pre-filled from: {productInfo.name}</Text>
          </View>
        )}

        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g., Custom LED Bulbs"
          placeholderTextColor="#9ca3af"
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe what you need..."
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Quantity *</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="e.g., 500"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Unit</Text>
            <TouchableOpacity style={styles.pickerButton} onPress={() => setShowUnitPicker(true)}>
              <Text style={styles.pickerButtonText}>{unit}</Text>
              <Icon name="chevron-down" size={18} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Target Price (optional)</Text>
            <TextInput
              style={styles.input}
              value={targetPrice}
              onChangeText={setTargetPrice}
              placeholder="e.g., 5.00"
              placeholderTextColor="#9ca3af"
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Currency</Text>
            <TouchableOpacity style={styles.pickerButton} onPress={() => setShowCurrencyPicker(true)}>
              <Text style={styles.pickerButtonText}>{currency}</Text>
              <Icon name="chevron-down" size={18} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.label}>Delivery Deadline (optional)</Text>
        <TextInput
          style={styles.input}
          value={deliveryDeadline}
          onChangeText={setDeliveryDeadline}
          placeholder="e.g., 2026-03-15"
          placeholderTextColor="#9ca3af"
        />

        <Text style={styles.label}>Specifications (optional)</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          value={specifications}
          onChangeText={setSpecifications}
          placeholder="Size, color, material, certifications, etc."
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Icon name="send" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Submit Quote Request</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {renderPickerModal(showUnitPicker, () => setShowUnitPicker(false), UNITS, unit, setUnit, 'Select Unit')}
      {renderPickerModal(showCurrencyPicker, () => setShowCurrencyPicker(false), CURRENCIES, currency, setCurrency, 'Select Currency')}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  form: { padding: 16, paddingBottom: 40 },
  prefillBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  prefillText: { fontSize: 13, color: '#3b82f6', fontWeight: '500', flex: 1 },
  label: { fontSize: 14, fontWeight: '600', color: '#1f2937', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 15,
    color: '#1f2937',
  },
  multilineInput: { minHeight: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  pickerButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerButtonText: { fontSize: 15, color: '#1f2937' },
  submitButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  // Picker modal
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  pickerModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: 32,
  },
  pickerTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 12, textAlign: 'center' },
  pickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  pickerOptionSelected: { backgroundColor: '#eff6ff' },
  pickerOptionText: { fontSize: 15, color: '#4b5563' },
  pickerOptionTextSelected: { color: '#3b82f6', fontWeight: '600' },
  pickerCancel: { marginTop: 12, alignItems: 'center', paddingVertical: 12 },
  pickerCancelText: { fontSize: 15, color: '#6b7280', fontWeight: '600' },
});
