import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Image,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { customerApiClient } from '../../../../shared/api/client';
import { productsAPI } from '../../../../shared/api/customer-api';

interface VendorProfile {
  id: string;
  business_name: string;
  description?: string;
  logo?: string;
  rating?: number;
  review_count?: number;
  product_count?: number;
  joined_at?: string;
  location?: string;
  response_time?: string;
}

export default function VendorProfileScreen({ route, navigation }: any) {
  const { vendorId, vendorName } = route.params;
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVendor();
  }, [vendorId]);

  const loadVendor = async () => {
    try {
      const [vendorData, productsData] = await Promise.all([
        customerApiClient.get(`/vendors/${vendorId}`).then(r => r.data),
        customerApiClient.get(`/vendors/${vendorId}/products`).then(r => r.data).catch(() => []),
      ]);
      setVendor(vendorData);
      setProducts(Array.isArray(productsData) ? productsData : productsData.items || []);
    } catch (error: any) {
      console.error('Failed to load vendor:', error);
      Alert.alert('Error', 'Failed to load vendor profile');
    } finally {
      setLoading(false);
    }
  };

  const handleContactVendor = () => {
    navigation.navigate('Chat', { vendorId, vendorName: vendor?.business_name || vendorName });
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!vendor) {
    return (
      <View style={styles.loaderContainer}>
        <Icon name="storefront-outline" size={64} color="#d1d5db" />
        <Text style={styles.emptyText}>Vendor not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Vendor Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {vendor.logo ? (
            <Image source={{ uri: vendor.logo }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Icon name="storefront" size={40} color="#3b82f6" />
            </View>
          )}
        </View>
        <Text style={styles.businessName}>{vendor.business_name}</Text>
        {vendor.location && (
          <View style={styles.locationRow}>
            <Icon name="location-outline" size={14} color="#6b7280" />
            <Text style={styles.locationText}>{vendor.location}</Text>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{vendor.product_count || products.length}</Text>
            <Text style={styles.statLabel}>Products</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={styles.ratingRow}>
              <Icon name="star" size={14} color="#f59e0b" />
              <Text style={styles.statValue}> {vendor.rating?.toFixed(1) || 'N/A'}</Text>
            </View>
            <Text style={styles.statLabel}>{vendor.review_count || 0} reviews</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{vendor.response_time || 'Fast'}</Text>
            <Text style={styles.statLabel}>Response</Text>
          </View>
        </View>

        {/* Contact Button */}
        <TouchableOpacity style={styles.contactButton} onPress={handleContactVendor}>
          <Icon name="chatbubble-outline" size={18} color="#fff" />
          <Text style={styles.contactButtonText}>Contact Vendor</Text>
        </TouchableOpacity>
      </View>

      {/* Description */}
      {vendor.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{vendor.description}</Text>
        </View>
      )}

      {/* Products */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Products ({products.length})</Text>
        {products.length === 0 ? (
          <Text style={styles.emptyProducts}>No products available</Text>
        ) : (
          <View style={styles.productsGrid}>
            {products.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={styles.productCard}
                onPress={() => navigation.navigate('ProductDetail', { slug: product.slug })}
              >
                <Image
                  source={{ uri: product.images?.[0]?.image || 'https://via.placeholder.com/150' }}
                  style={styles.productImage}
                />
                <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                <Text style={styles.productPrice}>${product.price}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#6b7280', marginTop: 12 },
  header: {
    backgroundColor: '#fff',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  avatarContainer: { marginBottom: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  businessName: { fontSize: 22, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  locationText: { fontSize: 13, color: '#6b7280', marginLeft: 4 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 16,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: '#e5e7eb' },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    justifyContent: 'center',
  },
  contactButtonText: { color: '#fff', fontSize: 15, fontWeight: '600', marginLeft: 8 },
  section: { backgroundColor: '#fff', marginTop: 12, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 12 },
  description: { fontSize: 14, color: '#6b7280', lineHeight: 22 },
  emptyProducts: { fontSize: 14, color: '#9ca3af', textAlign: 'center', paddingVertical: 24 },
  productsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  productCard: {
    width: '48%',
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    margin: '1%',
    overflow: 'hidden',
  },
  productImage: { width: '100%', height: 120, backgroundColor: '#e5e7eb' },
  productName: { fontSize: 13, fontWeight: '500', color: '#1f2937', padding: 8, paddingBottom: 2 },
  productPrice: { fontSize: 14, fontWeight: '700', color: '#3b82f6', paddingHorizontal: 8, paddingBottom: 8 },
});
