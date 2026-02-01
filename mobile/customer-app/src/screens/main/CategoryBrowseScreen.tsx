import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { categoriesAPI, productsAPI } from '../../../../shared/api/customer-api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function CategoryBrowseScreen({ navigation, route }: any) {
  const categorySlug = route?.params?.categorySlug;
  const categoryName = route?.params?.categoryName || 'Category';

  const [category, setCategory] = useState<any>(null);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: categoryName });
  }, [categoryName, navigation]);

  useEffect(() => {
    loadData();
  }, [categorySlug]);

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [catData, prodData] = await Promise.all([
        categoriesAPI.getAll(),
        productsAPI.getAll({ category: categorySlug }),
      ]);

      // Parse categories
      const allCategories = Array.isArray(catData) ? catData : catData.results || [];
      const matched = allCategories.find((c: any) => c.slug === categorySlug);
      setCategory(matched || null);

      // Get children of matched category
      if (matched) {
        const children = allCategories.filter((c: any) => c.parent_id === matched.id);
        setSubcategories(children);
      } else {
        setSubcategories([]);
      }

      // Parse products
      const prods = Array.isArray(prodData) ? prodData : prodData.results || [];
      setProducts(prods);
    } catch (error) {
      console.error('Failed to load category data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    loadData(true);
  }, [categorySlug]);

  const navigateToSubcategory = (sub: any) => {
    navigation.push('CategoryBrowse', {
      categorySlug: sub.slug,
      categoryName: sub.name,
    });
  };

  const renderProduct = ({ item }: any) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetail', { slug: item.slug })}
    >
      <Image
        source={{ uri: item.images?.[0]?.image || 'https://via.placeholder.com/150' }}
        style={styles.productImage}
        resizeMode="cover"
      />
      {item.compare_at_price && item.compare_at_price > item.price && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>
            -{Math.round(((item.compare_at_price - item.price) / item.compare_at_price) * 100)}%
          </Text>
        </View>
      )}
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>${item.price}</Text>
          {item.compare_at_price && (
            <Text style={styles.comparePrice}>${item.compare_at_price}</Text>
          )}
        </View>
        <View style={styles.ratingRow}>
          <Icon name="star" size={14} color="#f59e0b" />
          <Text style={styles.rating}>
            {item.average_rating?.toFixed(1) || '0.0'} ({item.review_count || 0})
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View>
      {/* Category Header */}
      <View style={styles.headerSection}>
        <Text style={styles.headerTitle}>{categoryName}</Text>
        {category?.description ? (
          <Text style={styles.headerDescription} numberOfLines={2}>
            {category.description}
          </Text>
        ) : null}
        <Text style={styles.productCount}>
          {products.length} {products.length === 1 ? 'product' : 'products'}
        </Text>
      </View>

      {/* Subcategory Chips */}
      {subcategories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.subcategoryBar}
          contentContainerStyle={styles.subcategoryBarContent}
        >
          {subcategories.map((sub) => (
            <TouchableOpacity
              key={sub.id}
              style={styles.subcategoryChip}
              onPress={() => navigateToSubcategory(sub)}
            >
              <Icon name="grid-outline" size={14} color="#3b82f6" style={styles.chipIcon} />
              <Text style={styles.subcategoryChipText}>{sub.name}</Text>
              <Icon name="chevron-forward" size={14} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="cube-outline" size={64} color="#9ca3af" />
      <Text style={styles.emptyText}>No products found</Text>
      <Text style={styles.emptySubtext}>
        This category doesn't have any products yet
      </Text>
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
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item, index) => item.id?.toString() || `product-${index}`}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3b82f6']}
          />
        }
      />
    </View>
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
    backgroundColor: '#f5f5f5',
  },
  headerSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  headerDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  productCount: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '500',
  },
  subcategoryBar: {
    maxHeight: 48,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  subcategoryBarContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  subcategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginRight: 8,
  },
  chipIcon: {
    marginRight: 6,
  },
  subcategoryChipText: {
    fontSize: 13,
    color: '#1f2937',
    fontWeight: '500',
    marginRight: 4,
  },
  listContent: {
    paddingBottom: 16,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  productCard: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  productImage: {
    width: '100%',
    height: CARD_WIDTH,
    backgroundColor: '#f3f4f6',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#ef4444',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    minHeight: 40,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginRight: 8,
  },
  comparePrice: {
    fontSize: 14,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
});
