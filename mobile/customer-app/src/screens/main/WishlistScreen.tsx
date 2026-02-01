import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { wishlistAPI, cartAPI } from '../../../../shared/api/customer-api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function WishlistScreen({ navigation }: any) {
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [addingToCartId, setAddingToCartId] = useState<string | null>(null);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await wishlistAPI.get();
      const items = Array.isArray(response) ? response : response.items || [];
      setWishlist(items);
    } catch (error: any) {
      console.error('Failed to load wishlist:', error);
      Alert.alert('Error', error.message || 'Failed to load wishlist');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRemoveFromWishlist = async (productId: string) => {
    try {
      setRemovingId(productId);
      await wishlistAPI.remove(productId);
      await loadWishlist();
      Alert.alert('Success', 'Removed from wishlist');
    } catch (error: any) {
      console.error('Failed to remove from wishlist:', error);
      Alert.alert('Error', error.message || 'Failed to remove from wishlist');
    } finally {
      setRemovingId(null);
    }
  };

  const handleAddToCart = async (product: any) => {
    if (!product || !product.id) return;

    try {
      setAddingToCartId(product.id);
      await cartAPI.addItem(product.id, 1);
      Alert.alert('Success', 'Added to cart', [
        { text: 'Continue', style: 'cancel' },
        { text: 'View Cart', onPress: () => navigation.navigate('Cart') },
      ]);
    } catch (error: any) {
      console.error('Failed to add to cart:', error);
      Alert.alert('Error', error.message || 'Failed to add to cart');
    } finally {
      setAddingToCartId(null);
    }
  };

  const renderWishlistItem = ({ item }: any) => {
    const product = item.product || item;
    const isRemoving = removingId === product.id;
    const isAddingToCart = addingToCartId === product.id;

    return (
      <View style={styles.productCard}>
        <TouchableOpacity
          style={styles.productImageContainer}
          onPress={() => navigation.navigate('ProductDetail', { slug: product.slug })}
        >
          <Image
            source={{ uri: product.images?.[0]?.image || 'https://via.placeholder.com/150' }}
            style={styles.productImage}
            resizeMode="cover"
          />

          {/* Remove Button */}
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveFromWishlist(product.id)}
            disabled={isRemoving}
          >
            {isRemoving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Icon name="close" size={16} color="#fff" />
            )}
          </TouchableOpacity>

          {/* Discount Badge */}
          {product.compare_at_price && product.compare_at_price > product.price && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                -{Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)}%
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {product.name}
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>${product.price}</Text>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <Text style={styles.comparePrice}>${product.compare_at_price}</Text>
            )}
          </View>

          <View style={styles.ratingRow}>
            <Icon name="star" size={14} color="#f59e0b" />
            <Text style={styles.rating}>
              {product.average_rating?.toFixed(1) || '0.0'} ({product.review_count || 0})
            </Text>
          </View>

          {/* Stock Status */}
          {product.stock !== undefined && (
            <View style={styles.stockRow}>
              <Icon
                name={product.stock > 0 ? 'checkmark-circle' : 'close-circle'}
                size={12}
                color={product.stock > 0 ? '#10b981' : '#ef4444'}
              />
              <Text style={[
                styles.stockText,
                { color: product.stock > 0 ? '#10b981' : '#ef4444' }
              ]}>
                {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
              </Text>
            </View>
          )}

          {/* Add to Cart Button */}
          <TouchableOpacity
            style={[
              styles.addToCartButton,
              (isAddingToCart || product.stock === 0) && styles.buttonDisabled,
            ]}
            onPress={() => handleAddToCart(product)}
            disabled={isAddingToCart || product.stock === 0}
          >
            {isAddingToCart ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon name="cart-outline" size={14} color="#fff" />
                <Text style={styles.addToCartText}>
                  {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="heart-outline" size={64} color="#9ca3af" />
      <Text style={styles.emptyText}>Your wishlist is empty</Text>
      <Text style={styles.emptySubtext}>
        Save your favorite items for later
      </Text>
      <TouchableOpacity
        style={styles.shopButton}
        onPress={() => navigation.navigate('Products')}
      >
        <Text style={styles.shopButtonText}>Browse Products</Text>
      </TouchableOpacity>
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Wishlist</Text>
        <Text style={styles.headerSubtitle}>{wishlist.length} item(s)</Text>
      </View>

      {/* Wishlist Grid */}
      <FlatList
        data={wishlist}
        renderItem={renderWishlistItem}
        keyExtractor={(item) => {
          const product = item.product || item;
          return product.id?.toString() || Math.random().toString();
        }}
        numColumns={2}
        columnWrapperStyle={wishlist.length > 0 ? styles.row : undefined}
        contentContainerStyle={wishlist.length === 0 ? styles.emptyList : styles.listContent}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadWishlist(true)}
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
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  listContent: {
    padding: 8,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  emptyList: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  productImageContainer: {
    position: 'relative',
    width: '100%',
    height: CARD_WIDTH,
    backgroundColor: '#f3f4f6',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#ef4444',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  discountText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
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
    marginBottom: 6,
  },
  rating: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stockText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  addToCartButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 6,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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
});
