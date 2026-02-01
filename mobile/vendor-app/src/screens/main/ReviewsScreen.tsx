import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { reviewsAPI } from '../../../../../shared/api/vendor-api';

interface Review {
  id: string;
  rating: number;
  title?: string;
  comment?: string;
  user?: { full_name: string };
  product?: { name: string };
  created_at: string;
  response?: string;
}

export default function ReviewsScreen({ navigation }: any) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [respondingTo, setRespondingTo] = useState<Review | null>(null);
  const [responseText, setResponseText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const data = await reviewsAPI.list();
      setReviews(Array.isArray(data) ? data : data.items || []);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRespond = async () => {
    if (!responseText.trim() || !respondingTo) return;

    setSending(true);
    try {
      await reviewsAPI.respond(respondingTo.id, responseText.trim());
      setReviews(prev =>
        prev.map(r => r.id === respondingTo.id ? { ...r, response: responseText.trim() } : r)
      );
      setRespondingTo(null);
      setResponseText('');
      Alert.alert('Success', 'Response posted');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to post response');
    } finally {
      setSending(false);
    }
  };

  const renderStars = (rating: number) => (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map(s => (
        <Icon
          key={s}
          name={s <= rating ? 'star' : 'star-outline'}
          size={14}
          color="#f59e0b"
        />
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#1e40af" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadReviews(); }} />
        }
        renderItem={({ item }) => (
          <View style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              {renderStars(item.rating)}
              <Text style={styles.reviewDate}>
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>

            {item.product && (
              <Text style={styles.productName}>{item.product.name}</Text>
            )}

            <Text style={styles.reviewerName}>
              {item.user?.full_name || 'Anonymous'}
            </Text>

            {item.title && <Text style={styles.reviewTitle}>{item.title}</Text>}
            {item.comment && <Text style={styles.reviewComment}>{item.comment}</Text>}

            {item.response ? (
              <View style={styles.responseBox}>
                <Text style={styles.responseLabel}>Your Response:</Text>
                <Text style={styles.responseText}>{item.response}</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.respondButton}
                onPress={() => {
                  setRespondingTo(item);
                  setResponseText('');
                }}
              >
                <Icon name="chatbubble-outline" size={14} color="#1e40af" />
                <Text style={styles.respondButtonText}>Respond</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="star-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Reviews Yet</Text>
            <Text style={styles.emptyText}>Reviews from customers will appear here</Text>
          </View>
        }
        contentContainerStyle={reviews.length === 0 ? { flexGrow: 1 } : { padding: 16 }}
      />

      {/* Respond Modal */}
      <Modal visible={!!respondingTo} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Respond to Review</Text>
              <TouchableOpacity onPress={() => setRespondingTo(null)}>
                <Icon name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {respondingTo && (
              <View style={styles.reviewPreview}>
                {renderStars(respondingTo.rating)}
                <Text style={styles.previewComment} numberOfLines={2}>
                  {respondingTo.comment || 'No comment'}
                </Text>
              </View>
            )}

            <TextInput
              style={styles.responseInput}
              placeholder="Write your response..."
              placeholderTextColor="#9ca3af"
              value={responseText}
              onChangeText={setResponseText}
              multiline
              textAlignVertical="top"
              maxLength={500}
            />

            <TouchableOpacity
              style={[styles.sendButton, (!responseText.trim() || sending) && styles.buttonDisabled]}
              onPress={handleRespond}
              disabled={!responseText.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.sendButtonText}>Post Response</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  starsRow: { flexDirection: 'row' },
  reviewDate: { fontSize: 12, color: '#9ca3af' },
  productName: { fontSize: 13, color: '#3b82f6', fontWeight: '500', marginBottom: 4 },
  reviewerName: { fontSize: 14, fontWeight: '600', color: '#1f2937', marginBottom: 4 },
  reviewTitle: { fontSize: 15, fontWeight: '600', color: '#1f2937', marginBottom: 4 },
  reviewComment: { fontSize: 14, color: '#6b7280', lineHeight: 20 },
  responseBox: {
    marginTop: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#1e40af',
  },
  responseLabel: { fontSize: 12, fontWeight: '600', color: '#1e40af', marginBottom: 4 },
  responseText: { fontSize: 13, color: '#1f2937', lineHeight: 18 },
  respondButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  respondButtonText: { fontSize: 13, fontWeight: '600', color: '#1e40af', marginLeft: 6 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#6b7280', marginTop: 16 },
  emptyText: { fontSize: 14, color: '#9ca3af', marginTop: 4 },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#1f2937' },
  reviewPreview: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  previewComment: { fontSize: 13, color: '#6b7280', marginTop: 6 },
  responseInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    fontSize: 15,
    color: '#1f2937',
    minHeight: 100,
    marginBottom: 16,
  },
  sendButton: {
    backgroundColor: '#1e40af',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  sendButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
