import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const FEATURES = [
  { icon: 'storefront-outline', label: 'Curated Marketplace' },
  { icon: 'shield-checkmark-outline', label: 'Secure Payments' },
  { icon: 'cube-outline', label: 'Fast Delivery' },
  { icon: 'people-outline', label: 'Trusted Vendors' },
  { icon: 'star-outline', label: 'Quality Guarantee' },
  { icon: 'chatbubbles-outline', label: '24/7 Support' },
];

export default function AboutScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerSection}>
        <Icon name="basket-outline" size={64} color="#3b82f6" />
        <Text style={styles.title}>About Channah Marketplace</Text>
        <Text style={styles.subtitle}>Your Trusted Online Marketplace</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Our Mission</Text>
        <Text style={styles.paragraph}>
          Channah Marketplace is dedicated to connecting buyers with trusted vendors,
          providing a seamless and secure shopping experience. We believe in empowering
          local and global sellers while delivering exceptional value to our customers.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What We Offer</Text>
        <View style={styles.featuresGrid}>
          {FEATURES.map((feature) => (
            <View key={feature.label} style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Icon name={feature.icon} size={28} color="#3b82f6" />
              </View>
              <Text style={styles.featureLabel}>{feature.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Company Info</Text>
        <View style={styles.infoRow}>
          <Icon name="calendar-outline" size={20} color="#6b7280" />
          <Text style={styles.infoText}>Founded: 2024</Text>
        </View>
        <View style={styles.infoRow}>
          <Icon name="location-outline" size={20} color="#6b7280" />
          <Text style={styles.infoText}>Headquarters: Global</Text>
        </View>
        <View style={styles.infoRow}>
          <Icon name="globe-outline" size={20} color="#6b7280" />
          <Text style={styles.infoText}>Serving customers worldwide</Text>
        </View>
        <View style={styles.infoRow}>
          <Icon name="people-outline" size={20} color="#6b7280" />
          <Text style={styles.infoText}>10,000+ Active Vendors</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Our Values</Text>
        <Text style={styles.paragraph}>
          We are committed to transparency, quality, and community. Every transaction
          on Channah Marketplace is backed by our buyer protection program, ensuring
          peace of mind for every purchase.
        </Text>
      </View>

      <Text style={styles.version}>Version 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 24,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureItem: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    flexShrink: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  infoText: {
    fontSize: 15,
    color: '#4b5563',
  },
  version: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 13,
    marginTop: 8,
  },
});
