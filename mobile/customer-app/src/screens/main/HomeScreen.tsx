import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  TextInput,
  StatusBar,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { categoriesAPI, productsAPI, bannersAPI } from '../../../../shared/api/customer-api';
import { useCurrencyStore } from '../../store/currencyStore';
import CurrencySelector from '../../components/CurrencySelector';
import { usePrice } from '../../hooks/usePrice';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PRODUCT_CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;
const BANNER_WIDTH = SCREEN_WIDTH - 32;

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  image_url?: string;
  parent_id?: string;
  product_count?: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price?: number;
  primary_image?: string;
  images?: { url: string }[];
  rating?: number;
  review_count?: number;
  vendor?: { business_name: string };
  vendor_name?: string;
  category?: { name: string; slug: string };
}

const CATEGORY_ICONS: Record<string, string> = {
  electronics: 'phone-portrait',
  'fashion-apparel': 'shirt',
  'home-garden': 'home',
  'health-beauty': 'sparkles',
  'sports-outdoors': 'fitness',
  automotive: 'car',
  'food-beverages': 'restaurant',
  'baby-kids': 'happy',
  'books-stationery': 'book',
  'pet-supplies': 'paw',
  'jewelry-watches': 'diamond',
  'toys-games': 'game-controller',
  'furniture-decor': 'bed',
  'office-school-supplies': 'briefcase',
  'electrical-lighting': 'bulb',
  'industrial-tools': 'construct',
  agriculture: 'leaf',
  'packaging-printing': 'cube',
  'textiles-fabrics': 'color-palette',
  'minerals-energy': 'flash',
};

// Banners fetched from backend API

const QUICK_MENUS = [
  { icon: 'flash', label: 'Flash Deals', color: '#ef4444', bg: '#fee2e2', nav: 'Deals' },
  { icon: 'star', label: 'Top Rated', color: '#f59e0b', bg: '#fef3c7', nav: 'BestSellers' },
  { icon: 'time', label: 'New In', color: '#3b82f6', bg: '#dbeafe', nav: 'NewArrivals' },
  { icon: 'heart', label: 'Wishlist', color: '#ec4899', bg: '#fce7f3', nav: 'Wishlist' },
  { icon: 'pricetag', label: 'Coupons', color: '#8b5cf6', bg: '#ede9fe', nav: 'Deals' },
  { icon: 'globe', label: 'Suppliers', color: '#06b6d4', bg: '#cffafe', nav: 'Search' },
  { icon: 'trending-up', label: 'Trending', color: '#10b981', bg: '#d1fae5', nav: 'Products' },
  { icon: 'grid', label: 'Categories', color: '#6b7280', bg: '#f3f4f6', nav: 'CategoryBrowse' },
];

// Trending searches derived from categories in render

function getIconForCategory(slug: string): string {
  return CATEGORY_ICONS[slug] || 'grid-outline';
}

// ═══════════════════════════════════════════════════════
// Product Card Component
// ═══════════════════════════════════════════════════════
function ProductCard({ product, onPress }: { product: Product; onPress: () => void }) {
  const { formatPrice } = usePrice();
  const imageUrl = product.primary_image || product.images?.[0]?.url;
  const price = Number(product.price || 0);
  const comparePrice = Number(product.compare_at_price || 0);
  const discount = comparePrice > price && comparePrice > 0
    ? Math.round(((comparePrice - price) / comparePrice) * 100)
    : 0;

  return (
    <TouchableOpacity style={styles.productCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.productImageContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.productImage} resizeMode="cover" />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <Icon name="image-outline" size={32} color="#d1d5db" />
          </View>
        )}
        {discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discount}%</Text>
          </View>
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.productPrice}>{formatPrice(price)}</Text>
          {comparePrice > price && comparePrice > 0 && (
            <Text style={styles.comparePrice}>{formatPrice(comparePrice)}</Text>
          )}
        </View>
        <View style={styles.productMeta}>
          {Number(product.rating || 0) > 0 && (
            <View style={styles.ratingRow}>
              <Icon name="star" size={10} color="#f59e0b" />
              <Text style={styles.ratingText}>{Number(product.rating).toFixed(1)}</Text>
            </View>
          )}
          <Text style={styles.productVendor} numberOfLines={1}>
            {product.vendor?.business_name || product.vendor_name || 'Seller'}
          </Text>
        </View>
        <View style={styles.tradeAssurance}>
          <Icon name="shield-checkmark" size={10} color="#10b981" />
          <Text style={styles.tradeAssuranceText}>Trade Assurance</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ═══════════════════════════════════════════════════════
// Horizontal Product Card (for deal rows)
// ═══════════════════════════════════════════════════════
function SmallProductCard({ product, onPress }: { product: Product; onPress: () => void }) {
  const { formatPrice } = usePrice();
  const imageUrl = product.primary_image || product.images?.[0]?.url;
  const price = Number(product.price || 0);
  const comparePrice = Number(product.compare_at_price || 0);
  const discount = comparePrice > price && comparePrice > 0
    ? Math.round(((comparePrice - price) / comparePrice) * 100)
    : 0;

  return (
    <TouchableOpacity style={styles.smallCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.smallCardImage}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <Icon name="image-outline" size={24} color="#d1d5db" />
          </View>
        )}
      </View>
      <Text style={styles.smallCardPrice}>{formatPrice(price)}</Text>
      {discount > 0 && (
        <Text style={styles.smallCardDiscount}>-{discount}%</Text>
      )}
    </TouchableOpacity>
  );
}

// ═══════════════════════════════════════════════════════
// Main HomeScreen
// ═══════════════════════════════════════════════════════
export default function HomeScreen({ navigation }: any) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBanner, setActiveBanner] = useState(0);
  const [activeTab, setActiveTab] = useState('all');
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [banners, setBanners] = useState<any[]>([]);
  const [countdownText, setCountdownText] = useState<string | null>(null);
  const bannerRef = useRef<ScrollView>(null);
  const { currency } = useCurrencyStore();
  const { formatPrice } = usePrice();

  const fetchData = useCallback(async () => {
    try {
      const [catsRes, allRes, newRes, bestRes, bannersRes] = await Promise.allSettled([
        categoriesAPI.getAll(),
        productsAPI.getAll({ limit: 50, sort_by: 'created_at', sort_order: 'desc' }),
        productsAPI.getAll({ limit: 20, sort_by: 'created_at', sort_order: 'desc' }),
        productsAPI.getAll({ limit: 20, sort_by: 'rating', sort_order: 'desc' }),
        bannersAPI.getAll(),
      ]);

      if (bannersRes.status === 'fulfilled') {
        const b = Array.isArray(bannersRes.value) ? bannersRes.value : [];
        setBanners(b);
      }
      if (catsRes.status === 'fulfilled') {
        const cats = Array.isArray(catsRes.value) ? catsRes.value : catsRes.value?.results || [];
        const topLevel = cats.filter((c: any) => !c.parent_id);
        setCategories(topLevel.length > 0 ? topLevel : cats);
      }
      if (allRes.status === 'fulfilled') {
        const prods = allRes.value?.results || allRes.value || [];
        setAllProducts(Array.isArray(prods) ? prods : []);
      }
      if (newRes.status === 'fulfilled') {
        const prods = newRes.value?.results || newRes.value || [];
        setNewArrivals(Array.isArray(prods) ? prods.slice(0, 20) : []);
      }
      if (bestRes.status === 'fulfilled') {
        const prods = bestRes.value?.results || bestRes.value || [];
        setBestSellers(Array.isArray(prods) ? prods.slice(0, 20) : []);
      }
    } catch (error) {
      console.error('Failed to fetch home data:', error);
      setLoadError('Failed to load data. Pull down to retry.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-scroll banners
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveBanner(prev => {
        const next = banners.length > 0 ? (prev + 1) % banners.length : 0;
        bannerRef.current?.scrollTo({ x: next * (BANNER_WIDTH + 12), animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [banners.length]);

  // Countdown timer from banners
  useEffect(() => {
    const countdownBanner = banners.find((b: any) => b.countdown_end);
    if (!countdownBanner) { setCountdownText(null); return; }
    const tick = () => {
      const end = new Date(countdownBanner.countdown_end).getTime();
      const diff = end - Date.now();
      if (diff <= 0) { setCountdownText('Ended'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdownText(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [banners]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const navigateToProduct = (product: Product) => {
    navigation.navigate('ProductDetail', { slug: product.slug, productId: product.id });
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigation.navigate('Search', { query: searchQuery });
    }
  };

  const handleCategoryFilter = async (slug: string) => {
    setActiveTab(slug);
    if (slug === 'all') {
      fetchData();
      return;
    }
    try {
      const res = await productsAPI.getAll({ category: slug, limit: 300, sort_by: 'created_at', sort_order: 'desc' });
      const prods = res?.results || res || [];
      setAllProducts(Array.isArray(prods) ? prods : []);
    } catch (error) {
      console.error('Error fetching category:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading Channah...</Text>
      </View>
    );
  }

  if (loadError && allProducts.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Icon name="cloud-offline-outline" size={48} color="#9ca3af" />
        <Text style={[styles.loadingText, { color: '#ef4444', marginTop: 12 }]}>{loadError}</Text>
        <TouchableOpacity
          style={{ marginTop: 16, backgroundColor: '#3b82f6', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 }}
          onPress={() => { setLoadError(null); setIsLoading(true); fetchData(); }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3b82f6" />

      {/* ═══════ HEADER BAR (Alibaba orange style) ═══════ */}
      <LinearGradient colors={['#3b82f6', '#6366f1']} style={styles.headerGradient}>
        <View style={styles.headerTop}>
          <View style={styles.headerLogo}>
            <Text style={styles.headerTitle}>Channah</Text>
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>MARKETPLACE</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => setShowCurrencyPicker(true)} style={styles.currencyBtn}>
              <Text style={styles.currencyFlag}>{currency.flag}</Text>
              <Text style={styles.currencyCode}>{currency.code}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Chat')} style={styles.headerIconBtn}>
              <Icon name="chatbubble-ellipses-outline" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Cart')} style={styles.headerIconBtn}>
              <Icon name="cart-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TouchableOpacity
            style={styles.searchBar}
            onPress={() => navigation.navigate('Search')}
            activeOpacity={0.9}
          >
            <Icon name="search" size={18} color="#3b82f6" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products, suppliers..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <TouchableOpacity style={styles.cameraBtn} onPress={() => navigation.navigate('Search')}>
              <Icon name="camera-outline" size={18} color="#666" />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />}
      >

        {/* ═══════ TRENDING SEARCHES ═══════ */}
        <View style={styles.trendingContainer}>
          <View style={styles.trendingHeader}>
            <Icon name="trending-up" size={14} color="#3b82f6" />
            <Text style={styles.trendingLabel}>Trending:</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {categories.slice(0, 8).map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={styles.trendingChip}
                onPress={() => navigation.navigate('Search', { query: cat.name })}
              >
                <Text style={styles.trendingChipText}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ═══════ QUICK MENU GRID (8 icons, 2 rows) ═══════ */}
        <View style={styles.quickMenuContainer}>
          <View style={styles.quickMenuGrid}>
            {QUICK_MENUS.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.quickMenuItem}
                onPress={() => navigation.navigate(item.nav)}
              >
                <View style={[styles.quickMenuIcon, { backgroundColor: item.bg }]}>
                  <Icon name={item.icon} size={20} color={item.color} />
                </View>
                <Text style={styles.quickMenuLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ═══════ BANNER CAROUSEL ═══════ */}
        <View style={styles.bannerSection}>
          <ScrollView
            ref={bannerRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            decelerationRate="fast"
            snapToInterval={BANNER_WIDTH + 12}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / (BANNER_WIDTH + 12));
              setActiveBanner(index);
            }}
          >
            {banners.map((banner: any, i: number) => (
              <TouchableOpacity key={banner.id || i} activeOpacity={0.9}>
                <LinearGradient
                  colors={[banner.color_from || '#3b82f6', banner.color_to || '#1d4ed8'] as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.bannerCard}
                >
                  <View style={styles.bannerContent}>
                    <Icon name={banner.icon || 'flash'} size={28} color="rgba(255,255,255,0.9)" />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={styles.bannerTitle}>{banner.title}</Text>
                      <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
                    </View>
                    <Icon name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {/* Dots */}
          <View style={styles.bannerDots}>
            {banners.map((_: any, i: number) => (
              <View key={i} style={[styles.bannerDot, activeBanner === i && styles.bannerDotActive]} />
            ))}
          </View>
        </View>

        {/* ═══════ LARGE ADVERTISEMENT BANNER ═══════ */}
        <TouchableOpacity style={styles.largeAdBanner} activeOpacity={0.9}>
          <LinearGradient
            colors={['#9333ea', '#ec4899', '#ef4444']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.largeAdGradient}
          >
            <View style={styles.largeAdContent}>
              <View style={styles.largeAdBadge}>
                <Icon name="sparkles" size={14} color="#fff" />
                <Text style={styles.largeAdBadgeText}>MEGA SALE EVENT</Text>
              </View>
              <Text style={styles.largeAdTitle}>Up to 70% Off{'\n'}Everything</Text>
              <Text style={styles.largeAdSubtitle}>
                Limited time offer on thousands of products
              </Text>
              <View style={styles.largeAdButton}>
                <Text style={styles.largeAdButtonText}>Shop Now</Text>
                <Icon name="arrow-forward" size={16} color="#000" />
              </View>
            </View>
            <View style={styles.largeAdDecor1} />
            <View style={styles.largeAdDecor2} />
          </LinearGradient>
        </TouchableOpacity>

        {/* ═══════ CATEGORIES (horizontal scroll with icons) ═══════ */}
        {categories.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionIndicator} />
                <Text style={styles.sectionTitle}>Categories</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('CategoryBrowse')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryItem}
                  onPress={() => handleCategoryFilter(category.slug)}
                >
                  <View style={[styles.categoryCircle, activeTab === category.slug && styles.categoryCircleActive]}>
                    {category.image_url ? (
                      <Image source={{ uri: category.image_url }} style={styles.categoryImage} resizeMode="cover" />
                    ) : (
                      <Icon
                        name={getIconForCategory(category.slug)}
                        size={22}
                        color={activeTab === category.slug ? '#fff' : '#3b82f6'}
                      />
                    )}
                  </View>
                  <Text style={[styles.categoryName, activeTab === category.slug && styles.categoryNameActive]} numberOfLines={1}>
                    {category.name}
                  </Text>
                  {category.product_count ? (
                    <Text style={styles.categoryCount}>{category.product_count}</Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ═══════ FLASH DEALS SECTION ═══════ */}
        {newArrivals.length > 0 && (
          <View style={styles.dealSection}>
            <LinearGradient colors={['#3b82f6', '#4f46e5']} style={styles.dealHeader}>
              <View style={styles.dealTitleRow}>
                <Icon name="flash" size={18} color="#fbbf24" />
                <Text style={styles.dealTitle}>Flash Deals</Text>
                {countdownText && (
                  <View style={styles.dealCountdown}>
                    <Text style={styles.dealCountdownText}>Ends in {countdownText}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Deals')}>
                <Text style={styles.dealSeeAll}>See All</Text>
              </TouchableOpacity>
            </LinearGradient>
            <FlatList
              data={newArrivals.slice(0, 10)}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => `deal-${item.id}`}
              contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 12 }}
              renderItem={({ item }) => (
                <SmallProductCard product={item} onPress={() => navigateToProduct(item)} />
              )}
            />
          </View>
        )}

        {/* ═══════ POPULAR PICKS (2x2 grid highlight) ═══════ */}
        {allProducts.length >= 4 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionIndicator, { backgroundColor: '#8b5cf6' }]} />
                <Text style={styles.sectionTitle}>Popular Picks</Text>
                <View style={[styles.sectionBadge, { backgroundColor: '#ede9fe' }]}>
                  <Icon name="flame" size={10} color="#8b5cf6" />
                  <Text style={[styles.sectionBadgeText, { color: '#8b5cf6' }]}>Hot</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Products')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.popularGrid}>
              {allProducts.slice(0, 4).map((product) => (
                <TouchableOpacity
                  key={`pop-${product.id}`}
                  style={styles.popularItem}
                  onPress={() => navigateToProduct(product)}
                  activeOpacity={0.7}
                >
                  <View style={styles.popularImage}>
                    {(product.primary_image || product.images?.[0]?.url) ? (
                      <Image
                        source={{ uri: product.primary_image || product.images?.[0]?.url }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                    ) : (
                      <Icon name="image-outline" size={24} color="#d1d5db" />
                    )}
                  </View>
                  <Text style={styles.popularName} numberOfLines={1}>{product.name}</Text>
                  <Text style={styles.popularPrice}>{formatPrice(Number(product.price || 0))}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ═══════ TOP RANKED (horizontal cards with rank badges) ═══════ */}
        {bestSellers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionIndicator, { backgroundColor: '#f59e0b' }]} />
                <Text style={styles.sectionTitle}>Top Ranked</Text>
                <View style={styles.sectionBadge}>
                  <Icon name="trophy" size={10} color="#f59e0b" />
                  <Text style={styles.sectionBadgeText}>Best</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('BestSellers')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={bestSellers}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => `top-${item.id}`}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              renderItem={({ item, index }) => (
                <View style={{ width: PRODUCT_CARD_WIDTH, marginRight: 12, position: 'relative' }}>
                  {index < 3 && (
                    <View style={[styles.rankBadge, index === 0 && { backgroundColor: '#f59e0b' }, index === 1 && { backgroundColor: '#9ca3af' }, index === 2 && { backgroundColor: '#b45309' }]}>
                      <Text style={styles.rankText}>{index + 1}</Text>
                    </View>
                  )}
                  <ProductCard product={item} onPress={() => navigateToProduct(item)} />
                </View>
              )}
            />
          </View>
        )}

        {/* ═══════ JUST FOR YOU / RECOMMENDED (Alibaba's infinite scroll) ═══════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionIndicator, { backgroundColor: '#3b82f6' }]} />
              <Text style={styles.sectionTitle}>Just For You</Text>
              <Text style={styles.productCountBadge}>{allProducts.length} items</Text>
            </View>
          </View>

          {/* Category Filter Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, marginBottom: 12 }}>
            <TouchableOpacity
              style={[styles.filterTab, activeTab === 'all' && styles.filterTabActive]}
              onPress={() => handleCategoryFilter('all')}
            >
              <Text style={[styles.filterTabText, activeTab === 'all' && styles.filterTabTextActive]}>All</Text>
            </TouchableOpacity>
            {categories.slice(0, 8).map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.filterTab, activeTab === cat.slug && styles.filterTabActive]}
                onPress={() => handleCategoryFilter(cat.slug)}
              >
                <Text style={[styles.filterTabText, activeTab === cat.slug && styles.filterTabTextActive]}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Product Grid */}
          {allProducts.length > 0 ? (
            <View>
              {Array.from({ length: Math.ceil(allProducts.length / 2) }, (_, rowIndex) => {
                const pair = allProducts.slice(rowIndex * 2, rowIndex * 2 + 2);
                return (
                  <View key={`row-${rowIndex}`} style={styles.productsGrid}>
                    {pair.map((item) => (
                      <View key={item.id?.toString() || item.slug} style={styles.gridItem}>
                        <ProductCard product={item} onPress={() => navigateToProduct(item)} />
                      </View>
                    ))}
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Icon name="cube-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptyDescription}>
                Try selecting a different category or pull down to refresh.
              </Text>
            </View>
          )}
        </View>

        {/* ═══════ FEATURES STRIP ═══════ */}
        <View style={styles.featuresStrip}>
          {[
            { icon: 'shield-checkmark', label: 'Trade Assurance', desc: 'Payment protection' },
            { icon: 'car', label: 'Fast Shipping', desc: 'Express delivery' },
            { icon: 'ribbon', label: 'Verified', desc: 'Quality sellers' },
            { icon: 'return-down-back', label: 'Easy Returns', desc: 'Hassle-free' },
          ].map((f) => (
            <View key={f.label} style={styles.featureStripItem}>
              <Icon name={f.icon} size={20} color="#3b82f6" />
              <Text style={styles.featureStripLabel}>{f.label}</Text>
              <Text style={styles.featureStripDesc}>{f.desc}</Text>
            </View>
          ))}
        </View>

        {/* ═══════ BECOME A SUPPLIER CTA ═══════ */}
        <TouchableOpacity activeOpacity={0.8} style={styles.supplierCta}>
          <LinearGradient
            colors={['#3b82f6', '#4f46e5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.supplierCtaGradient}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.supplierCtaTitle}>Start Selling on Channah</Text>
              <Text style={styles.supplierCtaSubtitle}>Join thousands of verified suppliers worldwide</Text>
            </View>
            <View style={styles.supplierCtaBtn}>
              <Text style={styles.supplierCtaBtnText}>Join Now</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Bottom Padding */}
        <View style={{ height: 32 }} />
      </ScrollView>

      <CurrencySelector visible={showCurrencyPicker} onClose={() => setShowCurrencyPicker(false)} />
    </View>
  );
}

// ═══════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f3f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f2f3f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },

  // Header
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight ? StatusBar.currentHeight + 8 : 40,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  headerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  headerBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerIconBtn: {
    padding: 4,
  },
  currencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  currencyFlag: {
    fontSize: 14,
  },
  currencyCode: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },

  // Search
  searchContainer: {
    paddingHorizontal: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
    padding: 0,
  },
  cameraBtn: {
    padding: 4,
  },

  // Trending Searches
  trendingContainer: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  trendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  trendingLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
  },
  trendingChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#f0f4ff',
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  trendingChipText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#374151',
  },

  // Quick Menu
  quickMenuContainer: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    marginBottom: 8,
  },
  quickMenuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  quickMenuItem: {
    width: (SCREEN_WIDTH - 32) / 4,
    alignItems: 'center',
    marginBottom: 14,
  },
  quickMenuIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickMenuLabel: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '500',
    color: '#374151',
  },

  // Banner
  bannerSection: {
    marginBottom: 8,
  },
  bannerCard: {
    width: BANNER_WIDTH,
    borderRadius: 12,
    overflow: 'hidden',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  bannerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  bannerDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  bannerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#d1d5db',
  },
  bannerDotActive: {
    backgroundColor: '#3b82f6',
    width: 18,
  },

  // Large Advertisement Banner
  largeAdBanner: {
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  largeAdGradient: {
    padding: 24,
    minHeight: 220,
    justifyContent: 'center',
    position: 'relative',
  },
  largeAdContent: {
    zIndex: 10,
  },
  largeAdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 12,
    gap: 6,
  },
  largeAdBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  largeAdTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    lineHeight: 38,
  },
  largeAdSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 20,
    maxWidth: '80%',
  },
  largeAdButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    alignSelf: 'flex-start',
    gap: 8,
  },
  largeAdButtonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: 'bold',
  },
  largeAdDecor1: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  largeAdDecor2: {
    position: 'absolute',
    bottom: 20,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Section
  section: {
    backgroundColor: '#fff',
    marginBottom: 8,
    paddingVertical: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIndicator: {
    width: 3,
    height: 16,
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  sectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  sectionBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#f59e0b',
  },
  seeAll: {
    fontSize: 13,
    color: '#3b82f6',
    fontWeight: '600',
  },
  productCountBadge: {
    fontSize: 11,
    color: '#9ca3af',
    marginLeft: 4,
  },

  // Categories
  categoryItem: {
    alignItems: 'center',
    width: 68,
  },
  categoryCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
  },
  categoryCircleActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  categoryImage: {
    width: 52,
    height: 52,
  },
  categoryName: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  categoryNameActive: {
    color: '#3b82f6',
    fontWeight: '700',
  },
  categoryCount: {
    fontSize: 9,
    color: '#9ca3af',
    marginTop: 1,
  },

  // Deal Section
  dealSection: {
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  dealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dealTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  dealCountdown: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  dealCountdownText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  dealSeeAll: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },

  // Small Product Card
  smallCard: {
    width: 110,
    marginRight: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  smallCardImage: {
    width: 110,
    height: 110,
    backgroundColor: '#f3f4f6',
  },
  smallCardPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1d4ed8',
    paddingHorizontal: 8,
    paddingTop: 6,
  },
  smallCardDiscount: {
    fontSize: 10,
    color: '#9ca3af',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },

  // Popular Picks
  popularGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
  },
  popularItem: {
    width: (SCREEN_WIDTH - 42) / 2,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  popularImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 8,
  },
  popularName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
  },
  popularPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginTop: 2,
  },

  // Rank Badge
  rankBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  rankText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },

  // Filter Tabs
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  filterTabActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  filterTabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },

  // Products Grid
  productsGrid: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  gridItem: {
    width: PRODUCT_CARD_WIDTH,
  },

  // Product Card
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    overflow: 'hidden',
  },
  productImageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f9fafb',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  discountBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  productInfo: {
    padding: 8,
  },
  productName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1f2937',
    lineHeight: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 5,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1d4ed8',
  },
  comparePrice: {
    fontSize: 11,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#374151',
  },
  productVendor: {
    fontSize: 10,
    color: '#9ca3af',
    flex: 1,
  },
  tradeAssurance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    alignSelf: 'flex-start',
  },
  tradeAssuranceText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#10b981',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 12,
  },
  emptyDescription: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },

  // Features Strip
  featuresStrip: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  featureStripItem: {
    flex: 1,
    alignItems: 'center',
  },
  featureStripLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#374151',
    marginTop: 6,
    textAlign: 'center',
  },
  featureStripDesc: {
    fontSize: 9,
    color: '#9ca3af',
    marginTop: 1,
    textAlign: 'center',
  },

  // Supplier CTA
  supplierCta: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 14,
    overflow: 'hidden',
  },
  supplierCtaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 12,
  },
  supplierCtaTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
  supplierCtaSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  supplierCtaBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  supplierCtaBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
});
