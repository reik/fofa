import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { authService } from '../../services';
import { colors } from '../../constants/colors';

export const ForgotPasswordScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      await authService.forgotPassword(email.trim());
      setSent(true);
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <View style={styles.center}>
        <Text style={styles.emoji}>📨</Text>
        <Text style={styles.doneTitle}>Check your inbox</Text>
        <Text style={styles.doneMsg}>If {email} is registered, you'll receive a password reset link shortly.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.desc}>Enter the email address for your account and we'll send a reset link.</Text>
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        placeholderTextColor={colors.textLight}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.btnText}>{loading ? 'Sending…' : 'Send Reset Link'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: colors.bg },
  desc: { fontSize: 14, color: colors.textMuted, marginBottom: 20, lineHeight: 20 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 10,
    padding: 12, fontSize: 15, color: colors.text,
    backgroundColor: colors.surface, marginBottom: 20,
  },
  btn: {
    backgroundColor: colors.brand, borderRadius: 12,
    padding: 14, alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  emoji: { fontSize: 52, marginBottom: 16 },
  doneTitle: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 10 },
  doneMsg: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
});
