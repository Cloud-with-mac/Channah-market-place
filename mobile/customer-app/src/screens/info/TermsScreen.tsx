import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const SECTIONS = [
  {
    number: 1,
    title: 'Account Terms',
    content:
      'You must be at least 18 years old to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate and complete information during registration and to update your information as necessary.',
  },
  {
    number: 2,
    title: 'Orders & Purchases',
    content:
      'All orders placed through Channah Marketplace are subject to acceptance and availability. Prices are displayed in your local currency and may be subject to applicable taxes and shipping fees. We reserve the right to cancel or refuse any order at our discretion. Payment must be completed at the time of purchase.',
  },
  {
    number: 3,
    title: 'Returns & Refunds',
    content:
      'Products may be returned within 30 days of delivery, provided they are in their original condition and packaging. Refunds will be processed within 5-10 business days after we receive the returned item. Certain products, such as perishable goods and personalized items, may not be eligible for returns.',
  },
  {
    number: 4,
    title: 'Privacy & Data',
    content:
      'Your use of Channah Marketplace is also governed by our Privacy Policy. By using our services, you consent to the collection, use, and sharing of your information as described in the Privacy Policy. We implement industry-standard security measures to protect your personal data.',
  },
  {
    number: 5,
    title: 'Limitation of Liability',
    content:
      'Channah Marketplace shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the platform. Our total liability for any claim arising from these terms shall not exceed the amount you paid for the specific product or service giving rise to the claim.',
  },
  {
    number: 6,
    title: 'Changes to Terms',
    content:
      'We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately upon posting to the platform. Your continued use of Channah Marketplace after any changes constitutes acceptance of the updated terms. We will make reasonable efforts to notify users of significant changes.',
  },
];

export default function TermsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerSection}>
        <Icon name="document-text-outline" size={48} color="#3b82f6" />
        <Text style={styles.title}>Terms of Service</Text>
        <Text style={styles.lastUpdated}>Last updated: January 2025</Text>
      </View>

      <Text style={styles.intro}>
        Please read these Terms of Service carefully before using Channah Marketplace.
        By accessing or using our platform, you agree to be bound by these terms.
      </Text>

      {SECTIONS.map((section) => (
        <View key={section.number} style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.numberBadge}>
              <Text style={styles.numberText}>{section.number}</Text>
            </View>
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
          <Text style={styles.sectionContent}>{section.content}</Text>
        </View>
      ))}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          If you have questions about these terms, please contact us at{' '}
          <Text style={styles.link}>legal@channah.com</Text>
        </Text>
      </View>
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
    paddingVertical: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 6,
  },
  intro: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 24,
    marginBottom: 20,
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
  },
  section: {
    marginBottom: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  numberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  sectionContent: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 22,
    paddingLeft: 44,
  },
  footer: {
    marginTop: 8,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  link: {
    color: '#3b82f6',
    fontWeight: '500',
  },
});
