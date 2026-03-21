import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { authService } from '../../services';
import { colors } from '../../constants/colors';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
];

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', city: '', state: 'AL' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [stateOpen, setStateOpen] = useState(false);

  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password || !form.city) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }
    if (form.password !== form.confirm) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await authService.register({
        name: form.name.trim(), email: form.email.trim(),
        password: form.password, city: form.city.trim(), state: form.state,
      });
      setDone(true);
    } catch (err: any) {
      Alert.alert('Registration Failed', err.response?.data?.error || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <View style={styles.doneContainer}>
        <Text style={styles.doneEmoji}>📬</Text>
        <Text style={styles.doneTitle}>Check your email</Text>
        <Text style={styles.doneMsg}>We sent a verification link to {form.email}. Click it to activate your account.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.btnText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>Create your account</Text>

          {([
            ['name', 'Full Name', 'John Doe', false, 'words'] as const,
            ['email', 'Email', 'you@example.com', false, 'email-address'] as const,
            ['password', 'Password', '••••••••', true, 'default'] as const,
            ['confirm', 'Confirm Password', '••••••••', true, 'default'] as const,
            ['city', 'City', 'Springfield', false, 'words'] as const,
          ]).map(([key, label, placeholder, secure, kbType]) => (
            <View key={key}>
              <Text style={styles.label}>{label}</Text>
              <TextInput
                style={styles.input}
                value={form[key]}
                onChangeText={set(key)}
                placeholder={placeholder}
                placeholderTextColor={colors.textLight}
                secureTextEntry={secure}
                keyboardType={kbType as any}
                autoCapitalize={key === 'email' ? 'none' : 'words'}
                autoCorrect={false}
              />
            </View>
          ))}

          <Text style={styles.label}>State</Text>
          <TouchableOpacity style={styles.statePicker} onPress={() => setStateOpen(!stateOpen)}>
            <Text style={styles.stateText}>{form.state}</Text>
            <Text style={styles.stateChevron}>▾</Text>
          </TouchableOpacity>
          {stateOpen && (
            <ScrollView style={styles.stateDropdown} nestedScrollEnabled>
              {US_STATES.map(s => (
                <TouchableOpacity key={s} style={styles.stateOption} onPress={() => { set('state')(s); setStateOpen(false); }}>
                  <Text style={[styles.stateOptionText, form.state === s && { color: colors.brand, fontWeight: '700' }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleRegister} disabled={loading}>
            <Text style={styles.btnText}>{loading ? 'Creating account…' : 'Create Account'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, padding: 20 },
  card: {
    backgroundColor: colors.surface, borderRadius: 20,
    padding: 24, shadowColor: '#000', shadowOpacity: 0.06,
    shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 20 },
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
  stateChevron: { color: colors.textMuted },
  stateDropdown: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 10,
    maxHeight: 180, marginBottom: 14, backgroundColor: colors.surface,
  },
  stateOption: { padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  stateOptionText: { fontSize: 14, color: colors.text },
  btn: {
    backgroundColor: colors.brand, borderRadius: 12,
    padding: 14, alignItems: 'center', marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  doneContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: colors.bg },
  doneEmoji: { fontSize: 56, marginBottom: 16 },
  doneTitle: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 10 },
  doneMsg: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
});
