import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, Image, Alert, RefreshControl,
} from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { Announcement, Comment, ReactionType } from '../types';
import { announcementService } from '../services';
import { useAuthStore } from '../store/authStore';
import { Avatar } from '../components/Avatar';
import { colors } from '../constants/colors';
import { UPLOADS_BASE } from '../services/api';

const REACTIONS: { type: ReactionType; emoji: string }[] = [
  { type: 'like', emoji: '👍' },
  { type: 'love', emoji: '❤️' },
  { type: 'hug', emoji: '🤗' },
  { type: 'celebrate', emoji: '🎉' },
  { type: 'support', emoji: '🙏' },
];

function CommentsSection({ announcementId, userId }: { announcementId: string; userId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    announcementService.getComments(announcementId).then(setComments).finally(() => setLoading(false));
  }, [announcementId]);

  const submit = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      const c = await announcementService.addComment(announcementId, text.trim());
      setComments(prev => [...prev, c]);
      setText('');
    } finally {
      setSending(false);
    }
  };

  const deleteComment = (commentId: string, commentUserId: string) => {
    if (commentUserId !== userId) return;
    Alert.alert('Delete Comment', 'Remove this comment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await announcementService.deleteComment(announcementId, commentId);
          setComments(prev => prev.filter(c => c.id !== commentId));
        },
      },
    ]);
  };

  if (loading) return <ActivityIndicator size="small" color={colors.brand} style={{ marginTop: 8 }} />;

  return (
    <View style={cs.wrap}>
      {comments.map(c => (
        <TouchableOpacity key={c.id} onLongPress={() => deleteComment(c.id, c.user_id)} style={cs.comment}>
          <Avatar src={c.author_thumbnail} name={c.author_name} size={28} />
          <View style={cs.bubble}>
            <Text style={cs.author}>{c.author_name}</Text>
            <Text style={cs.body}>{c.content}</Text>
          </View>
        </TouchableOpacity>
      ))}
      <View style={cs.inputRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Add a comment…"
          placeholderTextColor={colors.textLight}
          style={cs.input}
          multiline
        />
        <TouchableOpacity onPress={submit} disabled={sending || !text.trim()} style={cs.sendBtn}>
          <Text style={[cs.sendText, (!text.trim() || sending) && { opacity: 0.4 }]}>Post</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const cs = StyleSheet.create({
  wrap: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border },
  comment: { flexDirection: 'row', gap: 8, marginBottom: 10, alignItems: 'flex-start' },
  bubble: { flex: 1, backgroundColor: colors.bg, borderRadius: 10, padding: 8 },
  author: { fontWeight: '700', fontSize: 12, color: colors.text, marginBottom: 2 },
  body: { fontSize: 13, color: colors.text },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 4 },
  input: {
    flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: 10,
    padding: 8, fontSize: 13, color: colors.text, backgroundColor: colors.bg, maxHeight: 80,
  },
  sendBtn: { paddingBottom: 8 },
  sendText: { color: colors.brand, fontWeight: '700', fontSize: 14 },
});

function AnnouncementCard({ item, userId, onDelete, onReact }: {
  item: Announcement; userId: string;
  onDelete: (id: string) => void;
  onReact: (id: string, type: ReactionType) => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const isOwn = item.userId === userId;

  const mediaUri = item.mediaUrl
    ? (item.mediaUrl.startsWith('http') ? item.mediaUrl : `${UPLOADS_BASE}${item.mediaUrl}`)
    : null;

  const reactionTotal = Object.values(item.reactions).reduce((a, b) => a + b, 0);

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <Avatar src={item.author.thumbnail} name={item.author.name} size={40} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={s.authorName}>{item.author.name}</Text>
          <Text style={s.time}>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</Text>
        </View>
        {isOwn && (
          <TouchableOpacity onPress={() => Alert.alert('Delete Post', 'Remove this announcement?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => onDelete(item.id) },
          ])}>
            <Text style={s.dots}>•••</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={s.content}>{item.content}</Text>

      {mediaUri && item.mediaType === 'image' && (
        <Image source={{ uri: mediaUri }} style={s.media} resizeMode="cover" />
      )}

      {/* Reaction summary */}
      {reactionTotal > 0 && (
        <Text style={s.reactionSummary}>
          {REACTIONS.filter(r => item.reactions[r.type] > 0).map(r => r.emoji).join(' ')} {reactionTotal}
        </Text>
      )}

      <View style={s.actions}>
        <View style={{ position: 'relative' }}>
          <TouchableOpacity style={s.actionBtn} onPress={() => setShowReactions(v => !v)}>
            <Text style={[s.actionText, item.userReaction && { color: colors.brand }]}>
              {item.userReaction
                ? REACTIONS.find(r => r.type === item.userReaction)?.emoji
                : '👍'} React
            </Text>
          </TouchableOpacity>
          {showReactions && (
            <View style={s.reactionPicker}>
              {REACTIONS.map(r => (
                <TouchableOpacity
                  key={r.type}
                  onPress={() => { onReact(item.id, r.type); setShowReactions(false); }}
                  style={s.reactionOpt}
                >
                  <Text style={s.reactionEmoji}>{r.emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity style={s.actionBtn} onPress={() => setShowComments(v => !v)}>
          <Text style={s.actionText}>💬 {item.commentCount > 0 ? item.commentCount : ''} Comment</Text>
        </TouchableOpacity>
      </View>

      {showComments && <CommentsSection announcementId={item.id} userId={userId} />}
    </View>
  );
}

export const DashboardScreen: React.FC = () => {
  const { user } = useAuthStore();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);

  const load = useCallback(async (p: number, refresh = false) => {
    try {
      const res = await announcementService.getAll(p);
      const items = res.data;
      setAnnouncements(prev => refresh ? items : [...prev, ...items]);
      setHasMore(p < res.pagination.pages);
      setPage(p);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(1, true); }, [load]);

  const refresh = () => { setRefreshing(true); load(1, true); };

  const loadMore = () => { if (hasMore && !loading) load(page + 1); };

  const handlePost = async () => {
    if (!newPost.trim()) return;
    setPosting(true);
    try {
      const form = new FormData();
      form.append('content', newPost.trim());
      const item = await announcementService.create(form);
      setAnnouncements(prev => [item, ...prev]);
      setNewPost('');
    } catch {
      Alert.alert('Error', 'Failed to post.');
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (id: string) => {
    await announcementService.remove(id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  const handleReact = async (id: string, type: ReactionType) => {
    const result = await announcementService.react(id, type) as { action: string; type: ReactionType };
    setAnnouncements(prev => prev.map(a => {
      if (a.id !== id) return a;
      const reactions = { ...a.reactions };
      if (result.action === 'removed') {
        reactions[type] = Math.max(0, (reactions[type] || 0) - 1);
        return { ...a, reactions, userReaction: null };
      }
      if (result.action === 'changed' && a.userReaction) {
        reactions[a.userReaction] = Math.max(0, (reactions[a.userReaction] || 0) - 1);
      }
      reactions[type] = (reactions[type] || 0) + 1;
      return { ...a, reactions, userReaction: type };
    }));
  };

  return (
    <View style={s.flex}>
      {/* Compose */}
      <View style={s.compose}>
        <Avatar src={user?.thumbnail} name={user?.name || '?'} size={36} />
        <TextInput
          value={newPost}
          onChangeText={setNewPost}
          placeholder="Share something with the community…"
          placeholderTextColor={colors.textLight}
          style={s.composeInput}
          multiline
        />
        <TouchableOpacity onPress={handlePost} disabled={posting || !newPost.trim()} style={s.postBtn}>
          <Text style={[s.postBtnText, (!newPost.trim() || posting) && { opacity: 0.4 }]}>Post</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={announcements}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <AnnouncementCard
            item={item}
            userId={user?.id || ''}
            onDelete={handleDelete}
            onReact={handleReact}
          />
        )}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.brand} />}
        ListFooterComponent={loading && !refreshing ? <ActivityIndicator color={colors.brand} style={{ margin: 20 }} /> : null}
        contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  compose: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    padding: 12, backgroundColor: colors.surface,
    borderBottomWidth: 1.5, borderBottomColor: colors.border,
  },
  composeInput: {
    flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: 12,
    padding: 10, fontSize: 14, color: colors.text, maxHeight: 80,
    backgroundColor: colors.bg,
  },
  postBtn: { paddingBottom: 10 },
  postBtnText: { color: colors.brand, fontWeight: '700', fontSize: 15 },
  card: {
    backgroundColor: colors.surface, borderRadius: 14,
    padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  authorName: { fontWeight: '700', fontSize: 14, color: colors.text },
  time: { fontSize: 12, color: colors.textMuted },
  dots: { fontSize: 18, color: colors.textMuted, paddingHorizontal: 4 },
  content: { fontSize: 14, color: colors.text, lineHeight: 21, marginBottom: 10 },
  media: { width: '100%', height: 200, borderRadius: 10, marginBottom: 10 },
  reactionSummary: { fontSize: 13, color: colors.textMuted, marginBottom: 8 },
  actions: { flexDirection: 'row', gap: 16 },
  actionBtn: { paddingVertical: 4 },
  actionText: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  reactionPicker: {
    position: 'absolute', bottom: 32, left: 0,
    flexDirection: 'row', gap: 4,
    backgroundColor: colors.surface, borderRadius: 24,
    padding: 8, shadowColor: '#000', shadowOpacity: 0.12,
    shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 6,
    zIndex: 10,
  },
  reactionOpt: { padding: 4 },
  reactionEmoji: { fontSize: 22 },
});
