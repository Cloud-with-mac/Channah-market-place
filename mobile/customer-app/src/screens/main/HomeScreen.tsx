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
  Animated,
  Easing,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { categoriesAPI, productsAPI } from '../../../../shared/api/customer-api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PRODUCT_CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

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

const CATEGORY_SECTION_CONFIG: { slug: string; name: string; subtitle: string; icon: string; color: string }[] = [
  { slug: 'electronics', name: 'Electronics & Technology', subtitle: 'Latest gadgets from verified suppliers', icon: 'laptop-outline', color: '#3b82f6' },
  { slug: 'fashion', name: 'Fashion & Apparel', subtitle: 'Trending styles from fashion suppliers', icon: 'shirt-outline', color: '#ec4899' },
  { slug: 'home-garden', name: 'Home & Garden', subtitle: 'Quality home products from manufacturers', icon: 'home-outline', color: '#10b981' },
];

function getIconForCategory(slug: string): string {
  return CATEGORY_ICONS[slug] || 'grid-outline';
}

// Animated fade-in wrapper for sections
function FadeInSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: delay * 1000,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay: delay * 1000,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      {children}
    </Animated.View>
  );
}

// Shimmer loading placeholder
function ShimmerPlaceholder({ width, height, style }: { width: number | string; height: number; style?: any }) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    ).start();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return (
    <View style={[{ width: width as any, height, backgroundColor: '#e5e7eb', borderRadius: 8, overflow: 'hidden' }, style]}>
      <Animated.View
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#f3f4f6',
          transform: [{ translateX }],
        }}
      />
    </View>
  );
}

// AI Assistant Floating Button
function AIAssistantButton({ onPress }: { onPress: () => void }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.aiButtonContainer, { transform: [{ scale: pulseAnim }] }]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <LinearGradient
          colors={['#8b5cf6', '#6366f1', '#3b82f6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.aiButton}
        >
          <Icon name="sparkles" size={22} color="#fff" />
          <Text style={styles.aiButtonText}>AI</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Hero image carousel with auto-slide
function HeroCarousel() {
  const scrollRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const heroSlides = [
    { gradient: ['#3b82f6', '#1d4ed8'] as const, icon: 'globe-outline', title: 'Global Trade', subtitle: 'Ship to 200+ countries' },
    { gradient: ['#8b5cf6', '#6d28d9'] as const, icon: 'shield-checkmark-outline', title: 'Trade Assurance', subtitle: 'Buyer protection guaranteed' },
    { gradient: ['#10b981', '#059669'] as const, icon: 'trending-up-outline', title: 'Grow Business', subtitle: 'Join thousands of sellers' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % heroSlides.length;
      scrollRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    }, 4000);
    return () => clearInterval(interval);
  }, [currentIndex]);

  return (
    <View>
      <FlatList
        ref={scrollRef}
        data={heroSlides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => i.toString()}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 32));
          setCurrentIndex(index);
        }}
        renderItem={({ item }) => (
          <LinearGradient
            colors={item.gradient as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroSlide}
          >
            <View style={styles.heroSlideIconBg}>
              <Icon name={item.icon} size={28} color="#fff" />
            </View>
            <Text style={styles.heroSlideTitle}>{item.title}</Text>
            <Text style={styles.heroSlideSubtitle}>{item.subtitle}</Text>
          </LinearGradient>
        )}
      />
      <View style={styles.carouselDots}>
        {heroSlides.map((_, i) => (
          <View
            key={i}
            style={[styles.carouselDot, currentIndex === i && styles.carouselDotActive]}
          />
        ))}
      </View>
    </View>
  );
}

// Countdown Timer Component
function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 59, seconds: 59 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) { seconds = 59; minutes--; }
        if (minutes < 0) { minutes = 59; hours--; }
        if (hours < 0) { hours = 23; minutes = 59; seconds = 59; }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <View style={styles.countdownRow}>
      <View style={styles.countdownBox}>
        <Text style={styles.countdownNumber}>{pad(timeLeft.hours)}</Text>
        <Text style={styles.countdownLabel}>HRS</Text>
      </View>
      <Text style={styles.countdownSep}>:</Text>
      <View style={styles.countdownBox}>
        <Text style={styles.countdownNumber}>{pad(timeLeft.minutes)}</Text>
        <Text style={styles.countdownLabel}>MIN</Text>
      </View>
      <Text style={styles.countdownSep}>:</Text>
      <View style={styles.countdownBox}>
        <Text style={styles.countdownNumber}>{pad(timeLeft.seconds)}</Text>
        <Text style={styles.countdownLabel}>SEC</Text>
      </View>
    </View>
  );
}

function ProductCard({ product, onPress }: { product: Product; onPress: () => void }) {
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
        <Text style={styles.productVendor} numberOfLines={1}>
          {product.vendor?.business_name || product.vendor_name || 'Channah Seller'}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.productPrice}>${Number(product.price || 0).toFixed(2)}</Text>
          {product.compare_at_price != null && Number(product.compare_at_price) > Number(product.price || 0) && (
            <Text style={styles.comparePrice}>${Number(product.compare_at_price).toFixed(2)}</Text>
          )}
        </View>
        {(product.rating ?? 0) > 0 && (
          <View style={styles.ratingRow}>
            <Icon name="star" size={12} color="#f59e0b" />
            <Text style={styles.ratingText}>{product.rating?.toFixed(1)}</Text>
            <Text style={styles.reviewCount}>({product.review_count || 0})</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function EmptyProductState({ title, description }: { title: string; description: string }) {
  return (
    <View style={styles.emptyState}>
      <Icon name="cube-outline" size={40} color="#d1d5db" />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
    </View>
  );
}

export default function HomeScreen({ navigation }: any) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryProducts, setCategoryProducts] = useState<Record<string, Product[]>>({});
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const categoryPromises = CATEGORY_SECTION_CONFIG.map((cat) =>
        productsAPI.getAll({ category: cat.slug, limit: 6 }).catch(() => [])
      );

      const [catsRes, featuredRes, bestRes, ...catResults] = await Promise.allSettled([
        categoriesAPI.getAll(),
        productsAPI.getAll({ limit: 6, sort_by: 'created_at', sort_order: 'desc' }),
        productsAPI.getAll({ limit: 6, sort_by: 'rating', sort_order: 'desc' }),
        ...categoryPromises,
      ]);

      if (catsRes.status === 'fulfilled') {
        const cats = Array.isArray(catsRes.value) ? catsRes.value : catsRes.value?.results || [];
        const topLevel = cats.filter((c: any) => !c.parent_id);
        setCategories(topLevel.length > 0 ? topLevel : cats.slice(0, 10));
      }
      if (featuredRes.status === 'fulfilled') {
        const prods = featuredRes.value?.results || featuredRes.value || [];
        setFeaturedProducts(Array.isArray(prods) ? prods.slice(0, 6) : []);
      }
      if (bestRes.status === 'fulfilled') {
        const prods = bestRes.value?.results || bestRes.value || [];
        setBestSellers(Array.isArray(prods) ? prods.slice(0, 6) : []);
      }

      const productsMap: Record<string, Product[]> = {};
      CATEGORY_SECTION_CONFIG.forEach((cat, index) => {
        const res = catResults[index];
        if (res.status === 'fulfilled') {
          const data = res.value;
          productsMap[cat.slug] = Array.isArray(data) ? data : data?.results || data?.items || [];
        } else {
          productsMap[cat.slug] = [];
        }
      });
      setCategoryProducts(productsMap);
    } catch (error) {
      console.error('Failed to fetch home data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const totalProducts = Object.values(categoryProducts).flat().length;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <>
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Channah</Text>
          <Text style={styles.headerSubtitle}>Marketplace</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => navigation.navigate('Search')} style={styles.headerIcon}>
            <Icon name="search" size={22} color="#1f2937" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.headerIcon}>
            <Icon name="notifications-outline" size={22} color="#1f2937" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero Carousel */}
      <FadeInSection delay={0}>
        <View style={styles.heroCarouselContainer}>
          <HeroCarousel />
        </View>
      </FadeInSection>

      {/* Hero Section */}
      <FadeInSection delay={0.1}>
      <View style={styles.heroSection}>
        <View style={styles.heroBadge}>
          <Icon name="sparkles" size={14} color="#3b82f6" />
          <Text style={styles.heroBadgeText}>The Leading B2B Marketplace</Text>
        </View>
        <Text style={styles.heroTitle}>Find Quality Suppliers</Text>
        <Text style={styles.heroTitleAccent}>Ship Worldwide</Text>
        <Text style={styles.heroSubtitle}>
          Connect with verified suppliers and manufacturers. Get competitive quotes and trade assurance.
        </Text>

        {/* Search Bar */}
        <View style={styles.heroSearchContainer}>
          <View style={styles.heroSearchBar}>
            <Icon name="cube-outline" size={18} color="#9ca3af" />
            <TextInput
              style={styles.heroSearchInput}
              placeholder="Search products, suppliers..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <TouchableOpacity style={styles.heroSearchButton} onPress={handleSearch}>
              <Text style={styles.heroSearchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalProducts > 0 ? `${totalProducts}+` : '200K+'}</Text>
            <Text style={styles.statLabel}>Products</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{categories.length > 0 ? `${categories.length * 100}+` : '5K+'}</Text>
            <Text style={styles.statLabel}>Suppliers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{categories.length > 0 ? `${categories.length}` : '50+'}</Text>
            <Text style={styles.statLabel}>Categories</Text>
          </View>
        </View>

        {/* CTA Buttons */}
        <View style={styles.heroButtons}>
          <TouchableOpacity style={styles.heroPrimaryBtn} onPress={() => navigation.navigate('Products')}>
            <Text style={styles.heroPrimaryBtnText}>Browse Products</Text>
            <Icon name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.heroSecondaryBtn} onPress={() => navigation.navigate('About')}>
            <Text style={styles.heroSecondaryBtnText}>Become a Supplier</Text>
          </TouchableOpacity>
        </View>
      </View>
      </FadeInSection>

      {/* Features Bar */}
      <FadeInSection delay={0.15}>
      <View style={styles.featuresBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuresScroll}>
          {[
            { icon: 'car-outline', title: 'Free Delivery', desc: 'On orders over $50' },
            { icon: 'shield-checkmark-outline', title: 'Secure Payment', desc: '100% protected' },
            { icon: 'headset-outline', title: '24/7 Support', desc: 'Always here to help' },
            { icon: 'card-outline', title: 'Easy Returns', desc: '30-day policy' },
          ].map((feature) => (
            <View key={feature.title} style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Icon name={feature.icon} size={20} color="#3b82f6" />
              </View>
              <View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.desc}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
      </FadeInSection>

      {/* Shop by Category */}
      <FadeInSection delay={0.2}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Shop by Category</Text>
            <Text style={styles.sectionSubtitle}>Browse millions of products from verified suppliers</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('CategoryBrowse')}>
            <Text style={styles.seeAll}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.categoryGrid}>
          {categories.slice(0, 8).map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryGridItem}
              onPress={() => navigation.navigate('Products', { category: category.slug })}
            >
              <View style={styles.categoryCircle}>
                {category.image_url ? (
                  <Image source={{ uri: category.image_url }} style={styles.categoryImage} resizeMode="cover" />
                ) : (
                  <Icon name={getIconForCategory(category.slug)} size={22} color="#3b82f6" />
                )}
              </View>
              <Text style={styles.categoryName} numberOfLines={2}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      </FadeInSection>

      {/* Featured Suppliers */}
      <View style={styles.sectionGray}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Featured Suppliers</Text>
            <Text style={styles.sectionSubtitle}>Connect with verified manufacturers and wholesalers</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Products')}>
            <Text style={styles.seeAll}>View All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {categories.slice(0, 4).map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.supplierCard}
              onPress={() => navigation.navigate('Products', { category: cat.slug })}
            >
              <View style={styles.supplierAvatar}>
                <Text style={styles.supplierAvatarText}>{cat.name.charAt(0)}</Text>
              </View>
              <View style={styles.supplierVerifiedBadge}>
                <Icon name="shield-checkmark" size={10} color="#3b82f6" />
                <Text style={styles.supplierVerifiedText}>Verified</Text>
              </View>
              <Text style={styles.supplierName} numberOfLines={1}>{cat.name} Suppliers</Text>
              <View style={styles.supplierRating}>
                <Icon name="star" size={12} color="#f59e0b" />
                <Text style={styles.supplierRatingText}>4.8</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Flash Sale Banner */}
      <FadeInSection delay={0.25}>
      <LinearGradient
        colors={['#3b82f6', '#6366f1', '#8b5cf6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.flashSaleBanner}
      >
        <View style={styles.flashSaleContent}>
          <View style={styles.flashSaleBadge}>
            <Icon name="flash" size={12} color="#fff" />
            <Text style={styles.flashSaleBadgeText}>Flash Sale</Text>
          </View>
          <Text style={styles.flashSaleTitle}>Up to 50% Off</Text>
          <Text style={styles.flashSaleSubtitle}>Amazing deals on selected products! Limited time offer.</Text>
          <View style={styles.flashSaleTimerContainer}>
            <Icon name="time-outline" size={16} color="#fff" />
            <Text style={styles.flashSaleTimerLabel}>Sale ends in:</Text>
          </View>
          <CountdownTimer />
          <TouchableOpacity style={styles.flashSaleButton} onPress={() => navigation.navigate('Deals')}>
            <Text style={styles.flashSaleButtonText}>Shop Now</Text>
            <Icon name="arrow-forward" size={16} color="#3b82f6" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      </FadeInSection>

      {/* Category Product Sections (Electronics, Fashion, Home & Garden) */}
      {CATEGORY_SECTION_CONFIG.map((catConfig) => {
        const products = categoryProducts[catConfig.slug] || [];
        return (
          <View key={catConfig.slug} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionIcon, { backgroundColor: catConfig.color + '15' }]}>
                  <Icon name={catConfig.icon} size={18} color={catConfig.color} />
                </View>
                <View>
                  <Text style={styles.sectionTitle}>{catConfig.name}</Text>
                  <Text style={styles.sectionSubtitle}>{catConfig.subtitle}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Products', { category: catConfig.slug })}>
                <Text style={styles.seeAll}>View All</Text>
              </TouchableOpacity>
            </View>
            {products.length > 0 ? (
              <FlatList
                data={products.slice(0, 6)}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingHorizontal: 16 }}
                renderItem={({ item }) => (
                  <View style={{ width: PRODUCT_CARD_WIDTH, marginRight: 12 }}>
                    <ProductCard product={item} onPress={() => navigateToProduct(item)} />
                  </View>
                )}
              />
            ) : (
              <EmptyProductState
                title={`No ${catConfig.name.toLowerCase()} yet`}
                description={`${catConfig.name} products will appear here when suppliers add them.`}
              />
            )}
          </View>
        );
      })}

      {/* RFQ Banner */}
      <FadeInSection delay={0.3}>
      <LinearGradient
        colors={['#3b82f6', '#06b6d4', '#10b981']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.rfqBanner}
      >
        <View style={styles.rfqBadge}>
          <Icon name="sparkles" size={12} color="#fff" />
          <Text style={styles.rfqBadgeText}>B2B Trade Services</Text>
        </View>
        <Text style={styles.rfqTitle}>Request Quotes from Multiple Suppliers</Text>
        <Text style={styles.rfqSubtitle}>
          Tell us what you need. Get quotes from verified suppliers. Compare and choose the best deal.
        </Text>
        <View style={styles.rfqButtons}>
          <TouchableOpacity style={styles.rfqPrimaryBtn} onPress={() => navigation.navigate('Products')}>
            <Text style={styles.rfqPrimaryBtnText}>Request Quote</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rfqSecondaryBtn} onPress={() => navigation.navigate('Products')}>
            <Text style={styles.rfqSecondaryBtnText}>Find Suppliers</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
      </FadeInSection>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('Deals')}>
          <View style={[styles.quickActionIcon, { backgroundColor: '#fee2e2' }]}>
            <Icon name="flame" size={20} color="#ef4444" />
          </View>
          <Text style={styles.quickActionText}>Hot Deals</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('BestSellers')}>
          <View style={[styles.quickActionIcon, { backgroundColor: '#dbeafe' }]}>
            <Icon name="trending-up" size={20} color="#3b82f6" />
          </View>
          <Text style={styles.quickActionText}>Best Sellers</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('NewArrivals')}>
          <View style={[styles.quickActionIcon, { backgroundColor: '#d1fae5' }]}>
            <Icon name="star" size={20} color="#10b981" />
          </View>
          <Text style={styles.quickActionText}>Top Rated</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('Wishlist')}>
          <View style={[styles.quickActionIcon, { backgroundColor: '#fce7f3' }]}>
            <Icon name="heart" size={20} color="#ec4899" />
          </View>
          <Text style={styles.quickActionText}>Wishlist</Text>
        </TouchableOpacity>
      </View>

      {/* New Arrivals */}
      {featuredProducts.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>New Arrivals</Text>
            <TouchableOpacity onPress={() => navigation.navigate('NewArrivals')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={featuredProducts}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            renderItem={({ item }) => (
              <View style={{ width: PRODUCT_CARD_WIDTH, marginRight: 12 }}>
                <ProductCard product={item} onPress={() => navigateToProduct(item)} />
              </View>
            )}
          />
        </View>
      )}

      {/* Best Sellers */}
      {bestSellers.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Best Sellers</Text>
            <TouchableOpacity onPress={() => navigation.navigate('BestSellers')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.productsGrid}>
            {bestSellers.slice(0, 4).map((product) => (
              <View key={product.id} style={styles.gridItem}>
                <ProductCard product={product} onPress={() => navigateToProduct(product)} />
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Start Selling CTA */}
      <View style={styles.sellerCta}>
        <Text style={styles.sellerCtaTitle}>Start Selling on Channah</Text>
        <Text style={styles.sellerCtaSubtitle}>
          Reach millions of buyers worldwide. Get verified and start growing your business today.
        </Text>
        <View style={styles.sellerCtaButtons}>
          <TouchableOpacity style={styles.sellerCtaPrimaryBtn} onPress={() => navigation.navigate('About')}>
            <Text style={styles.sellerCtaPrimaryBtnText}>Become a Supplier</Text>
            <Icon name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.sellerCtaSecondaryBtn} onPress={() => navigation.navigate('Products')}>
            <Text style={styles.sellerCtaSecondaryBtnText}>Browse Suppliers</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Newsletter */}
      <LinearGradient
        colors={['#1e3a5f', '#0f172a']}
        style={styles.newsletter}
      >
        <Text style={styles.newsletterTitle}>Join the Channah Community</Text>
        <Text style={styles.newsletterSubtitle}>
          Subscribe for exclusive deals, new arrivals, and 10% off your first order!
        </Text>
        <View style={styles.newsletterInputRow}>
          <TextInput
            style={styles.newsletterInput}
            placeholder="Enter your email address"
            placeholderTextColor="#9ca3af"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.newsletterBtn}>
            <Text style={styles.newsletterBtnText}>Subscribe</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerBrand}>
          <Text style={styles.footerLogo}>Channah</Text>
          <Text style={styles.footerBrandSub}>GLOBAL MARKETPLACE</Text>
          <Text style={styles.footerDescription}>
            Your premium global marketplace. Discover quality products from trusted sellers worldwide.
          </Text>
        </View>

        <View style={styles.footerLinksRow}>
          <View style={styles.footerLinkSection}>
            <Text style={styles.footerLinkHeader}>Shop</Text>
            <TouchableOpacity onPress={() => navigation.navigate('NewArrivals')}>
              <Text style={styles.footerLink}>New Arrivals</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('BestSellers')}>
              <Text style={styles.footerLink}>Best Sellers</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Deals')}>
              <Text style={styles.footerLink}>Deals & Offers</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('CategoryBrowse')}>
              <Text style={styles.footerLink}>All Categories</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.footerLinkSection}>
            <Text style={styles.footerLinkHeader}>Help</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Help')}>
              <Text style={styles.footerLink}>Help Center</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Contact')}>
              <Text style={styles.footerLink}>Contact Us</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('About')}>
              <Text style={styles.footerLink}>About Us</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.footerLinkSection}>
            <Text style={styles.footerLinkHeader}>Legal</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Privacy')}>
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Terms')}>
              <Text style={styles.footerLink}>Terms of Service</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footerBottom}>
          <Text style={styles.footerCopyright}>© 2026 Channah Global Ltd. All rights reserved.</Text>
        </View>
      </View>
    </ScrollView>

    {/* AI Assistant Floating Button */}
    <AIAssistantButton onPress={() => navigation.navigate('Search')} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },

  // AI Button
  aiButtonContainer: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    zIndex: 100,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  aiButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
  },
  aiButtonText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: -2,
  },

  // Hero Carousel
  heroCarouselContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#fff',
  },
  heroSlide: {
    width: SCREEN_WIDTH - 32,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
  },
  heroSlideIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  heroSlideTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  heroSlideSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  carouselDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    gap: 6,
  },
  carouselDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#d1d5db',
  },
  carouselDotActive: {
    width: 20,
    backgroundColor: '#3b82f6',
    borderRadius: 3,
  },

  // Header
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: -2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerIcon: {
    padding: 6,
  },

  // Hero Section
  heroSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    marginBottom: 12,
  },
  heroBadgeText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
  },
  heroTitleAccent: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#3b82f6',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  heroSearchContainer: {
    width: '100%',
    marginBottom: 16,
  },
  heroSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    paddingLeft: 12,
    overflow: 'hidden',
  },
  heroSearchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#1f2937',
  },
  heroSearchButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 4,
  },
  heroSearchButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  heroButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  heroPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  heroPrimaryBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  heroSecondaryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  heroSecondaryBtnText: {
    color: '#3b82f6',
    fontWeight: '600',
    fontSize: 14,
  },

  // Features Bar
  featuresBar: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  featuresScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 8,
    minWidth: 160,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
  },
  featureDesc: {
    fontSize: 10,
    color: '#6b7280',
  },

  // Sections
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    paddingVertical: 16,
  },
  sectionGray: {
    backgroundColor: '#fafafa',
    marginTop: 12,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  seeAll: {
    fontSize: 13,
    color: '#3b82f6',
    fontWeight: '600',
  },

  // Category Grid
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 12,
  },
  categoryGridItem: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  categoryCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  categoryImage: {
    width: 48,
    height: 48,
  },
  categoryName: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },

  // Supplier Cards
  supplierCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    marginRight: 12,
    width: 150,
    alignItems: 'center',
  },
  supplierAvatar: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  supplierAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  supplierVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 6,
  },
  supplierVerifiedText: {
    fontSize: 9,
    color: '#3b82f6',
    fontWeight: '600',
  },
  supplierName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  supplierRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  supplierRatingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },

  // Flash Sale
  flashSaleBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  flashSaleContent: {
    padding: 20,
  },
  flashSaleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: 10,
  },
  flashSaleBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  flashSaleTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  flashSaleSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
  },
  flashSaleTimerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  flashSaleTimerLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  flashSaleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 12,
  },
  flashSaleButtonText: {
    color: '#3b82f6',
    fontWeight: 'bold',
    fontSize: 14,
  },

  // Countdown
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countdownBox: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  countdownNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  countdownLabel: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  countdownSep: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 10,
  },
  emptyDescription: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },

  // RFQ Banner
  rfqBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  rfqBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginBottom: 10,
  },
  rfqBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  rfqTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  rfqSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  rfqButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  rfqPrimaryBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  rfqPrimaryBtnText: {
    color: '#3b82f6',
    fontWeight: '600',
    fontSize: 13,
  },
  rfqSecondaryBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  rfqSecondaryBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginTop: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionText: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '500',
    color: '#374151',
  },

  // Products Grid
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  gridItem: {
    width: PRODUCT_CARD_WIDTH,
  },

  // Product Card
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f3f4f6',
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
    fontSize: 13,
    fontWeight: '500',
    color: '#1f2937',
    lineHeight: 18,
  },
  productVendor: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  comparePrice: {
    fontSize: 12,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 3,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  reviewCount: {
    fontSize: 11,
    color: '#9ca3af',
  },

  // Seller CTA
  sellerCta: {
    backgroundColor: '#fff',
    marginTop: 12,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  sellerCtaTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  sellerCtaSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  sellerCtaButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  sellerCtaPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  sellerCtaPrimaryBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  sellerCtaSecondaryBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sellerCtaSecondaryBtnText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 13,
  },

  // Newsletter
  newsletter: {
    padding: 20,
    marginTop: 12,
    alignItems: 'center',
  },
  newsletterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 6,
  },
  newsletterSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 18,
  },
  newsletterInputRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 8,
  },
  newsletterInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  newsletterBtn: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  newsletterBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },

  // Footer
  footer: {
    backgroundColor: '#1a202c',
    padding: 20,
  },
  footerBrand: {
    marginBottom: 20,
  },
  footerLogo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  footerBrandSub: {
    fontSize: 9,
    color: '#10b981',
    fontWeight: '600',
    letterSpacing: 2,
  },
  footerDescription: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 8,
    lineHeight: 18,
  },
  footerLinksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  footerLinkSection: {
    flex: 1,
  },
  footerLinkHeader: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  footerLink: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
  },
  footerBottom: {
    borderTopWidth: 1,
    borderTopColor: '#374151',
    paddingTop: 14,
  },
  footerCopyright: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
  },
});
