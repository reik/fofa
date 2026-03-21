import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../store/authStore';
import { userService } from '../services';
import { Avatar } from '../components/Avatar';
import { colors } from '../constants/colors';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
];

export const ProfileScreen: React.FC = () => {
  const { user, setAuth, logout } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [city, setCity] = useState(user?.city || '');
  const [state, setState] = useState(user?.state || 'AL');
  const [thumbnail, setThumbnail] = useState<{ uri: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [stateOpen, setStateOpen] = useState(false);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setThumbnail({ uri: result.assets[0].uri });
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !city.trim()) {
      Alert.alert('Missing Fields', 'Name and city are required.');
      return;
    }
    setSaving(true);
    try {
      const form = new FormData();
      form.append('name', name.trim());
      form.append('city', city.trim());
      form.append('state', state);
      if (thumbnail) {
        form.append('thumbnail', { uri: thumbnail.uri, name: 'photo.jpg', type: 'image/jpeg' } as any);
      }
      const updated = await userService.updateMe(form);
      setAuth(updated, useAuthStore.getState().token!);
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch {
      Alert.alert('Error', 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  const avatarSrc = thumbnail?.uri || user?.thumbnail;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.flex}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        {/* Avatar */}
        <View style={s.avatarSection}>
          <TouchableOpacity onPress={pickPhoto}>
            <Avatar src={avatarSrc} name={name || '?'} size={90} />
            <View style={s.editBadge}><Text style={s.editBadgeText}>✏️</Text></View>
          </TouchableOpacity>
          <Text style={s.email}>{user?.email}</Text>
        </View>

        {/* Form */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Profile Info</Text>

          <Text style={s.label}>Name</Text>
          <TextInput
            value={name} onChangeText={setName} style={s.input}
            placeholder="Your name" placeholderTextColor={colors.textLight}
          />

          <Text style={s.label}>City</Text>
          <TextInput
            value={city} onChangeText={setCity} style={s.input}
            placeholder="Your city" placeholderTextColor={colors.textLight}
          />

          <Text style={s.label}>State</Text>
          <TouchableOpacity style={s.statePicker} onPress={() => setStateOpen(!stateOpen)}>
            <Text style={s.stateText}>{state}</Text>
            <Text style={s.chevron}>▾</Text>
          </TouchableOpacity>
          {stateOpen && (
            <ScrollView style={s.stateDropdown} nestedScrollEnabled>
              {US_STATES.map(st => (
                <TouchableOpacity key={st} style={s.stateOption} onPress={() => { setState(st); setStateOpen(false); }}>
                  <Text style={[s.stateOptionText, state === st && { color: colors.brand, fontWeight: '700' }]}>{st}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
            <Text style={s.saveBtnText}>{saving ? 'Saving…' : 'Save Changes'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Text style={s.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 20, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  editBadge: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: colors.surface, borderRadius: 12,
    padding: 4, borderWidth: 1.5, borderColor: colors.border,
  },
  editBadgeText: { fontSize: 12 },
  email: { fontSize: 13, color: colors.textMuted, marginTop: 8 },
  card: {
    backgroundColor: colors.surface, borderRadius: 16,
    padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 10,
    padding: 12, fontSize: 15, color: colors.text,
    backgroundColor: colors.bg, marginBottom: 14,
  },
  statePicker: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 10,
    padding: 12, backgroundColor: colors.bg, marginBottom: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  stateText: { fontSize: 15, color: colors.text },
  chevron: { color: colors.textMuted },
  stateDropdown: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 10,
    maxHeight: 160, marginBottom: 14, backgroundColor: colors.surface,
  },
  stateOption: { padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  stateOptionText: { fontSize: 14, color: colors.text },
  saveBtn: {
    backgroundColor: colors.brand, borderRadius: 12,
    padding: 14, alignItems: 'center', marginTop: 4,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  logoutBtn: {
    borderWidth: 1.5, borderColor: colors.danger, borderRadius: 12,
    padding: 14, alignItems: 'center',
  },
  logoutText: { color: colors.danger, fontWeight: '700', fontSize: 16 },
});
