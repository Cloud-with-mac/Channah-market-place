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
    icon: 'folder-open-outline',
    title: 'Data Collection',
    content:
      'We collect information you provide directly, such as your name, email address, shipping address, and payment details when you create an account or make a purchase. We also automatically collect usage data, device information, and cookies to improve your experience.',
  },
  {
    icon: 'analytics-outline',
    title: 'How We Use Your Data',
    content:
      'Your data is used to process orders, personalize your shopping experience, send relevant notifications, improve our services, and ensure platform security. We may also use aggregated, anonymized data for analytics and research purposes.',
  },
  {
    icon: 'share-social-outline',
    title: 'Data Sharing',
    content:
      'We share your information with vendors to fulfill orders, payment processors to handle transactions, and shipping partners for delivery. We do not sell your personal data to third parties. We may disclose information when required by law or to protect our legal rights.',
  },
  {
    icon: 'lock-closed-outline',
    title: 'Data Security',
    content:
      'We implement industry-standard security measures including encryption, secure servers, and regular security audits to protect your personal information. While no system is completely secure, we take all reasonable steps to safeguard your data.',
  },
  {
    icon: 'hand-left-outline',
    title: 'Your Rights',
    content:
      'You have the right to access, correct, or delete your personal data at any time. You can opt out of marketing communications, request a copy of your data, and withdraw consent for data processing. Contact us to exercise any of these rights.',
  },
  {
    icon: 'mail-outline',
    title: 'Contact Us',
    content:
      'If you have questions or concerns about our privacy practices, please contact our Data Protection Officer at privacy@channah.com or write to us at our headquarters. We will respond to all privacy-related inquiries within 30 days.',
  },
];

export default function PrivacyScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerSection}>
        <Icon name="shield-checkmark-outline" size={48} color="#3b82f6" />
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.lastUpdated}>Last updated: January 2025</Text>
      </View>

      <Text style={styles.intro}>
        At Channah Marketplace, we take your privacy seriously. This policy explains
        how we collect, use, and protect your personal information.
      </Text>

      {SECTIONS.map((section) => (
        <View key={section.title} style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconContainer}>
              <Icon name={section.icon} size={24} color="#3b82f6" />
            </View>
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
          <Text style={styles.sectionContent}>{section.content}</Text>
        </View>
      ))}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          By using Channah Marketplace, you consent to this Privacy Policy.
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
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingLeft: 52,
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
});
