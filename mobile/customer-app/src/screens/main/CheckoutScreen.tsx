import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { cartAPI, addressesAPI, ordersAPI } from '../../../../shared/api/customer-api';

export default function CheckoutScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cart, setCart] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');
  const [orderNotes, setOrderNotes] = useState('');

  useEffect(() => {
    loadCheckoutData();
  }, []);

  const loadCheckoutData = async () => {
    try {
      setLoading(true);
      const [cartResponse, addressesResponse] = await Promise.all([
        cartAPI.get(),
        addressesAPI.getAll(),
      ]);

      setCart(cartResponse);
      setAddresses(addressesResponse);

      // Auto-select default shipping address
      const defaultAddress = addressesResponse.find((addr: any) => addr.is_default_shipping);
      if (defaultAddress) {
        setSelectedAddress(defaultAddress);
      } else if (addressesResponse.length > 0) {
        setSelectedAddress(addressesResponse[0]);
      }
    } catch (error: any) {
      console.error('Failed to load checkout data:', error);
      Alert.alert('Error', error.message || 'Failed to load checkout data');
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
      `Place order for $${cart.total}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Place Order',
          onPress: async () => {
            try {
              setSubmitting(true);

              const orderData = {
                shipping_address_id: selectedAddress.id,
                payment_method: paymentMethod,
                notes: orderNotes || undefined,
              };

              const order = await ordersAPI.create(orderData);

              Alert.alert(
                'Success',
                `Order #${order.order_number} placed successfully!`,
                [
                  {
                    text: 'View Order',
                    onPress: () => {
                      navigation.reset({
                        index: 0,
                        routes: [{ name: 'Orders' }],
                      });
                    },
                  },
                ]
              );
            } catch (error: any) {
              console.error('Failed to place order:', error);
              Alert.alert('Error', error.message || 'Failed to place order');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

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
                onPress={() => {
                  Alert.alert('Info', 'Navigate to Profile to add addresses');
                }}
              >
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
                        <Text style={styles.addressName}>{address.full_name}</Text>
                        {address.is_default_shipping && (
                          <View style={styles.defaultBadge}>
                            <Text style={styles.defaultBadgeText}>Default</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.addressText}>{address.street_address}</Text>
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
            </View>
          )}
        </View>

        {/* Payment Method Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="card" size={20} color="#3b82f6" />
            <Text style={styles.sectionTitle}>Payment Method</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'card' && styles.selectedPayment,
            ]}
            onPress={() => setPaymentMethod('card')}
          >
            <View style={styles.radioButton}>
              {paymentMethod === 'card' && <View style={styles.radioButtonInner} />}
            </View>
            <Icon name="card-outline" size={24} color="#6b7280" style={styles.paymentIcon} />
            <Text style={styles.paymentText}>Credit/Debit Card</Text>
          </TouchableOpacity>

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
                <Text style={styles.summaryItemPrice}>${item.price}</Text>
              </View>
            ))}

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${cart.subtotal}</Text>
            </View>

            {cart.discount_amount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount</Text>
                <Text style={[styles.summaryValue, styles.discountText]}>
                  -${cart.discount_amount}
                </Text>
              </View>
            )}

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax</Text>
              <Text style={styles.summaryValue}>${cart.tax_amount || '0.00'}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={styles.summaryValue}>
                {cart.shipping_amount ? `$${cart.shipping_amount}` : 'Free'}
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${cart.total}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.placeOrderButton, submitting && styles.buttonDisabled]}
          onPress={handlePlaceOrder}
          disabled={submitting || !selectedAddress}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={styles.placeOrderText}>Place Order - ${cart.total}</Text>
              <Icon name="checkmark-circle" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
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
});
