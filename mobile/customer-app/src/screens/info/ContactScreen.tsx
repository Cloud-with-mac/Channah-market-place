import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { contactAPI } from '../../../../shared/api/customer-api';

const CONTACT_INFO = [
  { icon: 'mail-outline', label: 'Email', value: 'support@channah.com' },
  { icon: 'call-outline', label: 'Phone', value: '+44 (0) 800 123 4567' },
  { icon: 'location-outline', label: 'Address', value: 'Channah Marketplace\nLondon, United Kingdom' },
];

export default function ContactScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all fields before submitting.');
      return;
    }

    setLoading(true);
    try {
      await contactAPI.submit({ name, email, subject, message });
      Alert.alert('Message Sent', 'Thank you for contacting us. We will respond within 24 hours.');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch {
      Alert.alert('Error', 'Failed to send your message. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerSection}>
        <Icon name="chatbubble-ellipses-outline" size={48} color="#3b82f6" />
        <Text style={styles.title}>Contact Us</Text>
        <Text style={styles.subtitle}>We would love to hear from you</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Send a Message</Text>

        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Your full name"
          placeholderTextColor="#9ca3af"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="your@email.com"
          placeholderTextColor="#9ca3af"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Subject</Text>
        <TextInput
          style={styles.input}
          placeholder="What is this about?"
          placeholderTextColor="#9ca3af"
          value={subject}
          onChangeText={setSubject}
        />

        <Text style={styles.label}>Message</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Tell us more..."
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          value={message}
          onChangeText={setMessage}
        />

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.8}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <Icon name="send-outline" size={20} color="#ffffff" />
              <Text style={styles.submitText}>Submit</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        {CONTACT_INFO.map((item) => (
          <View key={item.label} style={styles.contactRow}>
            <View style={styles.contactIcon}>
              <Icon name={item.icon} size={22} color="#3b82f6" />
            </View>
            <View style={styles.contactDetails}>
              <Text style={styles.contactLabel}>{item.label}</Text>
              <Text style={styles.contactValue}>{item.value}</Text>
            </View>
          </View>
        ))}
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
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    marginTop: 6,
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
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  textArea: {
    minHeight: 120,
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactDetails: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 15,
    color: '#111827',
    lineHeight: 22,
  },
});
