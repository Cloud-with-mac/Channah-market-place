import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { cartAPI, addressesAPI, ordersAPI, paymentsAPI } from '../../../../shared/api/customer-api';
import { countries } from '../../data/countries';
import { useAuthStore } from '../../store/authStore';
import { usePrice } from '../../hooks/usePrice';
import { useCurrencyStore, countryCodeToName } from '../../store/currencyStore';

const getErrorMessage = (error: any): string => {
  if (!error) return 'An error occurred';
  if (typeof error.message === 'string') return error.message;
  if (Array.isArray(error.message)) return error.message.join(', ');
  if (error.response?.data) {
    const data = error.response.data;
    if (typeof data.detail === 'string') return data.detail;
    if (Array.isArray(data.detail)) return data.detail.map((d: any) => d.msg || String(d)).join(', ');
    if (typeof data.message === 'string') return data.message;
    if (Array.isArray(data.message)) return data.message.join(', ');
    if (typeof data === 'string') return data;
  }
  return String(error.message || error || 'An error occurred');
};

export default function CheckoutScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const { formatPrice } = usePrice();
  const { country: detectedCountryCode } = useCurrencyStore();
  const detectedCountryName = detectedCountryCode ? (countryCodeToName[detectedCountryCode] || '') : '';
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cart, setCart] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>('stripe');
  const [orderNotes, setOrderNotes] = useState('');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [stateSearch, setStateSearch] = useState('');
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    first_name: '',
    last_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: detectedCountryName,
    is_default_shipping: true,
  });

  useEffect(() => {
    loadCheckoutData();
  }, []);

  const loadCheckoutData = async () => {
    try {
      setLoading(true);
      const [cartResponse, addressesResponse, methodsResponse] = await Promise.all([
        cartAPI.get(),
        addressesAPI.getAll(),
        paymentsAPI.getPaymentMethods().catch(() => ({ methods: [] })),
      ]);

      setCart(cartResponse);
      setAddresses(addressesResponse);

      // Set available payment methods
      const methods = methodsResponse?.methods || [];
      if (methods.length > 0) {
        setPaymentMethods(methods);
        setPaymentMethod(methods[0].id);
      } else {
        // Fallback if no methods configured
        setPaymentMethods([
          { id: 'stripe', name: 'Credit/Debit Card', icon: 'card-outline', enabled: true },
          { id: 'cash', name: 'Cash on Delivery', icon: 'cash-outline', enabled: true },
        ]);
        setPaymentMethod('stripe');
      }

      // Auto-select default shipping address
      const defaultAddress = addressesResponse.find((addr: any) => addr.is_default_shipping);
      if (defaultAddress) {
        setSelectedAddress(defaultAddress);
      } else if (addressesResponse.length > 0) {
        setSelectedAddress(addressesResponse[0]);
      }
    } catch (error: any) {
      console.error('Failed to load checkout data:', error);
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      Alert.alert('Error', 'Please select a shipping address');
      return;
    }

    if (!cart?.items || cart.items.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }

    Alert.alert(
      'Confirm Order',
      `Place order for ${formatPrice(Number(cart.total))}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Place Order',
          onPress: async () => {
            try {
              setSubmitting(true);

              const orderData = {
                shipping_address: {
                  first_name: selectedAddress.first_name,
                  last_name: selectedAddress.last_name,
                  email: user?.email || '',
                  phone: selectedAddress.phone || '',
                  address_line1: selectedAddress.address_line1,
                  address_line2: selectedAddress.address_line2 || '',
                  city: selectedAddress.city,
                  state: selectedAddress.state || '',
                  postal_code: selectedAddress.postal_code,
                  country: selectedAddress.country,
                },
                payment_method: paymentMethod,
                customer_notes: orderNotes || undefined,
              };

              const order = await ordersAPI.create(orderData);

              // Process payment for non-cash methods
              if (paymentMethod !== 'cash') {
                try {
                  const paymentResult = await paymentsAPI.createPaymentIntent(order.id, paymentMethod);

                  if (paymentResult.payment_url) {
                    // PayPal / Flutterwave — open payment URL in browser
                    await Linking.openURL(paymentResult.payment_url);
                    Alert.alert(
                      'Complete Payment',
                      `Please complete your payment in the browser. Order #${order.order_number} has been created.`,
                      [{
                        text: 'View Order',
                        onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Orders' }] }),
                      }]
                    );
                  } else {
                    // Stripe / Razorpay — payment intent created, confirm on success screen
                    Alert.alert(
                      'Success',
                      `Order #${order.order_number} placed! Payment is being processed.`,
                      [{
                        text: 'View Order',
                        onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Orders' }] }),
                      }]
                    );
                  }
                } catch (payError: any) {
                  // Order was created but payment initiation failed
                  console.error('Payment initiation failed:', payError);
                  Alert.alert(
                    'Order Created',
                    `Order #${order.order_number} was created but payment could not be initiated. You can retry payment from your orders page.`,
                    [{
                      text: 'View Orders',
                      onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Orders' }] }),
                    }]
                  );
                }
              } else {
                // Cash on delivery
                Alert.alert(
                  'Success',
                  `Order #${order.order_number} placed successfully!`,
                  [{
                    text: 'View Order',
                    onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Orders' }] }),
                  }]
                );
              }
            } catch (error: any) {
              console.error('Failed to place order:', error);
              Alert.alert('Error', getErrorMessage(error));
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const handleSaveAddress = async () => {
    const { first_name, last_name, address_line1, city, postal_code, country } = addressForm;
    if (!first_name || !last_name || !address_line1 || !city || !postal_code || !country) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    try {
      setSavingAddress(true);
      const newAddr = await addressesAPI.create(addressForm);
      setAddresses(prev => [...prev, newAddr]);
      setSelectedAddress(newAddr);
      setShowAddressModal(false);
      setAddressForm({
        label: 'Home', first_name: '', last_name: '', phone: '', address_line1: '', address_line2: '',
        city: '', state: '', postal_code: '', country: detectedCountryName, is_default_shipping: true,
      });
    } catch (error: any) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setSavingAddress(false);
    }
  };

  const selectedCountryData = useMemo(
    () => countries.find(c => c.name === addressForm.country),
    [addressForm.country]
  );

  const filteredCountries = useMemo(
    () => countrySearch
      ? countries.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()))
      : countries,
    [countrySearch]
  );

  const filteredStates = useMemo(
    () => {
      const statesList = selectedCountryData?.states || [];
      return stateSearch
        ? statesList.filter(s => s.name.toLowerCase().includes(stateSearch.toLowerCase()))
        : statesList;
    },
    [selectedCountryData, stateSearch]
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!cart?.items || cart.items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="cart-outline" size={64} color="#9ca3af" />
        <Text style={styles.emptyText}>Your cart is empty</Text>
        <TouchableOpacity
          style={styles.shopButton}
          onPress={() => navigation.navigate('Products')}
        >
          <Text style={styles.shopButtonText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Shipping Address Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="location" size={20} color="#3b82f6" />
            <Text style={styles.sectionTitle}>Shipping Address</Text>
          </View>

          {addresses.length === 0 ? (
            <View style={styles.noAddressContainer}>
              <Text style={styles.noAddressText}>No addresses found</Text>
              <TouchableOpacity
                style={styles.addAddressButton}
                onPress={() => setShowAddressModal(true)}
              >
                <Icon name="add" size={16} color="#fff" />
                <Text style={styles.addAddressText}>Add Address</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {addresses.map((address) => (
                <TouchableOpacity
                  key={address.id}
                  style={[
                    styles.addressCard,
                    selectedAddress?.id === address.id && styles.selectedAddress,
                  ]}
                  onPress={() => setSelectedAddress(address)}
                >
                  <View style={styles.addressHeader}>
                    <View style={styles.radioButton}>
                      {selectedAddress?.id === address.id && (
                        <View style={styles.radioButtonInner} />
                      )}
                    </View>
                    <View style={styles.addressInfo}>
                      <View style={styles.addressNameRow}>
                        <Text style={styles.addressName}>{address.first_name} {address.last_name}</Text>
                        {address.is_default_shipping && (
                          <View style={styles.defaultBadge}>
                            <Text style={styles.defaultBadgeText}>Default</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.addressText}>{address.address_line1}</Text>
                      <Text style={styles.addressText}>
                        {address.city}, {address.state} {address.postal_code}
                      </Text>
                      <Text style={styles.addressText}>{address.country}</Text>
                      {address.phone && (
                        <Text style={styles.addressPhone}>{address.phone}</Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.addMoreAddressBtn}
                onPress={() => setShowAddressModal(true)}
              >
                <Icon name="add-circle-outline" size={18} color="#3b82f6" />
                <Text style={styles.addMoreAddressText}>Add New Address</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Payment Method Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="card" size={20} color="#3b82f6" />
            <Text style={styles.sectionTitle}>Payment Method</Text>
          </View>

          {paymentMethods.map((method) => {
            const iconMap: Record<string, string> = {
              'credit-card': 'card-outline',
              'paypal': 'logo-paypal',
              'cash-outline': 'cash-outline',
            };
            const iconName = iconMap[method.icon] || method.icon || 'card-outline';
            return (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentOption,
                  paymentMethod === method.id && styles.selectedPayment,
                ]}
                onPress={() => setPaymentMethod(method.id)}
              >
                <View style={styles.radioButton}>
                  {paymentMethod === method.id && <View style={styles.radioButtonInner} />}
                </View>
                <Icon name={iconName} size={24} color="#6b7280" style={styles.paymentIcon} />
                <Text style={styles.paymentText}>{method.name}</Text>
              </TouchableOpacity>
            );
          })}

          {/* Always show Cash on Delivery option */}
          {!paymentMethods.some(m => m.id === 'cash') && (
            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === 'cash' && styles.selectedPayment,
              ]}
              onPress={() => setPaymentMethod('cash')}
            >
              <View style={styles.radioButton}>
                {paymentMethod === 'cash' && <View style={styles.radioButtonInner} />}
              </View>
              <Icon name="cash-outline" size={24} color="#6b7280" style={styles.paymentIcon} />
              <Text style={styles.paymentText}>Cash on Delivery</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Order Notes Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="document-text" size={20} color="#3b82f6" />
            <Text style={styles.sectionTitle}>Order Notes (Optional)</Text>
          </View>

          <TextInput
            style={styles.notesInput}
            placeholder="Add any special instructions..."
            value={orderNotes}
            onChangeText={setOrderNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Order Summary Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="receipt" size={20} color="#3b82f6" />
            <Text style={styles.sectionTitle}>Order Summary</Text>
          </View>

          <View style={styles.summaryCard}>
            {cart.items.map((item: any) => (
              <View key={item.id} style={styles.summaryItem}>
                <Text style={styles.summaryItemName} numberOfLines={1}>
                  {item.product?.name} x {item.quantity}
                </Text>
                <Text style={styles.summaryItemPrice}>{formatPrice(Number(item.price) * (item.quantity || 1))}</Text>
              </View>
            ))}

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatPrice(Number(cart.subtotal))}</Text>
            </View>

            {cart.discount_amount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount</Text>
                <Text style={[styles.summaryValue, styles.discountText]}>
                  -{formatPrice(Number(cart.discount_amount))}
                </Text>
              </View>
            )}

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax</Text>
              <Text style={styles.summaryValue}>{formatPrice(Number(cart?.tax_amount || 0))}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={styles.summaryValue}>
                {cart.shipping_amount ? `${formatPrice(Number(cart.shipping_amount))}` : 'Free'}
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatPrice(Number(cart.total))}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.placeOrderButton, (submitting || !selectedAddress) && styles.buttonDisabled]}
          onPress={handlePlaceOrder}
          disabled={submitting || !selectedAddress}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={styles.placeOrderText}>Place Order - {formatPrice(Number(cart.total))}</Text>
              <Icon name="checkmark-circle" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Add Address Modal */}
      <Modal visible={showAddressModal} animationType="slide" transparent onRequestClose={() => setShowAddressModal(false)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Shipping Address</Text>
              <TouchableOpacity onPress={() => setShowAddressModal(false)}>
                <Icon name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalRow}>
                <TextInput
                  style={[styles.modalInput, { flex: 1 }]}
                  placeholder="First Name *"
                  value={addressForm.first_name}
                  onChangeText={(v) => setAddressForm(p => ({ ...p, first_name: v }))}
                />
                <TextInput
                  style={[styles.modalInput, { flex: 1, marginLeft: 8 }]}
                  placeholder="Last Name *"
                  value={addressForm.last_name}
                  onChangeText={(v) => setAddressForm(p => ({ ...p, last_name: v }))}
                />
              </View>
              <TextInput
                style={styles.modalInput}
                placeholder="Phone"
                value={addressForm.phone}
                onChangeText={(v) => setAddressForm(p => ({ ...p, phone: v }))}
                keyboardType="phone-pad"
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Address Line 1 *"
                value={addressForm.address_line1}
                onChangeText={(v) => setAddressForm(p => ({ ...p, address_line1: v }))}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Address Line 2"
                value={addressForm.address_line2}
                onChangeText={(v) => setAddressForm(p => ({ ...p, address_line2: v }))}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="City *"
                value={addressForm.city}
                onChangeText={(v) => setAddressForm(p => ({ ...p, city: v }))}
              />

              {/* Country Dropdown */}
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => { setCountrySearch(''); setShowCountryPicker(true); }}
              >
                <Text style={addressForm.country ? styles.dropdownText : styles.dropdownPlaceholder}>
                  {addressForm.country || 'Select Country *'}
                </Text>
                <Icon name="chevron-down" size={18} color="#6b7280" />
              </TouchableOpacity>

              {/* State/Province Dropdown */}
              <TouchableOpacity
                style={[styles.dropdownButton, !addressForm.country && { opacity: 0.5 }]}
                onPress={() => {
                  if (!addressForm.country) {
                    Alert.alert('Info', 'Please select a country first');
                    return;
                  }
                  if (selectedCountryData && selectedCountryData.states.length === 0) {
                    Alert.alert('Info', 'No states/provinces listed for this country. Type manually below.');
                    return;
                  }
                  setStateSearch('');
                  setShowStatePicker(true);
                }}
              >
                <Text style={addressForm.state ? styles.dropdownText : styles.dropdownPlaceholder}>
                  {addressForm.state || 'Select State/Province *'}
                </Text>
                <Icon name="chevron-down" size={18} color="#6b7280" />
              </TouchableOpacity>

              {/* Manual state input for countries with no states listed */}
              {addressForm.country && selectedCountryData && selectedCountryData.states.length === 0 && (
                <TextInput
                  style={styles.modalInput}
                  placeholder="State/Province *"
                  value={addressForm.state}
                  onChangeText={(v) => setAddressForm(p => ({ ...p, state: v }))}
                />
              )}

              <TextInput
                style={styles.modalInput}
                placeholder="Postal Code *"
                value={addressForm.postal_code}
                onChangeText={(v) => setAddressForm(p => ({ ...p, postal_code: v }))}
              />

              <TouchableOpacity
                style={[styles.saveAddressBtn, savingAddress && { opacity: 0.6 }]}
                onPress={handleSaveAddress}
                disabled={savingAddress}
              >
                {savingAddress ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveAddressBtnText}>Save Address</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Country Picker Modal */}
      <Modal visible={showCountryPicker} animationType="slide" transparent onRequestClose={() => setShowCountryPicker(false)}>
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContent}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Country</Text>
              <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                <Icon name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.pickerSearchBar}>
              <Icon name="search" size={18} color="#9ca3af" />
              <TextInput
                style={styles.pickerSearchInput}
                placeholder="Search countries..."
                value={countrySearch}
                onChangeText={setCountrySearch}
                autoFocus
              />
            </View>
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.pickerItem,
                    addressForm.country === item.name && styles.pickerItemActive,
                  ]}
                  onPress={() => {
                    setAddressForm(p => ({ ...p, country: item.name, state: '' }));
                    setShowCountryPicker(false);
                  }}
                >
                  <Text style={[
                    styles.pickerItemText,
                    addressForm.country === item.name && styles.pickerItemTextActive,
                  ]}>
                    {item.name}
                  </Text>
                  {item.states.length > 0 && (
                    <Text style={styles.pickerItemSub}>
                      {item.states.length} states
                    </Text>
                  )}
                  {addressForm.country === item.name && (
                    <Icon name="checkmark" size={18} color="#3b82f6" />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.pickerEmpty}>
                  <Text style={styles.pickerEmptyText}>No countries found</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* State Picker Modal */}
      <Modal visible={showStatePicker} animationType="slide" transparent onRequestClose={() => setShowStatePicker(false)}>
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContent}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select State/Province</Text>
              <TouchableOpacity onPress={() => setShowStatePicker(false)}>
                <Icon name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.pickerSearchBar}>
              <Icon name="search" size={18} color="#9ca3af" />
              <TextInput
                style={styles.pickerSearchInput}
                placeholder="Search states..."
                value={stateSearch}
                onChangeText={setStateSearch}
                autoFocus
              />
            </View>
            <FlatList
              data={filteredStates}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.pickerItem,
                    addressForm.state === item.name && styles.pickerItemActive,
                  ]}
                  onPress={() => {
                    setAddressForm(p => ({ ...p, state: item.name }));
                    setShowStatePicker(false);
                  }}
                >
                  <Text style={[
                    styles.pickerItemText,
                    addressForm.state === item.name && styles.pickerItemTextActive,
                  ]}>
                    {item.name}
                  </Text>
                  {addressForm.state === item.name && (
                    <Icon name="checkmark" size={18} color="#3b82f6" />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.pickerEmpty}>
                  <Text style={styles.pickerEmptyText}>No states found</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
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
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: 8,
  },
  addressCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  selectedAddress: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  addressHeader: {
    flexDirection: 'row',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3b82f6',
  },
  addressInfo: {
    flex: 1,
  },
  addressNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginRight: 8,
  },
  defaultBadge: {
    backgroundColor: '#10b981',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  addressText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  addressPhone: {
    fontSize: 14,
    color: '#3b82f6',
    marginTop: 4,
  },
  noAddressContainer: {
    padding: 24,
    alignItems: 'center',
  },
  noAddressText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  addAddressButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  addAddressText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  selectedPayment: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  paymentIcon: {
    marginRight: 12,
  },
  paymentText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1f2937',
    minHeight: 80,
  },
  summaryCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryItemName: {
    flex: 1,
    fontSize: 14,
    color: '#6b7280',
    marginRight: 12,
  },
  summaryItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  discountText: {
    color: '#10b981',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  placeOrderButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  addMoreAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  addMoreAddressText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 12,
  },
  modalRow: {
    flexDirection: 'row',
  },
  saveAddressBtn: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveAddressBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginBottom: 12,
  },
  dropdownText: {
    fontSize: 14,
    color: '#1f2937',
  },
  dropdownPlaceholder: {
    fontSize: 14,
    color: '#9ca3af',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
    paddingBottom: 24,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  pickerSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    margin: 12,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  pickerSearchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#1f2937',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  pickerItemActive: {
    backgroundColor: '#eff6ff',
  },
  pickerItemText: {
    flex: 1,
    fontSize: 15,
    color: '#1f2937',
  },
  pickerItemTextActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  pickerItemSub: {
    fontSize: 12,
    color: '#9ca3af',
    marginRight: 8,
  },
  pickerEmpty: {
    padding: 32,
    alignItems: 'center',
  },
  pickerEmptyText: {
    fontSize: 14,
    color: '#9ca3af',
  },
});
