import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { rfqAPI } from '../../../../shared/api/customer-api';

const STATUS_COLORS: Record<string, string> = {
  open: '#3b82f6',
  quoted: '#f59e0b',
  awarded: '#22c55e',
  closed: '#6b7280',
  draft: '#9ca3af',
  negotiating: '#8b5cf6',
};

export default function RFQDetailScreen({ route, navigation }: any) {
  const { rfqId } = route.params;
  const [rfq, setRfq] = useState<any>(null);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingQuoteId, setAcceptingQuoteId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [rfqData, quotesData] = await Promise.all([
        rfqAPI.getById(rfqId),
        rfqAPI.getQuotes(rfqId).catch(() => []),
      ]);
      setRfq(rfqData);
      const quotesList = Array.isArray(quotesData) ? quotesData : quotesData?.results || quotesData?.items || [];
      setQuotes(quotesList);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load quote details', [
        { text: 'Go Back', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [rfqId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleAcceptQuote = async (quoteId: string) => {
    Alert.alert(
      'Accept Quote',
      'Are you sure you want to accept this quote?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              setAcceptingQuoteId(quoteId);
              await rfqAPI.acceptQuote(rfqId, quoteId);
              Alert.alert('Success', 'Quote accepted successfully!');
              loadData();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to accept quote');
            } finally {
              setAcceptingQuoteId(null);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!rfq) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="alert-circle-outline" size={64} color="#9ca3af" />
        <Text style={styles.emptyText}>Quote request not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const status = (rfq.status || 'open').toLowerCase();
  const statusColor = STATUS_COLORS[status] || '#6b7280';
  const canAcceptQuotes = ['open', 'quoted', 'negotiating'].includes(status);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />}
    >
      {/* RFQ Details Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.rfqTitle}>{rfq.title || rfq.product_name || rfq.productName || 'Untitled'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </View>
        </View>

        {!!rfq.description && (
          <Text style={styles.description}>{rfq.description}</Text>
        )}

        <View style={styles.detailsGrid}>
          <DetailRow icon="cube-outline" label="Quantity" value={`${rfq.quantity || '-'} ${rfq.unit || ''}`} />
          {(rfq.target_price || rfq.targetPrice) && (
            <DetailRow icon="pricetag-outline" label="Target Price" value={`${rfq.currency || 'USD'} ${rfq.target_price || rfq.targetPrice}`} />
          )}
          {(rfq.delivery_deadline || rfq.deliveryDeadline) && (
            <DetailRow icon="calendar-outline" label="Delivery Deadline" value={new Date(rfq.delivery_deadline || rfq.deliveryDeadline).toLocaleDateString()} />
          )}
          {(rfq.created_at || rfq.createdAt) && (
            <DetailRow icon="time-outline" label="Created" value={new Date(rfq.created_at || rfq.createdAt).toLocaleDateString()} />
          )}
        </View>

        {(rfq.specifications || rfq.specs) && (
          <View style={styles.specsSection}>
            <Text style={styles.specsLabel}>Specifications</Text>
            <Text style={styles.specsText}>{rfq.specifications || rfq.specs}</Text>
          </View>
        )}
      </View>

      {/* Quotes Section */}
      <Text style={styles.sectionTitle}>
        Vendor Quotes ({quotes.length})
      </Text>

      {quotes.length === 0 ? (
        <View style={styles.emptyQuotes}>
          <Icon name="chatbubbles-outline" size={40} color="#9ca3af" />
          <Text style={styles.emptyQuotesText}>No quotes received yet</Text>
          <Text style={styles.emptyQuotesSubtext}>Vendors will respond to your request soon.</Text>
        </View>
      ) : (
        quotes.map((quote) => {
          const quoteStatus = (quote.status || 'pending').toLowerCase();
          return (
            <View key={quote.id} style={styles.quoteCard}>
              <View style={styles.quoteHeader}>
                <View style={styles.vendorInfo}>
                  <Icon name="storefront-outline" size={20} color="#3b82f6" />
                  <Text style={styles.vendorName}>{quote.vendor_name || quote.vendorName || 'Vendor'}</Text>
                </View>
                {quoteStatus === 'accepted' && (
                  <View style={[styles.quoteStatusBadge, { backgroundColor: '#dcfce7' }]}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#16a34a' }}>Accepted</Text>
                  </View>
                )}
                {quoteStatus === 'rejected' && (
                  <View style={[styles.quoteStatusBadge, { backgroundColor: '#fef2f2' }]}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#dc2626' }}>Rejected</Text>
                  </View>
                )}
              </View>

              <View style={styles.quoteDetails}>
                <View style={styles.quoteRow}>
                  <Text style={styles.quoteLabel}>Price per unit</Text>
                  <Text style={styles.quoteValue}>
                    {rfq.currency || 'USD'} {quote.unit_price || quote.unitPrice || '-'}
                  </Text>
                </View>
                <View style={styles.quoteRow}>
                  <Text style={styles.quoteLabel}>Total</Text>
                  <Text style={[styles.quoteValue, { color: '#3b82f6', fontWeight: 'bold' }]}>
                    {rfq.currency || 'USD'} {quote.total_price || quote.totalPrice || (Number(quote.unit_price || quote.unitPrice || 0) * Number(rfq.quantity || 0)).toFixed(2)}
                  </Text>
                </View>
                {(quote.lead_time || quote.leadTime) && (
                  <View style={styles.quoteRow}>
                    <Text style={styles.quoteLabel}>Lead Time</Text>
                    <Text style={styles.quoteValue}>{quote.lead_time || quote.leadTime}</Text>
                  </View>
                )}
                {(quote.moq != null) && (
                  <View style={styles.quoteRow}>
                    <Text style={styles.quoteLabel}>MOQ</Text>
                    <Text style={styles.quoteValue}>{quote.moq}</Text>
                  </View>
                )}
                {(quote.valid_until || quote.validUntil) && (
                  <View style={styles.quoteRow}>
                    <Text style={styles.quoteLabel}>Valid Until</Text>
                    <Text style={styles.quoteValue}>
                      {new Date(quote.valid_until || quote.validUntil).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>

              {quote.notes && (
                <Text style={styles.quoteNotes}>{quote.notes}</Text>
              )}

              {canAcceptQuotes && quoteStatus === 'pending' && (
                <View style={styles.quoteActions}>
                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => handleAcceptQuote(quote.id)}
                    disabled={acceptingQuoteId === quote.id}
                  >
                    {acceptingQuoteId === quote.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Icon name="checkmark-circle" size={18} color="#fff" />
                        <Text style={styles.acceptButtonText}>Accept</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Icon name={icon} size={16} color="#6b7280" />
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 40 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#6b7280', marginTop: 16, marginBottom: 24 },
  backButton: { backgroundColor: '#3b82f6', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24 },
  backButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  rfqTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', flex: 1, marginRight: 12 },
  statusBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
  description: { fontSize: 14, color: '#6b7280', lineHeight: 20, marginBottom: 16 },
  detailsGrid: { gap: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailLabel: { fontSize: 13, color: '#6b7280' },
  detailValue: { fontSize: 13, fontWeight: '600', color: '#1f2937' },
  specsSection: { marginTop: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 12 },
  specsLabel: { fontSize: 14, fontWeight: '600', color: '#1f2937', marginBottom: 6 },
  specsText: { fontSize: 13, color: '#6b7280', lineHeight: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 12 },
  emptyQuotes: { alignItems: 'center', padding: 32, backgroundColor: '#fff', borderRadius: 12 },
  emptyQuotesText: { fontSize: 15, fontWeight: '600', color: '#6b7280', marginTop: 12 },
  emptyQuotesSubtext: { fontSize: 13, color: '#9ca3af', marginTop: 4 },
  quoteCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  quoteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  vendorInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  vendorName: { fontSize: 15, fontWeight: '600', color: '#1f2937' },
  quoteStatusBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  quoteDetails: { gap: 6 },
  quoteRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quoteLabel: { fontSize: 13, color: '#6b7280' },
  quoteValue: { fontSize: 13, fontWeight: '500', color: '#1f2937' },
  quoteNotes: { fontSize: 13, color: '#6b7280', fontStyle: 'italic', marginTop: 10, lineHeight: 18 },
  quoteActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, gap: 10 },
  acceptButton: {
    backgroundColor: '#22c55e',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  acceptButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
