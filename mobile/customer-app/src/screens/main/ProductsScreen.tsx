import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { productsAPI, categoriesAPI } from '../../../../shared/api/customer-api';
import { usePrice } from '../../hooks/usePrice';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

// PERFORMANCE: Fixed item height for getItemLayout optimization
const ITEM_HEIGHT = 280; // Approximate height of product card + margin

export default function ProductsScreen({ navigation, route }: any) {
  const { formatPrice } = usePrice();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    route?.params?.categorySlug || null
  );
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState<string>('newest');

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (route?.params?.categorySlug) {
      setSelectedCategory(route.params.categorySlug);
    }
  }, [route?.params?.categorySlug]);

  useEffect(() => {
    // Pass page=1 explicitly to avoid race with async setPage
    setPage(1);
    loadProducts(true, 1);
  }, [searchQuery, selectedCategory, sortBy]);

  const loadCategories = async () => {
    try {
      const data = await categoriesAPI.getAll();
      const cats = Array.isArray(data) ? data : data.results || [];
      // Only top-level categories
      const topLevel = cats.filter((c: any) => !c.parent_id);
      setCategories(topLevel);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadProducts = async (isRefresh = false, explicitPage?: number) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setPage(1);
      } else {
        setLoading(true);
      }

      const params: any = {
        page: explicitPage ?? (isRefresh ? 1 : page),
        limit: 20,
        search: searchQuery || undefined,
        category: selectedCategory || undefined,
      };

      if (sortBy === 'price_low') {
        params.sort_by = 'price';
        params.sort_order = 'asc';
      } else if (sortBy === 'price_high') {
        params.sort_by = 'price';
        params.sort_order = 'desc';
      } else if (sortBy === 'rating') {
        params.sort_by = 'rating';
        params.sort_order = 'desc';
      } else if (sortBy === 'newest') {
        params.sort_by = 'created_at';
        params.sort_order = 'desc';
      }

      const response = await productsAPI.getAll(params);
      const items = response.results || response || [];

      if (isRefresh) {
        setProducts(items);
      } else {
        setProducts(prev => page === 1 ? items : [...prev, ...items]);
      }

      setHasMore(Array.isArray(items) && items.length >= 20);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (page > 1) {
      loadProducts();
    }
  }, [page]);

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  // PERFORMANCE: Memoize product press handler
  const handleProductPress = useCallback((slug: string) => {
    navigation.navigate('ProductDetail', { slug });
  }, [navigation]);

  // PERFORMANCE: Memoized render function
  const renderProduct = useCallback(({ item }: any) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => handleProductPress(item.slug)}
    >
      {(item.primary_image || item.images?.[0]?.url) ? (
        <Image
          source={{ uri: item.primary_image || item.images?.[0]?.url }}
          style={styles.productImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.productImage, { justifyContent: 'center', alignItems: 'center' }]}>
          <Icon name="image-outline" size={32} color="#d1d5db" />
        </View>
      )}
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
          <Text style={styles.price}>{formatPrice(Number(item.price))}</Text>
          {item.compare_at_price && (
            <Text style={styles.comparePrice}>{formatPrice(Number(item.compare_at_price))}</Text>
          )}
        </View>
        <View style={styles.ratingRow}>
          <Icon name="star" size={14} color="#f59e0b" />
          <Text style={styles.rating}>
            {item.rating?.toFixed(1) || '0.0'} ({item.review_count || 0})
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  ), [formatPrice, handleProductPress]);

  // PERFORMANCE: Memoized empty component
  const renderEmpty = useMemo(() => (
    <View style={styles.emptyContainer}>
      <Icon name="cube-outline" size={64} color="#9ca3af" />
      <Text style={styles.emptyText}>No products found</Text>
      <Text style={styles.emptySubtext}>
        {searchQuery ? 'Try a different search' : selectedCategory ? 'Try a different category' : 'Check back later'}
      </Text>
      {(searchQuery || selectedCategory) && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => { setSearchQuery(''); setSelectedCategory(null); }}
        >
          <Text style={styles.clearButtonText}>Clear Filters</Text>
        </TouchableOpacity>
      )}
    </View>
  ), [searchQuery, selectedCategory]);

  // PERFORMANCE: Memoized footer component
  const renderFooter = useMemo(() => {
    if (!loading || page === 1) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#3b82f6" />
      </View>
    );
  }, [loading, page]);

  // PERFORMANCE: getItemLayout for fixed-height items (2 columns)
  const getItemLayout = useCallback(
    (data: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * Math.floor(index / 2), // 2 columns
      index,
    }),
    []
  );

  const sortOptions = [
    { key: 'newest', label: 'Newest' },
    { key: 'price_low', label: 'Price: Low' },
    { key: 'price_high', label: 'Price: High' },
    { key: 'rating', label: 'Top Rated' },
  ];

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Icon name="search" size={20} color="#6b7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close-circle" size={20} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryBar}
        contentContainerStyle={styles.categoryBarContent}
      >
        <TouchableOpacity
          style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[styles.categoryChipText, !selectedCategory && styles.categoryChipTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.categoryChip, selectedCategory === cat.slug && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(selectedCategory === cat.slug ? null : cat.slug)}
          >
            <Text style={[styles.categoryChipText, selectedCategory === cat.slug && styles.categoryChipTextActive]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sort Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.sortBar}
        contentContainerStyle={styles.sortBarContent}
      >
        {sortOptions.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.sortChip, sortBy === opt.key && styles.sortChipActive]}
            onPress={() => setSortBy(opt.key)}
          >
            <Text style={[styles.sortChipText, sortBy === opt.key && styles.sortChipTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Product List */}
      {loading && page === 1 ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item, index) => item.id?.toString() || `product-${index}`}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadProducts(true)}
              colors={['#3b82f6']}
            />
          }
          // PERFORMANCE OPTIMIZATIONS
          getItemLayout={getItemLayout}
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={5}
          removeClippedSubviews={true}
          updateCellsBatchingPeriod={50}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  categoryBar: {
    maxHeight: 44,
    marginTop: 8,
  },
  categoryBarContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  categoryChipText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  sortBar: {
    maxHeight: 38,
    marginTop: 8,
    marginBottom: 4,
  },
  sortBarContent: {
    paddingHorizontal: 16,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'transparent',
    marginRight: 4,
  },
  sortChipActive: {
    backgroundColor: '#eff6ff',
  },
  sortChipText: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  sortChipTextActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  listContent: {
    padding: 8,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  clearButton: {
    marginTop: 16,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
