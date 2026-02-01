import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  icon: string;
  items: FAQItem[];
}

const FAQ_DATA: FAQCategory[] = [
  {
    title: 'Orders',
    icon: 'cart-outline',
    items: [
      {
        question: 'How do I place an order?',
        answer:
          'Browse products, add items to your cart, and proceed to checkout. You can pay using credit/debit cards, mobile money, or other supported payment methods.',
      },
      {
        question: 'Can I cancel my order?',
        answer:
          'You can cancel your order within 1 hour of placing it, provided it has not yet been shipped. Go to your order history and tap "Cancel Order".',
      },
    ],
  },
  {
    title: 'Payments',
    icon: 'card-outline',
    items: [
      {
        question: 'What payment methods are accepted?',
        answer:
          'We accept credit/debit cards (Visa, Mastercard), mobile money, bank transfers, and Channah wallet balance.',
      },
      {
        question: 'Is my payment information secure?',
        answer:
          'Yes, all payments are processed through encrypted, PCI-compliant payment gateways. We never store your full card details on our servers.',
      },
    ],
  },
  {
    title: 'Shipping',
    icon: 'airplane-outline',
    items: [
      {
        question: 'How long does delivery take?',
        answer:
          'Standard delivery takes 3-7 business days. Express delivery is available for 1-2 business days at an additional cost. Delivery times may vary by location.',
      },
      {
        question: 'Can I track my shipment?',
        answer:
          'Yes, once your order ships you will receive a tracking number via email and push notification. You can also track your order in the app under "My Orders".',
      },
    ],
  },
  {
    title: 'Account',
    icon: 'person-outline',
    items: [
      {
        question: 'How do I reset my password?',
        answer:
          'Tap "Forgot Password" on the login screen, enter your email address, and follow the instructions in the reset email we send you.',
      },
      {
        question: 'How do I update my profile?',
        answer:
          'Go to Account > Profile Settings to update your name, email, phone number, and shipping addresses.',
      },
    ],
  },
  {
    title: 'Returns',
    icon: 'refresh-outline',
    items: [
      {
        question: 'What is the return policy?',
        answer:
          'Most items can be returned within 30 days of delivery in their original condition. Perishable goods and custom items are excluded from returns.',
      },
      {
        question: 'How do I initiate a return?',
        answer:
          'Go to My Orders, select the order, and tap "Request Return". Follow the instructions to print a return label and ship the item back.',
      },
    ],
  },
];

export default function HelpScreen() {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleItem = (key: string) => {
    setExpandedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerSection}>
        <Icon name="help-circle-outline" size={48} color="#3b82f6" />
        <Text style={styles.title}>Help & FAQ</Text>
        <Text style={styles.subtitle}>Find answers to common questions</Text>
      </View>

      {FAQ_DATA.map((category) => (
        <View key={category.title} style={styles.category}>
          <View style={styles.categoryHeader}>
            <Icon name={category.icon} size={22} color="#3b82f6" />
            <Text style={styles.categoryTitle}>{category.title}</Text>
          </View>

          {category.items.map((item, index) => {
            const key = `${category.title}-${index}`;
            const isExpanded = !!expandedItems[key];

            return (
              <TouchableOpacity
                key={key}
                style={styles.faqItem}
                onPress={() => toggleItem(key)}
                activeOpacity={0.7}
              >
                <View style={styles.questionRow}>
                  <Text style={styles.questionText}>{item.question}</Text>
                  <Icon
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#6b7280"
                  />
                </View>
                {isExpanded && (
                  <Text style={styles.answerText}>{item.answer}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
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
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    marginTop: 6,
  },
  category: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  faqItem: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  questionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  questionText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1f2937',
    flex: 1,
  },
  answerText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 22,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
});
