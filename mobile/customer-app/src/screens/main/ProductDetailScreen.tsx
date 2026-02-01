import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { productsAPI, cartAPI, wishlistAPI, reviewsAPI } from '../../../../shared/api/customer-api';
import { useAuthStore } from '../../store/authStore';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen({ route, navigation }: any) {
  const { slug } = route.params;
  const { user } = useAuthStore();
  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  useEffect(() => {
    loadProductDetail();
  }, [slug]);

  const loadProductDetail = async () => {
    try {
      setLoading(true);
      const productData = await productsAPI.getBySlug(slug);
      setProduct(productData);

      // Auto-select first variant if available
      if (productData.variants?.length > 0) {
        const firstVariant = productData.variants[0];
        setSelectedVariant(firstVariant);
        if (firstVariant.options) {
          setSelectedOptions(firstVariant.options);
        }
      }

      if (productData.id) {
        try {
          const reviewsData = await reviewsAPI.getProductReviews(productData.id);
          setReviews(Array.isArray(reviewsData) ? reviewsData : reviewsData?.results || []);
        } catch {
          setReviews([]);
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load product details', [
        { text: 'Go Back', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getVariantGroups = () => {
    if (!product?.variants?.length) return [];
    const groups: Record<string, Set<string>> = {};
    product.variants.forEach((v: any) => {
      if (v.options) {
        Object.entries(v.options).forEach(([key, value]) => {
          if (!groups[key]) groups[key] = new Set();
          groups[key].add(value as string);
        });
      }
    });
    return Object.entries(groups).map(([name, values]) => ({
      name,
      values: Array.from(values),
    }));
  };

  const selectOption = (optionName: string, value: string) => {
    const newOptions = { ...selectedOptions, [optionName]: value };
    setSelectedOptions(newOptions);

    // Find matching variant
    const match = product.variants?.find((v: any) => {
      if (!v.options) return false;
      return Object.entries(newOptions).every(([k, val]) => v.options[k] === val);
    });
    if (match) setSelectedVariant(match);
  };

  const getCurrentPrice = () => {
    if (selectedVariant?.price) return selectedVariant.price;
    return product?.price;
  };

  const getCurrentStock = () => {
    if (selectedVariant?.stock !== undefined) return selectedVariant.stock;
    return product?.stock;
  };

  const handleAddToCart = async () => {
    if (!product) return;
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to add items to your cart.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }
    try {
      setAddingToCart(true);
      await cartAPI.addItem(product.id, quantity, selectedVariant?.id);
      Alert.alert('Success', `Added ${quantity} item(s) to cart`, [
        { text: 'Continue Shopping', style: 'cancel' },
        { text: 'View Cart', onPress: () => navigation.navigate('Cart') },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleAddToWishlist = async () => {
    if (!product) return;
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to manage your wishlist.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }
    try {
      setAddingToWishlist(true);
      if (isInWishlist) {
        await wishlistAPI.remove(product.id);
        setIsInWishlist(false);
      } else {
        await wishlistAPI.add(product.id);
        setIsInWishlist(true);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update wishlist');
    } finally {
      setAddingToWishlist(false);
    }
  };

  const incrementQuantity = () => {
    const stock = getCurrentStock();
    if (stock && quantity >= stock) {
      Alert.alert('Error', 'Cannot exceed available stock');
      return;
    }
    setQuantity(prev => prev + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) setQuantity(prev => prev - 1);
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="alert-circle-outline" size={64} color="#9ca3af" />
        <Text style={styles.emptyText}>Product not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = product.images || [];
  const currentImage = images[selectedImageIndex]?.url || product.primary_image || 'https://via.placeholder.com/400';
  const price = Number(getCurrentPrice() || 0);
  const stock = getCurrentStock();
  const compareAtPrice = Number(product.compare_at_price || 0);
  const hasDiscount = compareAtPrice > 0 && compareAtPrice > price;
  const discountPercentage = hasDiscount
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;
  const variantGroups = getVariantGroups();

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: currentImage }} style={styles.mainImage} resizeMode="cover" />
          {hasDiscount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{discountPercentage}%</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.wishlistButton}
            onPress={handleAddToWishlist}
            disabled={addingToWishlist}
          >
            <Icon
              name={isInWishlist ? 'heart' : 'heart-outline'}
              size={24}
              color={isInWishlist ? '#ef4444' : '#fff'}
            />
          </TouchableOpacity>
          {images.length > 1 && (
            <View style={styles.imageIndicators}>
              {images.map((_: any, index: number) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.indicator, selectedImageIndex === index && styles.activeIndicator]}
                  onPress={() => setSelectedImageIndex(index)}
                />
              ))}
            </View>
          )}
        </View>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <FlatList
            horizontal
            data={images}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8 }}
            keyExtractor={(_, i) => `thumb-${i}`}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[styles.thumbnail, selectedImageIndex === index && styles.thumbnailActive]}
                onPress={() => setSelectedImageIndex(index)}
              >
                <Image source={{ uri: item.url }} style={styles.thumbnailImage} />
              </TouchableOpacity>
            )}
          />
        )}

        <View style={styles.infoContainer}>
          <Text style={styles.productName}>{product.name}</Text>

          {/* Price */}
          <View style={styles.priceContainer}>
            <Text style={styles.price}>${price.toFixed(2)}</Text>
            {hasDiscount && <Text style={styles.comparePrice}>${compareAtPrice.toFixed(2)}</Text>}
          </View>

          {/* Rating */}
          <View style={styles.ratingContainer}>
            <View style={styles.ratingStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Icon
                  key={star}
                  name={star <= Math.round(product.average_rating || 0) ? 'star' : 'star-outline'}
                  size={16}
                  color="#f59e0b"
                />
              ))}
            </View>
            <Text style={styles.ratingText}>
              {Number(product.average_rating || 0).toFixed(1)} ({product.review_count || 0} reviews)
            </Text>
          </View>

          {/* Stock */}
          {stock !== undefined && (
            <View style={styles.stockContainer}>
              <Icon
                name={stock > 0 ? 'checkmark-circle' : 'close-circle'}
                size={18}
                color={stock > 0 ? '#10b981' : '#ef4444'}
              />
              <Text style={[styles.stockText, { color: stock > 0 ? '#10b981' : '#ef4444' }]}>
                {stock > 0 ? `In Stock (${stock} available)` : 'Out of Stock'}
              </Text>
            </View>
          )}

          {/* Shipping Info */}
          {product.shipping_cost !== undefined && (
            <View style={styles.shippingRow}>
              <Icon name="car-outline" size={18} color="#6b7280" />
              <Text style={styles.shippingText}>
                {product.shipping_cost > 0 ? `Shipping: $${product.shipping_cost}` : 'Free Shipping'}
              </Text>
            </View>
          )}

          {/* Variant Selection */}
          {variantGroups.length > 0 && (
            <View style={styles.variantsSection}>
              {variantGroups.map((group) => (
                <View key={group.name} style={styles.variantGroup}>
                  <Text style={styles.variantLabel}>
                    {group.name}: <Text style={styles.variantSelected}>{selectedOptions[group.name] || 'Select'}</Text>
                  </Text>
                  <View style={styles.variantOptions}>
                    {group.values.map((value) => {
                      const isSelected = selectedOptions[group.name] === value;
                      const isColor = group.name.toLowerCase() === 'color';
                      return (
                        <TouchableOpacity
                          key={value}
                          style={[
                            isColor ? styles.colorSwatch : styles.variantChip,
                            isSelected && (isColor ? styles.colorSwatchSelected : styles.variantChipSelected),
                            isColor && { backgroundColor: value.toLowerCase() },
                          ]}
                          onPress={() => selectOption(group.name, value)}
                        >
                          {!isColor && (
                            <Text style={[styles.variantChipText, isSelected && styles.variantChipTextSelected]}>
                              {value}
                            </Text>
                          )}
                          {isColor && isSelected && (
                            <Icon name="checkmark" size={14} color="#fff" />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Bulk Pricing */}
          {product.bulk_pricing && product.bulk_pricing.length > 0 && (
            <View style={styles.bulkSection}>
              <Text style={styles.sectionTitle}>Bulk Pricing</Text>
              <View style={styles.bulkTable}>
                <View style={styles.bulkHeaderRow}>
                  <Text style={styles.bulkHeaderCell}>Quantity</Text>
                  <Text style={styles.bulkHeaderCell}>Price/Unit</Text>
                  <Text style={styles.bulkHeaderCell}>Savings</Text>
                </View>
                {product.bulk_pricing.map((tier: any, i: number) => {
                  const tierPrice = Number(tier.price || 0);
                  const basePrice = Number(product.price || 0);
                  const savings = basePrice > 0 ? Math.round(((basePrice - tierPrice) / basePrice) * 100) : 0;
                  return (
                    <View key={i} style={styles.bulkRow}>
                      <Text style={styles.bulkCell}>
                        {tier.min_qty}{tier.max_qty ? `-${tier.max_qty}` : '+'}
                      </Text>
                      <Text style={styles.bulkCellPrice}>${tierPrice.toFixed(2)}</Text>
                      <Text style={styles.bulkCellSavings}>{savings}% off</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* MOQ */}
          {product.moq && product.moq > 1 && (
            <View style={styles.moqRow}>
              <Icon name="information-circle-outline" size={16} color="#f59e0b" />
              <Text style={styles.moqText}>Minimum Order: {product.moq} units</Text>
            </View>
          )}

          {/* Quantity */}
          <View style={styles.quantitySection}>
            <Text style={styles.sectionTitle}>Quantity</Text>
            <View style={styles.quantitySelector}>
              <TouchableOpacity style={styles.quantityButton} onPress={decrementQuantity} disabled={quantity <= 1}>
                <Icon name="remove" size={20} color="#6b7280" />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={incrementQuantity}
                disabled={!!stock && quantity >= stock}
              >
                <Icon name="add" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Description */}
          {!!product.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>
          )}

          {/* Vendor */}
          {product.vendor && (
            <View style={styles.vendorSection}>
              <Text style={styles.sectionTitle}>Sold By</Text>
              <TouchableOpacity
                style={styles.vendorCard}
                onPress={() => navigation.navigate('VendorProfile', {
                  vendorId: product.vendor.id,
                  vendorName: product.vendor.business_name,
                })}
              >
                <Icon name="storefront-outline" size={20} color="#3b82f6" />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.vendorName}>{product.vendor.business_name || 'Vendor'}</Text>
                  {Number(product.vendor.rating || 0) > 0 && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                      <Icon name="star" size={12} color="#f59e0b" />
                      <Text style={{ fontSize: 12, color: '#6b7280', marginLeft: 2 }}>
                        {Number(product.vendor.rating).toFixed(1)}
                      </Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.messageVendorBtn}
                  onPress={() => navigation.navigate('Chat')}
                >
                  <Icon name="chatbubble-outline" size={16} color="#3b82f6" />
                  <Text style={styles.messageVendorText}>Chat</Text>
                </TouchableOpacity>
                <Icon name="chevron-forward" size={16} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          )}

          {/* Reviews */}
          <View style={styles.reviewsSection}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={styles.sectionTitle}>Customer Reviews</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('WriteReview', { productId: product.id, productName: product.name })}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#3b82f6' }}>Write Review</Text>
              </TouchableOpacity>
            </View>
            {reviews.length > 0 ? (
              <>
                {reviews.slice(0, 3).map((review) => (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewStars}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Icon
                            key={star}
                            name={star <= review.rating ? 'star' : 'star-outline'}
                            size={14}
                            color="#f59e0b"
                          />
                        ))}
                      </View>
                      <Text style={styles.reviewDate}>
                        {new Date(review.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={styles.reviewerName}>{review.user?.full_name || 'Anonymous'}</Text>
                    {review.comment && (
                      <Text style={styles.reviewComment} numberOfLines={3}>{review.comment}</Text>
                    )}
                  </View>
                ))}
                {reviews.length > 3 && (
                  <TouchableOpacity style={styles.viewAllReviews}>
                    <Text style={styles.viewAllText}>View All {reviews.length} Reviews</Text>
                    <Icon name="chevron-forward" size={16} color="#3b82f6" />
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <Text style={{ fontSize: 14, color: '#9ca3af', textAlign: 'center', paddingVertical: 16 }}>
                No reviews yet. Be the first to review!
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerPrice}>
          <Text style={styles.footerPriceLabel}>Total</Text>
          <Text style={styles.footerPriceValue}>${(price * quantity).toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.addToCartButton, (addingToCart || !stock || stock === 0) && styles.buttonDisabled]}
          onPress={handleAddToCart}
          disabled={addingToCart || !stock || stock === 0}
        >
          {addingToCart ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Icon name="cart" size={20} color="#fff" />
              <Text style={styles.addToCartText}>
                {stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#6b7280', marginTop: 16, marginBottom: 24 },
  backButton: { backgroundColor: '#3b82f6', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24 },
  backButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  imageContainer: { position: 'relative', width, height: width * 0.85, backgroundColor: '#f3f4f6' },
  mainImage: { width: '100%', height: '100%' },
  discountBadge: { position: 'absolute', top: 16, left: 16, backgroundColor: '#ef4444', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  discountText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  wishlistButton: { position: 'absolute', top: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 20, width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  imageIndicators: { position: 'absolute', bottom: 16, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  indicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)', marginHorizontal: 4 },
  activeIndicator: { backgroundColor: '#fff', width: 24 },
  thumbnail: { width: 56, height: 56, borderRadius: 6, marginRight: 8, borderWidth: 2, borderColor: 'transparent', overflow: 'hidden' },
  thumbnailActive: { borderColor: '#3b82f6' },
  thumbnailImage: { width: '100%', height: '100%' },
  infoContainer: { padding: 16 },
  productName: { fontSize: 22, fontWeight: 'bold', color: '#1f2937', marginBottom: 12 },
  priceContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  price: { fontSize: 28, fontWeight: 'bold', color: '#3b82f6', marginRight: 12 },
  comparePrice: { fontSize: 20, color: '#9ca3af', textDecorationLine: 'line-through' },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  ratingStars: { flexDirection: 'row', marginRight: 8 },
  ratingText: { fontSize: 14, color: '#6b7280' },
  stockContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  stockText: { fontSize: 14, fontWeight: '600', marginLeft: 6 },
  shippingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  shippingText: { fontSize: 14, color: '#6b7280', marginLeft: 6 },
  // Variants
  variantsSection: { marginBottom: 20 },
  variantGroup: { marginBottom: 12 },
  variantLabel: { fontSize: 14, fontWeight: '600', color: '#1f2937', marginBottom: 8 },
  variantSelected: { color: '#3b82f6' },
  variantOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  variantChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff' },
  variantChipSelected: { borderColor: '#3b82f6', backgroundColor: '#eff6ff' },
  variantChipText: { fontSize: 14, color: '#4b5563' },
  variantChipTextSelected: { color: '#3b82f6', fontWeight: '600' },
  colorSwatch: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' },
  colorSwatchSelected: { borderColor: '#3b82f6', borderWidth: 3 },
  // Bulk pricing
  bulkSection: { marginBottom: 20 },
  bulkTable: { backgroundColor: '#f9fafb', borderRadius: 8, overflow: 'hidden' },
  bulkHeaderRow: { flexDirection: 'row', backgroundColor: '#e5e7eb', paddingVertical: 8, paddingHorizontal: 12 },
  bulkHeaderCell: { flex: 1, fontSize: 12, fontWeight: '600', color: '#6b7280', textAlign: 'center' },
  bulkRow: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  bulkCell: { flex: 1, fontSize: 13, color: '#4b5563', textAlign: 'center' },
  bulkCellPrice: { flex: 1, fontSize: 13, fontWeight: '600', color: '#1f2937', textAlign: 'center' },
  bulkCellSavings: { flex: 1, fontSize: 13, fontWeight: '600', color: '#10b981', textAlign: 'center' },
  moqRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fffbeb', borderRadius: 6, padding: 10, marginBottom: 16 },
  moqText: { fontSize: 13, color: '#92400e', marginLeft: 6 },
  quantitySection: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 12 },
  quantitySelector: { flexDirection: 'row', alignItems: 'center' },
  quantityButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },
  quantityText: { fontSize: 18, fontWeight: '600', color: '#1f2937', marginHorizontal: 24, minWidth: 40, textAlign: 'center' },
  descriptionSection: { marginBottom: 20 },
  description: { fontSize: 14, color: '#6b7280', lineHeight: 22 },
  vendorSection: { marginBottom: 20 },
  vendorCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 8, padding: 12 },
  vendorName: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  messageVendorBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', borderRadius: 6, paddingVertical: 4, paddingHorizontal: 8, marginRight: 8 },
  messageVendorText: { fontSize: 12, color: '#3b82f6', fontWeight: '500', marginLeft: 4 },
  reviewsSection: { marginBottom: 24 },
  reviewCard: { backgroundColor: '#f9fafb', borderRadius: 8, padding: 12, marginBottom: 12 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  reviewStars: { flexDirection: 'row' },
  reviewDate: { fontSize: 12, color: '#9ca3af' },
  reviewerName: { fontSize: 14, fontWeight: '600', color: '#1f2937', marginBottom: 4 },
  reviewComment: { fontSize: 14, color: '#6b7280', lineHeight: 20 },
  viewAllReviews: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12 },
  viewAllText: { fontSize: 14, fontWeight: '600', color: '#3b82f6', marginRight: 4 },
  footer: { backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb', flexDirection: 'row', alignItems: 'center' },
  footerPrice: { marginRight: 16 },
  footerPriceLabel: { fontSize: 12, color: '#6b7280' },
  footerPriceValue: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  addToCartButton: { flex: 1, backgroundColor: '#3b82f6', borderRadius: 8, padding: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  buttonDisabled: { opacity: 0.5 },
  addToCartText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
});
