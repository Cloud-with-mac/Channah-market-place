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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { categoriesAPI, productsAPI } from '../../../../shared/api/customer-api';
import { usePrice } from '../../hooks/usePrice';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;
const CATEGORY_CARD_WIDTH = (width - 48) / 2;

const CATEGORY_ICONS: Record<string, string> = {
  electronics: 'phone-portrait',
  fashion: 'shirt',
  'fashion-apparel': 'shirt',
  'home-garden': 'home',
  sports: 'football',
  'sports-outdoors': 'fitness',
  beauty: 'sparkles',
  'health-beauty': 'sparkles',
  automotive: 'car',
  'food-beverages': 'restaurant',
  'food-beverage': 'restaurant',
  'baby-kids': 'happy',
  'health-medical': 'medkit',
  'industrial-tools': 'construct',
  'tools-hardware': 'construct',
  agriculture: 'leaf',
  'packaging-printing': 'cube',
  'textiles-fabrics': 'color-palette',
  'minerals-energy': 'flash',
  toys: 'game-controller',
  'toys-games': 'game-controller',
  books: 'book',
  'books-media': 'book',
  'books-stationery': 'book',
  jewelry: 'diamond',
  'jewelry-watches': 'diamond',
  'bags-luggage': 'bag',
  'computers-tablets': 'laptop',
  'pet-supplies': 'paw',
  'office-supplies': 'briefcase',
  'art-crafts': 'color-palette',
  'musical-instruments': 'musical-notes',
};

function getCategoryIcon(slug: string): string {
  return CATEGORY_ICONS[slug] || 'grid-outline';
}

const CATEGORY_COLORS = [
  '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981',
  '#f59e0b', '#ef4444', '#ec4899', '#6366f1',
  '#14b8a6', '#f97316', '#84cc16', '#0ea5e9',
];

export default function CategoryBrowseScreen({ navigation, route }: any) {
  const categorySlug = route?.params?.categorySlug;
  const categoryName = route?.params?.categoryName || 'Categories';
  const { formatPrice } = usePrice();

  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [category, setCategory] = useState<any>(null);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // If no categorySlug, we show the "all categories" view
  const isRootView = !categorySlug;

  useEffect(() => {
    navigation.setOptions({ title: isRootView ? 'All Categories' : categoryName });
  }, [categoryName, navigation, isRootView]);

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

      if (isRootView) {
        // Root view: fetch all top-level categories
        const catData = await categoriesAPI.getAll();
        const categories = Array.isArray(catData) ? catData : catData.results || [];
        setAllCategories(categories);
        setSubcategories(categories);
      } else {
        // Category detail: use the detail endpoint which returns children
        const categoryDetail = await categoriesAPI.getBySlug(categorySlug);
        setCategory(categoryDetail);

        const children = categoryDetail?.children || [];
        setSubcategories(children);

        // Also store children in allCategories for child count display
        setAllCategories(children);

        // Only fetch products if this is a leaf category (no children)
        if (children.length === 0) {
          const prodData = await productsAPI.getAll({ category: categorySlug });
          const prods = Array.isArray(prodData) ? prodData : prodData.results || [];
          setProducts(prods);
        } else {
          setProducts([]);
        }
      }
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

  const navigateToCategory = (cat: any) => {
    navigation.push('CategoryBrowse', {
      categorySlug: cat.slug,
      categoryName: cat.name,
    });
  };

  // ═══════════════════════════════════════════
  // ROOT VIEW: All Categories Grid
  // ═══════════════════════════════════════════
  const renderCategoryCard = ({ item, index }: any) => {
    const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
    const childCount = allCategories.filter((c: any) => c.parent_id === item.id).length;

    return (
      <TouchableOpacity
        style={styles.categoryCard}
        onPress={() => navigateToCategory(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.categoryIconContainer, { backgroundColor: color + '15' }]}>
          {item.image_url ? (
            <Image
              source={{ uri: item.image_url }}
              style={styles.categoryImage}
              resizeMode="cover"
            />
          ) : (
            <Icon name={getCategoryIcon(item.slug)} size={32} color={color} />
          )}
        </View>
        <Text style={styles.categoryCardName} numberOfLines={2}>
          {item.name}
        </Text>
        {item.product_count != null && (
          <Text style={styles.categoryCardCount}>
            {item.product_count} products
          </Text>
        )}
        {childCount > 0 && (
          <Text style={styles.categoryCardSub}>
            {childCount} subcategories
          </Text>
        )}
        <View style={[styles.categoryCardArrow, { backgroundColor: color + '20' }]}>
          <Icon name="chevron-forward" size={14} color={color} />
        </View>
      </TouchableOpacity>
    );
  };

  // ═══════════════════════════════════════════
  // CATEGORY VIEW: Products + Subcategories
  // ═══════════════════════════════════════════
  const renderProduct = ({ item }: any) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetail', { slug: item.slug })}
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

  // ═══════════════════════════════════════════
  // ROOT VIEW: Show all categories as a grid
  // ═══════════════════════════════════════════
  if (isRootView) {
    return (
      <View style={styles.container}>
        <FlatList
          data={subcategories}
          renderItem={renderCategoryCard}
          keyExtractor={(item) => item.id?.toString() || item.slug}
          numColumns={2}
          columnWrapperStyle={styles.categoryRow}
          contentContainerStyle={styles.categoryListContent}
          ListHeaderComponent={
            <View style={styles.rootHeader}>
              <Icon name="grid" size={22} color="#3b82f6" />
              <Text style={styles.rootHeaderTitle}>Browse All Categories</Text>
              <Text style={styles.rootHeaderSubtitle}>
                {subcategories.length} categories available
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="folder-open-outline" size={64} color="#9ca3af" />
              <Text style={styles.emptyText}>No categories found</Text>
            </View>
          }
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

  // ═══════════════════════════════════════════
  // HAS SUBCATEGORIES: Show subcategory grid
  // ═══════════════════════════════════════════
  if (subcategories.length > 0) {
    return (
      <View style={styles.container}>
        <FlatList
          data={subcategories}
          renderItem={renderCategoryCard}
          keyExtractor={(item) => item.id?.toString() || item.slug}
          numColumns={2}
          columnWrapperStyle={styles.categoryRow}
          contentContainerStyle={styles.categoryListContent}
          ListHeaderComponent={
            <View style={styles.rootHeader}>
              <Icon name="layers-outline" size={22} color="#3b82f6" />
              <Text style={styles.rootHeaderTitle}>{categoryName}</Text>
              <Text style={styles.rootHeaderSubtitle}>
                {subcategories.length} subcategories
              </Text>
              {category?.description ? (
                <Text style={styles.categoryDescription}>{category.description}</Text>
              ) : null}
            </View>
          }
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

  // ═══════════════════════════════════════════
  // LEAF CATEGORY: Show products
  // ═══════════════════════════════════════════
  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item, index) => item.id?.toString() || `product-${index}`}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
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
        }
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

  // ═══ Root Category Grid ═══
  rootHeader: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    alignItems: 'center',
  },
  rootHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  rootHeaderSubtitle: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 4,
  },
  categoryDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 6,
    textAlign: 'center',
  },
  categoryListContent: {
    paddingBottom: 16,
  },
  categoryRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  categoryCard: {
    width: CATEGORY_CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  categoryImage: {
    width: 64,
    height: 64,
  },
  categoryCardName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  categoryCardCount: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '500',
  },
  categoryCardSub: {
    fontSize: 10,
    color: '#3b82f6',
    fontWeight: '600',
    marginTop: 2,
  },
  categoryCardArrow: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ═══ Category Detail View ═══
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
  subcategorySection: {
    backgroundColor: '#fff',
    paddingTop: 12,
    paddingBottom: 12,
    marginBottom: 8,
  },
  subcategoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  subcategoryBarContent: {
    paddingHorizontal: 16,
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

  // ═══ Product Grid ═══
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