import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { reviewsAPI } from '../../../../shared/api/customer-api';

export default function WriteReviewScreen({ route, navigation }: any) {
  const { productId, productName } = route.params;
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pickImage = async () => {
    if (images.length >= 3) {
      Alert.alert('Limit Reached', 'You can upload up to 3 images per review');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to upload photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }
    if (!comment.trim()) {
      Alert.alert('Error', 'Please write a review');
      return;
    }

    setIsSubmitting(true);
    try {
      await reviewsAPI.create({
        product_id: productId,
        rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
        images: images.length > 0 ? images : undefined,
      });
      Alert.alert('Success', 'Your review has been submitted!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      if (error.statusCode === 400) {
        Alert.alert('Error', 'You have already reviewed this product');
      } else {
        Alert.alert('Error', error.message || 'Failed to submit review');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Product Info */}
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{productName}</Text>
      </View>

      {/* Rating */}
      <View style={styles.ratingSection}>
        <Text style={styles.sectionTitle}>Your Rating</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setRating(star)}
              style={styles.starButton}
            >
              <Icon
                name={star <= rating ? 'star' : 'star-outline'}
                size={36}
                color={star <= rating ? '#f59e0b' : '#d1d5db'}
              />
            </TouchableOpacity>
          ))}
        </View>
        {rating > 0 && (
          <Text style={styles.ratingLabel}>{ratingLabels[rating]}</Text>
        )}
      </View>

      {/* Title */}
      <View style={styles.inputSection}>
        <Text style={styles.sectionTitle}>Review Title (Optional)</Text>
        <TextInput
          style={styles.titleInput}
          placeholder="Summarize your review"
          placeholderTextColor="#9ca3af"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />
      </View>

      {/* Comment */}
      <View style={styles.inputSection}>
        <Text style={styles.sectionTitle}>Your Review</Text>
        <TextInput
          style={styles.commentInput}
          placeholder="Tell others what you think about this product..."
          placeholderTextColor="#9ca3af"
          value={comment}
          onChangeText={setComment}
          multiline
          textAlignVertical="top"
          maxLength={1000}
        />
        <Text style={styles.charCount}>{comment.length}/1000</Text>
      </View>

      {/* Photos */}
      <View style={styles.inputSection}>
        <Text style={styles.sectionTitle}>Add Photos (Optional)</Text>
        <Text style={styles.photoSubtitle}>Upload up to 3 photos to showcase your experience</Text>

        <View style={styles.photoGrid}>
          {images.map((uri, index) => (
            <View key={index} style={styles.photoItem}>
              <Image source={{ uri }} style={styles.photoImage} />
              <TouchableOpacity
                style={styles.photoRemove}
                onPress={() => removeImage(index)}
              >
                <Icon name="close-circle" size={24} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}

          {images.length < 3 && (
            <TouchableOpacity style={styles.photoAddButton} onPress={pickImage}>
              <Icon name="camera-outline" size={32} color="#9ca3af" />
              <Text style={styles.photoAddText}>Add Photo</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.submitText}>Submit Review</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20 },
  productInfo: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 16,
    marginBottom: 24,
  },
  productName: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  ratingSection: { alignItems: 'center', marginBottom: 28 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#1f2937', marginBottom: 12, alignSelf: 'flex-start' },
  starsRow: { flexDirection: 'row', marginBottom: 8 },
  starButton: { padding: 4 },
  ratingLabel: { fontSize: 14, color: '#f59e0b', fontWeight: '600' },
  inputSection: { marginBottom: 24 },
  titleInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    fontSize: 15,
    color: '#1f2937',
  },
  commentInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    fontSize: 15,
    color: '#1f2937',
    minHeight: 120,
  },
  charCount: { fontSize: 12, color: '#9ca3af', textAlign: 'right', marginTop: 4 },
  photoSubtitle: { fontSize: 13, color: '#6b7280', marginBottom: 12 },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoItem: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  photoRemove: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  photoAddButton: {
    width: 100,
    height: 100,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  photoAddText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  buttonDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
