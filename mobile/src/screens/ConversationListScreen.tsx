import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { formatDistanceToNow } from 'date-fns';
import { MessagesStackParamList, Conversation, User } from '../types';
import { messageService, userService } from '../services';
import { Avatar } from '../components/Avatar';
import { colors } from '../constants/colors';

type Props = NativeStackScreenProps<MessagesStackParamList, 'ConversationList'>;

export const ConversationListScreen: React.FC<Props> = ({ navigation }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await messageService.getConversations();
      setConversations(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const t = setTimeout(() => {
      userService.search(searchQuery).then(setSearchResults);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const openConversation = (partnerId: string, partnerName: string, partnerThumbnail: string | null) => {
    setSearchQuery('');
    setSearchResults([]);
    navigation.navigate('Chat', { partnerId, partnerName, partnerThumbnail });
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.brand} />;

  return (
    <View style={s.flex}>
      {/* Search */}
      <View style={s.searchWrap}>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search members to message…"
          placeholderTextColor={colors.textLight}
          style={s.searchInput}
        />
      </View>

      {searchResults.length > 0 && (
        <View style={s.searchResults}>
          {searchResults.map(u => (
            <TouchableOpacity
              key={u.id}
              style={s.searchItem}
              onPress={() => openConversation(u.id, u.name, u.thumbnail)}
            >
              <Avatar src={u.thumbnail} name={u.name} size={36} />
              <View style={{ marginLeft: 10 }}>
                <Text style={s.resultName}>{u.name}</Text>
                <Text style={s.resultSub}>{u.city}, {u.state}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FlatList
        data={conversations}
        keyExtractor={c => c.partner_id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={colors.brand} />}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 80 }}>
            <Text style={{ fontSize: 36 }}>💬</Text>
            <Text style={{ color: colors.textMuted, marginTop: 12 }}>No conversations yet</Text>
            <Text style={{ color: colors.textLight, fontSize: 13, marginTop: 4 }}>Search for a member above</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.convItem}
            onPress={() => openConversation(item.partner_id, item.partner_name, item.partner_thumbnail)}
          >
            <View>
              <Avatar src={item.partner_thumbnail} name={item.partner_name} size={48} />
              {item.unread_count > 0 && (
                <View style={s.badge}>
                  <Text style={s.badgeText}>{item.unread_count}</Text>
                </View>
              )}
            </View>
            <View style={s.convContent}>
              <View style={s.convHeader}>
                <Text style={[s.convName, item.unread_count > 0 && s.convNameBold]}>{item.partner_name}</Text>
                <Text style={s.convTime}>
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                </Text>
              </View>
              <Text style={[s.convPreview, item.unread_count > 0 && s.convPreviewBold]} numberOfLines={1}>
                {item.content || 'Start a conversation'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ flexGrow: 1 }}
      />
    </View>
  );
};

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  searchWrap: { padding: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  searchInput: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 10,
    padding: 10, fontSize: 14, color: colors.text, backgroundColor: colors.bg,
  },
  searchResults: {
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  searchItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  resultName: { fontWeight: '600', fontSize: 14, color: colors.text },
  resultSub: { fontSize: 12, color: colors.textMuted },
  convItem: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  badge: {
    position: 'absolute', top: -2, right: -2,
    backgroundColor: colors.brand, borderRadius: 8,
    minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  convContent: { flex: 1, marginLeft: 12 },
  convHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  convName: { fontSize: 15, color: colors.text },
  convNameBold: { fontWeight: '700' },
  convTime: { fontSize: 11, color: colors.textMuted },
  convPreview: { fontSize: 13, color: colors.textMuted },
  convPreviewBold: { color: colors.text, fontWeight: '600' },
});
