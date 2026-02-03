import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Modal,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { reviewsAPI } from '../../../../shared/api/customer-api';
import { ReviewCardSkeleton } from '../../components/LoadingSkeleton';
import { EmptyState } from '../../components/EmptyState';
import { ErrorView } from '../../components/ErrorView';

export default function ReviewsScreen({ route, navigation }: any) {
  const { productId, productName } = route.params;
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterRating, setFilterRating] = useState<number>(0);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'rating' | 'helpful'>('recent');

  useEffect(() => {
    loadReviews();
  }, [productId]);

  const loadReviews = async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await reviewsAPI.getProductReviews(productId);
      setReviews(Array.isArray(data) ? data : data?.results || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReviews();
    setRefreshing(false);
  };

  const getFilteredAndSortedReviews = () => {
    let filtered = [...reviews];

    // Apply rating filter
    if (filterRating > 0) {
      filtered = filtered.filter((r) => r.rating === filterRating);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'rating':
          return b.rating - a.rating;
        case 'helpful':
          return (b.helpful_count || 0) - (a.helpful_count || 0);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      distribution[r.rating as keyof typeof distribution]++;
    });
    return distribution;
  };

  const getAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const renderReviewItem = ({ item }: { item: any }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewStars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Icon
              key={star}
              name={star <= item.rating ? 'star' : 'star-outline'}
              size={16}
              color="#f59e0b"
            />
          ))}
        </View>
        <Text style={styles.reviewDate}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>

      <Text style={styles.reviewerName}>
        {item.user?.full_name || 'Anonymous'}
      </Text>

      {item.title && (
        <Text style={styles.reviewTitle}>{item.title}</Text>
      )}

      {item.comment && (
        <Text style={styles.reviewComment}>{item.comment}</Text>
      )}

      {item.images && item.images.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reviewImages}>
          {item.images.map((img: string, index: number) => (
            <Image
              key={index}
              source={{ uri: img }}
              style={styles.reviewImage}
            />
          ))}
        </ScrollView>
      )}

      {item.vendor_response && (
        <View style={styles.vendorResponse}>
          <View style={styles.vendorResponseHeader}>
            <Icon name="storefront" size={14} color="#3b82f6" />
            <Text style={styles.vendorResponseTitle}>Vendor Response</Text>
          </View>
          <Text style={styles.vendorResponseText}>{item.vendor_response}</Text>
        </View>
      )}

      <View style={styles.reviewFooter}>
        <TouchableOpacity style={styles.helpfulButton}>
          <Icon name="thumbs-up-outline" size={16} color="#6b7280" />
          <Text style={styles.helpfulText}>
            Helpful ({item.helpful_count || 0})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRatingBar = (rating: number, count: number) => {
    const total = reviews.length;
    const percentage = total > 0 ? (count / total) * 100 : 0;

    return (
      <TouchableOpacity
        key={rating}
        style={styles.ratingBar}
        onPress={() => {
          setFilterRating(filterRating === rating ? 0 : rating);
          setShowFilterModal(false);
        }}
      >
        <View style={styles.ratingBarLeft}>
          <Text style={styles.ratingBarLabel}>{rating}</Text>
          <Icon name="star" size={12} color="#f59e0b" />
        </View>
        <View style={styles.ratingBarTrack}>
          <View
            style={[
              styles.ratingBarFill,
              { width: `${percentage}%` },
              filterRating === rating && styles.ratingBarFillActive,
            ]}
          />
        </View>
        <Text style={styles.ratingBarCount}>{count}</Text>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => {
    const distribution = getRatingDistribution();
    const avgRating = getAverageRating();

    return (
      <View style={styles.headerSection}>
        <Text style={styles.productName} numberOfLines={2}>
          {productName}
        </Text>

        <View style={styles.ratingSummary}>
          <View style={styles.averageRating}>
            <Text style={styles.averageRatingNumber}>{avgRating}</Text>
            <View style={styles.averageRatingStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Icon
                  key={star}
                  name={star <= Math.round(Number(avgRating)) ? 'star' : 'star-outline'}
                  size={20}
                  color="#f59e0b"
                />
              ))}
            </View>
            <Text style={styles.totalReviews}>
              Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
            </Text>
          </View>

          <View style={styles.ratingBars}>
            {[5, 4, 3, 2, 1].map((rating) =>
              renderRatingBar(rating, distribution[rating as keyof typeof distribution])
            )}
          </View>
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Icon name="filter-outline" size={18} color="#3b82f6" />
            <Text style={styles.filterButtonText}>
              {filterRating > 0 ? `${filterRating} Stars` : 'All Ratings'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => {
              const options = ['recent', 'rating', 'helpful'] as const;
              const currentIndex = options.indexOf(sortBy);
              setSortBy(options[(currentIndex + 1) % options.length]);
            }}
          >
            <Icon name="swap-vertical-outline" size={18} color="#3b82f6" />
            <Text style={styles.sortButtonText}>
              {sortBy === 'recent' ? 'Most Recent' : sortBy === 'rating' ? 'Highest Rated' : 'Most Helpful'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <FlatList
          data={[1, 2, 3, 4, 5]}
          renderItem={() => <ReviewCardSkeleton />}
          keyExtractor={(item) => `skeleton-${item}`}
          contentContainerStyle={styles.listContent}
        />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ErrorView message={error} onRetry={loadReviews} />
      </View>
    );
  }

  const filteredReviews = getFilteredAndSortedReviews();

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredReviews}
        renderItem={renderReviewItem}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <EmptyState
            icon="star-outline"
            title="No reviews yet"
            message={
              filterRating > 0
                ? `No ${filterRating}-star reviews found`
                : 'Be the first to review this product!'
            }
            actionLabel={filterRating > 0 ? 'Clear Filter' : 'Write Review'}
            onAction={() => {
              if (filterRating > 0) {
                setFilterRating(0);
              } else {
                navigation.navigate('WriteReview', { productId, productName });
              }
            }}
          />
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />

      {/* Filter Modal */}
      <Modal visible={showFilterModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter by Rating</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Icon name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.ratingBars}>
              {[5, 4, 3, 2, 1].map((rating) => {
                const distribution = getRatingDistribution();
                return renderRatingBar(rating, distribution[rating as keyof typeof distribution]);
              })}
            </View>

            <TouchableOpacity
              style={styles.clearFilterButton}
              onPress={() => {
                setFilterRating(0);
                setShowFilterModal(false);
              }}
            >
              <Text style={styles.clearFilterText}>Clear Filter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Floating Write Review Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('WriteReview', { productId, productName })}
      >
        <Icon name="create-outline" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  listContent: { paddingBottom: 80 },
  headerSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  ratingSummary: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 20,
  },
  averageRating: {
    alignItems: 'center',
  },
  averageRatingNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  averageRatingStars: {
    flexDirection: 'row',
    marginVertical: 8,
  },
  totalReviews: {
    fontSize: 12,
    color: '#6b7280',
  },
  ratingBars: {
    flex: 1,
    justifyContent: 'center',
  },
  ratingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  ratingBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 30,
  },
  ratingBarLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginRight: 2,
  },
  ratingBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    backgroundColor: '#f59e0b',
  },
  ratingBarFillActive: {
    backgroundColor: '#3b82f6',
  },
  ratingBarCount: {
    fontSize: 12,
    color: '#6b7280',
    width: 30,
    textAlign: 'right',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    paddingVertical: 10,
    gap: 6,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  sortButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    paddingVertical: 10,
    gap: 6,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  reviewCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewStars: {
    flexDirection: 'row',
  },
  reviewDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 6,
  },
  reviewTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 6,
  },
  reviewComment: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  reviewImages: {
    marginBottom: 12,
  },
  reviewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
  },
  vendorResponse: {
    backgroundColor: '#f9fafb',
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
    padding: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  vendorResponseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  vendorResponseTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3b82f6',
    marginLeft: 6,
  },
  vendorResponseText: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  reviewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  helpfulText: {
    fontSize: 13,
    color: '#6b7280',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
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
    maxHeight: '60%',
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
  clearFilterButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  clearFilterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
});
