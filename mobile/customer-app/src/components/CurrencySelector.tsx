import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useCurrencyStore, currencies, Currency } from '../store/currencyStore';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function CurrencySelector({ visible, onClose }: Props) {
  const { currency, setCurrency } = useCurrencyStore();
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () =>
      search
        ? currencies.filter(
            (c) =>
              c.name.toLowerCase().includes(search.toLowerCase()) ||
              c.code.toLowerCase().includes(search.toLowerCase())
          )
        : currencies,
    [search]
  );

  const handleSelect = (c: Currency) => {
    setCurrency(c.code);
    onClose();
    setSearch('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Currency</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          <View style={styles.searchBar}>
            <Icon name="search" size={18} color="#9ca3af" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search currency..."
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
          </View>
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => {
              const isSelected = item.code === currency.code;
              return (
                <TouchableOpacity
                  style={[styles.item, isSelected && styles.itemActive]}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={styles.flag}>{item.flag}</Text>
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemCode, isSelected && styles.itemCodeActive]}>
                      {item.code}
                    </Text>
                    <Text style={styles.itemName}>{item.name}</Text>
                  </View>
                  <Text style={styles.symbol}>{item.symbol}</Text>
                  {isSelected && <Icon name="checkmark" size={18} color="#3b82f6" />}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No currency found</Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '75%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    margin: 12,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#1f2937',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemActive: {
    backgroundColor: '#eff6ff',
  },
  flag: {
    fontSize: 22,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemCode: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  itemCodeActive: {
    color: '#3b82f6',
  },
  itemName: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 1,
  },
  symbol: {
    fontSize: 16,
    color: '#6b7280',
    marginRight: 8,
  },
  empty: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
  },
});
