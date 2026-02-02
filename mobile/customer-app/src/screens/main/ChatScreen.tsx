import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { messagingAPI } from '../../../../shared/api/customer-api';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_type: 'customer' | 'vendor';
  created_at: string;
  is_read: boolean;
}

interface Conversation {
  id: string;
  vendor_id: string;
  vendor_name: string;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
}

function ConversationList({ onSelect }: { onSelect: (conv: Conversation) => void }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const data = await messagingAPI.getConversations();
      setConversations(Array.isArray(data) ? data : data.items || []);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDay = Math.floor((now.getTime() - date.getTime()) / 86400000);
    if (diffDay === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDay === 1) return 'Yesterday';
    if (diffDay < 7) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (conversations.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="chatbubbles-outline" size={64} color="#d1d5db" />
        <Text style={styles.emptyTitle}>No Messages</Text>
        <Text style={styles.emptyText}>Start a conversation from a product page</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={conversations}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.convItem} onPress={() => onSelect(item)}>
          <View style={styles.convAvatar}>
            <Icon name="storefront-outline" size={24} color="#3b82f6" />
          </View>
          <View style={styles.convContent}>
            <View style={styles.convHeader}>
              <Text style={[styles.convName, item.unread_count > 0 && styles.boldText]}>
                {item.vendor_name}
              </Text>
              <Text style={styles.convTime}>{formatTime(item.last_message_at)}</Text>
            </View>
            <Text style={styles.convLastMsg} numberOfLines={1}>
              {item.last_message || 'No messages yet'}
            </Text>
          </View>
          {item.unread_count > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.unread_count}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
    />
  );
}

function ChatView({ conversation, onBack }: { conversation: Conversation; onBack: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [convId, setConvId] = useState(conversation.id);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadMessages();
  }, [convId]);

  const loadMessages = async () => {
    try {
      if (convId.startsWith('new-')) {
        // New conversation — no messages yet
        setMessages([]);
      } else {
        const data = await messagingAPI.getMessages(convId);
        setMessages(Array.isArray(data) ? data : data.items || []);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!text.trim() || sending) return;

    const content = text.trim();
    setText('');
    setSending(true);

    try {
      let newMsg;
      if (convId.startsWith('new-')) {
        // First message — create the conversation
        const result = await messagingAPI.startConversation(conversation.vendor_id, content);
        // Update local conversation ID so subsequent messages use the real ID
        if (result.id) {
          setConvId(result.id);
        }
        newMsg = result.message || result;
      } else {
        newMsg = await messagingAPI.sendMessage(convId, content);
      }
      if (newMsg) {
        setMessages(prev => [...prev, newMsg]);
      }
      flatListRef.current?.scrollToEnd();
    } catch (error) {
      setText(content);
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.sender_type === 'customer';
    return (
      <View style={[styles.msgRow, isOwn && styles.msgRowOwn]}>
        <View style={[styles.msgBubble, isOwn ? styles.msgBubbleOwn : styles.msgBubbleOther]}>
          <Text style={[styles.msgText, isOwn && styles.msgTextOwn]}>{item.content}</Text>
          <Text style={[styles.msgTime, isOwn && styles.msgTimeOwn]}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.chatContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Chat Header */}
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <View style={styles.chatHeaderAvatar}>
          <Icon name="storefront-outline" size={18} color="#3b82f6" />
        </View>
        <Text style={styles.chatHeaderName}>{conversation.vendor_name}</Text>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatText}>Send a message to start the conversation</Text>
            </View>
          }
        />
      )}

      {/* Input */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.chatInput}
          placeholder="Type a message..."
          placeholderTextColor="#9ca3af"
          value={text}
          onChangeText={setText}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Icon name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

export default function ChatScreen({ navigation, route }: any) {
  const vendorId = route?.params?.vendorId;
  const vendorName = route?.params?.vendorName;
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [creatingConv, setCreatingConv] = useState(false);

  useEffect(() => {
    if (vendorId && !activeConversation && !creatingConv) {
      openVendorConversation();
    }
  }, [vendorId]);

  const openVendorConversation = async () => {
    try {
      setCreatingConv(true);
      // Check if conversation with this vendor already exists
      const data = await messagingAPI.getConversations();
      const conversations = Array.isArray(data) ? data : data.items || [];
      const existing = conversations.find((c: Conversation) => c.vendor_id === vendorId);
      if (existing) {
        setActiveConversation(existing);
      } else {
        // Create a placeholder conversation — actual creation happens on first message
        setActiveConversation({
          id: `new-${vendorId}`,
          vendor_id: vendorId,
          vendor_name: vendorName || 'Vendor',
          unread_count: 0,
        });
      }
    } catch {
      // Fall back to conversation list
    } finally {
      setCreatingConv(false);
    }
  };

  if (creatingConv) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (activeConversation) {
    return (
      <ChatView
        conversation={activeConversation}
        onBack={() => setActiveConversation(null)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ConversationList onSelect={setActiveConversation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#6b7280', marginTop: 16 },
  emptyText: { fontSize: 14, color: '#9ca3af', marginTop: 4 },
  // Conversation list
  convItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  convAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  convContent: { flex: 1 },
  convHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  convName: { fontSize: 15, fontWeight: '500', color: '#1f2937' },
  boldText: { fontWeight: '700' },
  convTime: { fontSize: 12, color: '#9ca3af' },
  convLastMsg: { fontSize: 13, color: '#6b7280' },
  badge: {
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  // Chat view
  chatContainer: { flex: 1, backgroundColor: '#f5f5f5' },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backBtn: { padding: 4, marginRight: 8 },
  chatHeaderAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  chatHeaderName: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  messagesList: { padding: 16, paddingBottom: 8 },
  msgRow: { marginBottom: 8, alignItems: 'flex-start' },
  msgRowOwn: { alignItems: 'flex-end' },
  msgBubble: {
    maxWidth: '78%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  msgBubbleOwn: { backgroundColor: '#3b82f6', borderBottomRightRadius: 4 },
  msgBubbleOther: { backgroundColor: '#fff', borderBottomLeftRadius: 4 },
  msgText: { fontSize: 15, color: '#1f2937', lineHeight: 20 },
  msgTextOwn: { color: '#fff' },
  msgTime: { fontSize: 11, color: '#9ca3af', marginTop: 4, alignSelf: 'flex-end' },
  msgTimeOwn: { color: 'rgba(255,255,255,0.7)' },
  emptyChat: { alignItems: 'center', paddingTop: 40 },
  emptyChatText: { fontSize: 14, color: '#9ca3af' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: '#1f2937',
    marginRight: 8,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
});
