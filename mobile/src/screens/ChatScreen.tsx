import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { formatDistanceToNow } from 'date-fns';
import { MessagesStackParamList, Message } from '../types';
import { messageService } from '../services';
import { useAuthStore } from '../store/authStore';
import { Avatar } from '../components/Avatar';
import { colors } from '../constants/colors';

type Props = NativeStackScreenProps<MessagesStackParamList, 'Chat'>;

export const ChatScreen: React.FC<Props> = ({ route }) => {
  const { partnerId, partnerName, partnerThumbnail } = route.params;
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  const load = useCallback(async (p: number) => {
    const msgs = await messageService.getMessages(partnerId, p);
    if (p === 1) {
      setMessages(msgs);
      setHasMore(msgs.length === 30);
    } else {
      setMessages(prev => [...msgs, ...prev]);
      setHasMore(msgs.length === 30);
    }
    setPage(p);
  }, [partnerId]);

  useEffect(() => { load(1); }, [load]);

  const loadOlder = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      await load(page + 1);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSend = async () => {
    const content = newMsg.trim();
    if (!content) return;
    setNewMsg('');
    setSending(true);
    try {
      const msg = await messageService.send(partnerId, content);
      setMessages(prev => [...prev, msg]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      Alert.alert('Error', 'Failed to send message.');
      setNewMsg(content);
    } finally {
      setSending(false);
    }
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isMine = item.sender_id === user?.id;
    return (
      <View style={[s.msgRow, isMine ? s.msgRowRight : s.msgRowLeft]}>
        {!isMine && <Avatar src={partnerThumbnail} name={partnerName} size={28} />}
        <View style={{ maxWidth: '72%' }}>
          <View style={[s.bubble, isMine ? s.bubbleMine : s.bubbleTheirs]}>
            <Text style={[s.msgText, isMine && { color: '#fff' }]}>{item.content}</Text>
          </View>
          <Text style={[s.msgTime, { textAlign: isMine ? 'right' : 'left' }]}>
            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={m => m.id}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        ListHeaderComponent={
          hasMore ? (
            <TouchableOpacity onPress={loadOlder} disabled={loadingMore} style={s.loadMore}>
              <Text style={s.loadMoreText}>{loadingMore ? 'Loading…' : 'Load older messages'}</Text>
            </TouchableOpacity>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />

      <View style={s.inputBar}>
        <TextInput
          value={newMsg}
          onChangeText={setNewMsg}
          placeholder="Type a message…"
          placeholderTextColor={colors.textLight}
          style={s.input}
          multiline
          maxLength={2000}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={sending || !newMsg.trim()}
          style={[s.sendBtn, (!newMsg.trim() || sending) && s.sendBtnDisabled]}
        >
          <Text style={s.sendBtnText}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  list: { padding: 12, paddingBottom: 8 },
  loadMore: { alignItems: 'center', marginBottom: 12 },
  loadMoreText: { fontSize: 13, color: colors.textMuted, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  msgRow: { flexDirection: 'row', gap: 8, marginBottom: 10, alignItems: 'flex-end' },
  msgRowRight: { justifyContent: 'flex-end' },
  msgRowLeft: { justifyContent: 'flex-start' },
  bubble: { padding: 10, borderRadius: 16 },
  bubbleMine: { backgroundColor: colors.brand, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: colors.surface, borderBottomLeftRadius: 4, borderWidth: 1.5, borderColor: colors.border },
  msgText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  msgTime: { fontSize: 11, color: colors.textMuted, marginTop: 3 },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    padding: 10, backgroundColor: colors.surface,
    borderTopWidth: 1.5, borderTopColor: colors.border,
  },
  input: {
    flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8, fontSize: 14,
    color: colors.text, backgroundColor: colors.bg, maxHeight: 100,
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: colors.border },
  sendBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
