import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, Modal, Alert, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { FamilyMember } from '../types';
import { familyService } from '../services';
import { Avatar } from '../components/Avatar';
import { colors } from '../constants/colors';

function MemberForm({
  member, onSave, onClose,
}: {
  member?: FamilyMember;
  onSave: (form: FormData) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(member?.name || '');
  const [age, setAge] = useState(member?.age?.toString() || '');
  const [thumbnail, setThumbnail] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0];
      setThumbnail({ uri: a.uri, name: 'photo.jpg', type: 'image/jpeg' });
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !age.trim()) {
      Alert.alert('Missing Fields', 'Please enter a name and age.');
      return;
    }
    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 120) {
      Alert.alert('Invalid Age', 'Please enter a valid age.');
      return;
    }
    setSaving(true);
    const form = new FormData();
    form.append('name', name.trim());
    form.append('age', ageNum.toString());
    if (thumbnail) {
      form.append('thumbnail', { uri: thumbnail.uri, name: thumbnail.name, type: thumbnail.type } as any);
    }
    try {
      await onSave(form);
      onClose();
    } catch {
      Alert.alert('Error', 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const avatarSrc = thumbnail ? thumbnail.uri : member?.thumbnail;
  const avatarName = name || 'New Member';

  return (
    <View style={fs.container}>
      <View style={fs.header}>
        <Text style={fs.title}>{member ? 'Edit Member' : 'Add Family Member'}</Text>
        <TouchableOpacity onPress={onClose}><Text style={fs.close}>✕</Text></TouchableOpacity>
      </View>

      <TouchableOpacity onPress={pickImage} style={fs.avatarWrap}>
        <Avatar src={avatarSrc} name={avatarName} size={80} />
        <Text style={fs.photoHint}>Tap to change photo</Text>
      </TouchableOpacity>

      <Text style={fs.label}>Name</Text>
      <TextInput
        value={name} onChangeText={setName} placeholder="Family member's name"
        placeholderTextColor={colors.textLight} style={fs.input}
      />

      <Text style={fs.label}>Age</Text>
      <TextInput
        value={age} onChangeText={setAge} placeholder="Age"
        placeholderTextColor={colors.textLight} style={fs.input}
        keyboardType="number-pad"
      />

      <TouchableOpacity style={[fs.btn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
        <Text style={fs.btnText}>{saving ? 'Saving…' : 'Save'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const fs = StyleSheet.create({
  container: { padding: 24, flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  close: { fontSize: 20, color: colors.textMuted },
  avatarWrap: { alignItems: 'center', marginBottom: 20 },
  photoHint: { fontSize: 12, color: colors.brand, marginTop: 6 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 10,
    padding: 12, fontSize: 15, color: colors.text,
    backgroundColor: colors.bg, marginBottom: 14,
  },
  btn: {
    backgroundColor: colors.brand, borderRadius: 12,
    padding: 14, alignItems: 'center', marginTop: 8,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export const FamilyScreen: React.FC = () => {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<FamilyMember | undefined>();

  const load = () => familyService.getAll().then(setMembers).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(undefined); setModalVisible(true); };
  const openEdit = (m: FamilyMember) => { setEditing(m); setModalVisible(true); };

  const handleSave = async (form: FormData) => {
    if (editing) {
      const updated = await familyService.update(editing.id, form);
      setMembers(prev => prev.map(m => m.id === editing.id ? updated : m));
    } else {
      const created = await familyService.create(form);
      setMembers(prev => [...prev, created]);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Remove Member', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          await familyService.remove(id);
          setMembers(prev => prev.filter(m => m.id !== id));
        },
      },
    ]);
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.brand} />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={members}
        keyExtractor={m => m.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 12 }}
        contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Text style={{ fontSize: 40 }}>👨‍👩‍👧</Text>
            <Text style={{ fontSize: 16, color: colors.textMuted, marginTop: 12 }}>No family members yet</Text>
            <Text style={{ fontSize: 13, color: colors.textLight, marginTop: 4 }}>Tap + to add one</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => openEdit(item)}>
            <Avatar src={item.thumbnail} name={item.name} size={64} />
            <Text style={s.memberName} numberOfLines={1}>{item.name}</Text>
            <Text style={s.memberAge}>Age {item.age}</Text>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={s.deleteBtn}>
              <Text style={s.deleteText}>Remove</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={s.fab} onPress={openAdd}>
        <Text style={s.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <MemberForm member={editing} onSave={handleSave} onClose={() => setModalVisible(false)} />
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  card: {
    flex: 0.48, backgroundColor: colors.surface, borderRadius: 14,
    padding: 14, alignItems: 'center', marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  memberName: { fontWeight: '700', fontSize: 14, color: colors.text, marginTop: 8, textAlign: 'center' },
  memberAge: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  deleteBtn: { marginTop: 8 },
  deleteText: { fontSize: 12, color: colors.danger },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    backgroundColor: colors.brand, width: 56, height: 56,
    borderRadius: 28, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32 },
});
