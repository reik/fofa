import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { User, MainTabParamList } from '../types';
import { userService } from '../services';
import { Avatar } from '../components/Avatar';
import { colors } from '../constants/colors';

export const CommunityScreen: React.FC = () => {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await userService.search(query);
        setResults(data);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const handleMessage = (u: User) => {
    // Navigate to Messages tab, then to Chat. We use a workaround since
    // cross-tab deep navigation requires passing params via the tab navigator.
    navigation.navigate('Messages', undefined);
    // The ChatScreen will be opened from ConversationListScreen.
    // For a better UX, this could be improved with navigation state manipulation.
  };

  return (
    <View style={s.flex}>
      <View style={s.searchWrap}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name, city, or state…"
          placeholderTextColor={colors.textLight}
          style={s.input}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {query.trim() === '' ? (
        <View style={s.empty}>
          <Text style={s.emptyEmoji}>🌱</Text>
          <Text style={s.emptyTitle}>Find your community</Text>
          <Text style={s.emptyDesc}>Search for foster families by name, city, or state.</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={u => u.id}
          contentContainerStyle={{ padding: 12, flexGrow: 1 }}
          ListEmptyComponent={
            !searching ? (
              <View style={s.empty}>
                <Text style={s.emptyDesc}>No members found for "{query}"</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={s.card}>
              <Avatar src={item.thumbnail} name={item.name} size={50} />
              <View style={s.info}>
                <Text style={s.name}>{item.name}</Text>
                <Text style={s.location}>{item.city}, {item.state}</Text>
              </View>
              <TouchableOpacity style={s.msgBtn} onPress={() => handleMessage(item)}>
                <Text style={s.msgBtnText}>Message</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  searchWrap: {
    padding: 12, backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  input: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 10,
    padding: 10, fontSize: 14, color: colors.text, backgroundColor: colors.bg,
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 12,
    padding: 12, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  info: { flex: 1, marginLeft: 12 },
  name: { fontWeight: '700', fontSize: 15, color: colors.text },
  location: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  msgBtn: {
    backgroundColor: colors.brandLight, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  msgBtnText: { color: colors.brand, fontWeight: '700', fontSize: 13 },
});
