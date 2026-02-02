import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Modal,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { productsAPI, categoriesAPI } from '../../../../shared/api/customer-api';
import { usePrice } from '../../hooks/usePrice';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;
const RECENT_SEARCHES_KEY = '@recent_searches';
const MAX_RECENT_SEARCHES = 5;

export default function SearchScreen({ navigation, route }: any) {
  const { formatPrice } = usePrice();
  const initialQuery = route?.params?.query || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const popularSearches = categories.slice(0, 6).map((c: any) => c.name);
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  useEffect(() => {
    loadRecentSearches();
    loadCategories();
  }, []);

  useEffect(() => {
    let count = 0;
    if (sortBy) count++;
    if (minPrice || maxPrice) count++;
    if (minRating > 0) count++;
    if (selectedCategory) count++;
    setActiveFilterCount(count);
  }, [sortBy, minPrice, maxPrice, minRating, selectedCategory]);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
        setSearching(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load recent searches:', error);
    }
  };

  const saveRecentSearch = async (query: string) => {
    try {
      const trimmed = query.trim();
      if (!trimmed) return;

      let updated = [trimmed, ...recentSearches.filter(s => s !== trimmed)];
      updated = updated.slice(0, MAX_RECENT_SEARCHES);

      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      setRecentSearches(updated);
    } catch (error) {
      console.error('Failed to save recent search:', error);
    }
  };

  const clearRecentSearches = async () => {
    try {
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
      setRecentSearches([]);
    } catch (error) {
      console.error('Failed to clear recent searches:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await categoriesAPI.getAll();
      const list = Array.isArray(data) ? data : data.results || [];
      setCategories(list);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const params: any = {};
      if (sortBy) params.sort = sortBy;
      if (minPrice) params.min_price = minPrice;
      if (maxPrice) params.max_price = maxPrice;
      if (minRating) params.min_rating = minRating;
      if (selectedCategory) params.category = selectedCategory;
      const response = await productsAPI.search(query, params);
      const results = response.results || response || [];
      setSearchResults(results);
      await saveRecentSearch(query);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const applyFilters = () => {
    setShowFilters(false);
    if (searchQuery.trim()) {
      handleSearch(searchQuery);
    }
  };

  const clearFilters = async () => {
    setSortBy('');
    setMinPrice('');
    setMaxPrice('');
    setMinRating(0);
    setSelectedCategory('');
    setShowFilters(false);
    if (searchQuery.trim()) {
      // Re-search without any filters (state updates are async, so pass empty params directly)
      try {
        setSearching(true);
        const response = await productsAPI.search(searchQuery, {});
        const results = response.results || response || [];
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }
  };

  const handleSearchSelect = (query: string) => {
    setSearchQuery(query);
  };

  const renderProductItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetail', { slug: item.slug })}
    >
      {(item.primary_image || item.images?.[0]?.url) ? (
        <Image
          source={{ uri: item.primary_image || item.images[0].url }}
          style={styles.productImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.productImage, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' }]}>
          <Icon name="image-outline" size={32} color="#d1d5db" />
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

  const renderRecentSearchItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.searchSuggestion}
      onPress={() => handleSearchSelect(item)}
    >
      <Icon name="time-outline" size={20} color="#6b7280" />
      <Text style={styles.suggestionText}>{item}</Text>
    </TouchableOpacity>
  );

  const renderPopularSearchItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.searchSuggestion}
      onPress={() => handleSearchSelect(item)}
    >
      <Icon name="trending-up-outline" size={20} color="#6b7280" />
      <Text style={styles.suggestionText}>{item}</Text>
    </TouchableOpacity>
  );

  const renderEmptyResults = () => (
    <View style={styles.emptyContainer}>
      <Icon name="search-outline" size={64} color="#9ca3af" />
      <Text style={styles.emptyText}>No results found</Text>
      <Text style={styles.emptySubtext}>
        Try searching with different keywords
      </Text>
    </View>
  );

  const renderSearchSuggestions = () => (
    <View style={styles.suggestionsContainer}>
      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <View style={styles.suggestionSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Searches</Text>
            <TouchableOpacity onPress={clearRecentSearches}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={recentSearches}
            renderItem={renderRecentSearchItem}
            keyExtractor={(item, index) => `recent-${index}`}
            scrollEnabled={false}
          />
        </View>
      )}

      {/* Popular Searches */}
      <View style={styles.suggestionSection}>
        <Text style={styles.sectionTitle}>Popular Searches</Text>
        <FlatList
          data={popularSearches}
          renderItem={renderPopularSearchItem}
          keyExtractor={(item, index) => `popular-${index}`}
          scrollEnabled={false}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Icon name="search" size={20} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close-circle" size={20} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilters(true)}>
          <Icon name="options-outline" size={22} color={activeFilterCount > 0 ? '#fff' : '#6b7280'} />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Loading Indicator */}
      {searching && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#3b82f6" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )}

      {/* Content */}
      {searchQuery.trim().length === 0 ? (
        renderSearchSuggestions()
      ) : searchResults.length > 0 ? (
        <FlatList
          data={searchResults}
          renderItem={renderProductItem}
          keyExtractor={(item, index) => item.id?.toString() || `search-${index}`}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : !searching && searchQuery.trim().length > 0 ? (
        renderEmptyResults()
      ) : null}

      {/* Filter Modal */}
      <Modal visible={showFilters} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Icon name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Sort */}
              <Text style={styles.filterLabel}>Sort By</Text>
              <View style={styles.chipRow}>
                {[
                  { key: '', label: 'Default' },
                  { key: 'price_asc', label: 'Price: Low' },
                  { key: 'price_desc', label: 'Price: High' },
                  { key: 'newest', label: 'Newest' },
                  { key: 'rating', label: 'Top Rated' },
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.chip, sortBy === opt.key && styles.chipActive]}
                    onPress={() => setSortBy(opt.key)}
                  >
                    <Text style={[styles.chipText, sortBy === opt.key && styles.chipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Price Range */}
              <Text style={styles.filterLabel}>Price Range</Text>
              <View style={styles.priceRangeRow}>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Min"
                  value={minPrice}
                  onChangeText={setMinPrice}
                  keyboardType="numeric"
                />
                <Text style={styles.priceDash}>—</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Max"
                  value={maxPrice}
                  onChangeText={setMaxPrice}
                  keyboardType="numeric"
                />
              </View>

              {/* Rating */}
              <Text style={styles.filterLabel}>Minimum Rating</Text>
              <View style={styles.chipRow}>
                {[0, 3, 3.5, 4, 4.5].map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.chip, minRating === r && styles.chipActive]}
                    onPress={() => setMinRating(r)}
                  >
                    <Text style={[styles.chipText, minRating === r && styles.chipTextActive]}>
                      {r === 0 ? 'Any' : `${r}+`} {r > 0 ? '★' : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Category */}
              {categories.length > 0 && (
                <>
                  <Text style={styles.filterLabel}>Category</Text>
                  <View style={styles.chipRow}>
                    <TouchableOpacity
                      style={[styles.chip, !selectedCategory && styles.chipActive]}
                      onPress={() => setSelectedCategory('')}
                    >
                      <Text style={[styles.chipText, !selectedCategory && styles.chipTextActive]}>All</Text>
                    </TouchableOpacity>
                    {categories.map((cat: any) => (
                      <TouchableOpacity
                        key={cat.id || cat.slug}
                        style={[styles.chip, selectedCategory === cat.slug && styles.chipActive]}
                        onPress={() => setSelectedCategory(cat.slug)}
                      >
                        <Text style={[styles.chipText, selectedCategory === cat.slug && styles.chipTextActive]}>
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.filterActions}>
              <TouchableOpacity style={styles.clearFilterBtn} onPress={clearFilters}>
                <Text style={styles.clearFilterText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyFilterBtn} onPress={applyFilters}>
                <Text style={styles.applyFilterText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    marginBottom: 8,
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterBtn: {
    width: 44, height: 44, borderRadius: 8, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  filterBadge: {
    position: 'absolute', top: 2, right: 2, width: 16, height: 16,
    borderRadius: 8, backgroundColor: '#3b82f6',
    justifyContent: 'center', alignItems: 'center',
  },
  filterBadgeText: { fontSize: 10, color: '#fff', fontWeight: 'bold' },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  suggestionsContainer: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 8,
    borderRadius: 12,
    padding: 16,
  },
  suggestionSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  clearText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  searchSuggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  suggestionText: {
    fontSize: 15,
    color: '#1f2937',
    marginLeft: 12,
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
  // Filter Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16,
    padding: 24, paddingBottom: 40, maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  filterLabel: {
    fontSize: 14, fontWeight: '600', color: '#1f2937', marginBottom: 8, marginTop: 16,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb',
  },
  chipActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  chipText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  priceRangeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  priceInput: {
    flex: 1, backgroundColor: '#f3f4f6', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1f2937',
  },
  priceDash: { fontSize: 16, color: '#9ca3af' },
  filterActions: {
    flexDirection: 'row', gap: 12, marginTop: 24,
  },
  clearFilterBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 8,
    borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center',
  },
  clearFilterText: { fontSize: 14, color: '#6b7280', fontWeight: '600' },
  applyFilterBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 8,
    backgroundColor: '#3b82f6', alignItems: 'center',
  },
  applyFilterText: { fontSize: 14, color: '#fff', fontWeight: '600' },
});
