import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { spacing, type } from '../../theme/theme';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../api/client';
import { apiErrorMessage, showMessage } from '../../utils/ui';

export default function LoginScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStarted, setResetStarted] = useState(false);

  const enterApp = (user) => {
    if (user?.role !== 'professional') {
      showMessage('Account type unavailable', 'This mobile app currently supports professional accounts.');
      return;
    }
    navigation.getParent()?.reset({ index: 0, routes: [{ name: 'PharmacistApp' }] });
  };

  const handleLogin = async () => {
    if (!identifier.trim() || !password) return showMessage('Missing details', 'Enter your phone number or email and password.');
    setLoading(true);
    try {
      const user = await login(identifier.trim(), password);
      enterApp(user);
    } catch (error) {
      showMessage('Could not log in', apiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const requestReset = async () => {
    const who = forgotIdentifier.trim() || identifier.trim();
    if (!who) return showMessage('Enter your account', 'Enter the phone number or email associated with your account.');
    setLoading(true);
    try {
      const result = await api.post('auth/forgot-password', { identifier: who }, { auth: false });
      setForgotIdentifier(who);
      setResetStarted(true);
      if (result.devCode) setResetCode(result.devCode);
      showMessage('Reset code requested', result.devCode
        ? `Development reset code: ${result.devCode}`
        : 'If an account exists, a reset code has been sent. If no code arrives, contact your administrator; production delivery must be configured.');
    } catch (error) {
      showMessage('Could not request a reset code', apiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const finishReset = async () => {
    if (!resetCode.trim() || newPassword.length < 8) return showMessage('Check reset details', 'Enter the 6-digit code and a password with at least 8 characters.');
    setLoading(true);
    try {
      await api.post('auth/reset-password', { identifier: forgotIdentifier, code: resetCode.trim(), password: newPassword }, { auth: false });
      setForgotOpen(false);
      setResetStarted(false);
      setPassword('');
      showMessage('Password updated', 'Log in with your new password.');
    } catch (error) {
      showMessage('Could not reset password', apiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Image source={require('../../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Log in to manage your pharmacy</Text>
        <View style={{ marginTop: spacing.xl, width: '100%' }}>
          <Input label="Phone number or email" placeholder="you@pharmacy.com" value={identifier} onChangeText={setIdentifier} icon="person-outline" autoCapitalize="none" />
          <Input label="Password" placeholder="••••••••" value={password} onChangeText={setPassword} icon="lock-closed-outline" secureTextEntry />
          <Pressable style={{ alignSelf: 'flex-end', marginBottom: spacing.lg }} onPress={() => { setForgotIdentifier(identifier); setForgotOpen(true); }}>
            <Text style={styles.forgot}>Forgot password?</Text>
          </Pressable>
          <Button label="Log In" onPress={handleLogin} loading={loading} />
          <View style={styles.signupRow}>
            <Text style={styles.signupText}>New to Pharm36? </Text>
            <Pressable onPress={() => navigation.navigate('Register')}><Text style={styles.signupLink}>Create an account</Text></Pressable>
          </View>
        </View>
      </ScrollView>
      {forgotOpen && (
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Pressable onPress={() => { setForgotOpen(false); setResetStarted(false); }} style={styles.modalClose}><Ionicons name="close" size={22} color={colors.textPrimary} /></Pressable>
            <Text style={styles.modalTitle}>{resetStarted ? 'Choose a new password' : 'Reset your password'}</Text>
            <Input label="Phone number or email" placeholder="Account identifier" value={forgotIdentifier} onChangeText={setForgotIdentifier} autoCapitalize="none" />
            {!resetStarted ? <Button label="Request reset code" onPress={requestReset} loading={loading} /> : (
              <>
                <Input label="6-digit reset code" placeholder="000000" value={resetCode} onChangeText={setResetCode} keyboardType="number-pad" />
                <Input label="New password" placeholder="At least 8 characters" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
                <Button label="Update password" onPress={finishReset} loading={loading} />
              </>
            )}
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingTop: 70, paddingBottom: 40, alignItems: 'center' },
  backBtn: { position: 'absolute', top: 56, left: spacing.lg, width: 34, height: 34, borderRadius: 17, backgroundColor: colors.bgElevated2, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 84, height: 84, marginBottom: spacing.lg, marginTop: spacing.lg },
  title: { color: colors.textPrimary, ...type.h1 },
  subtitle: { color: colors.textSecondary, ...type.body, marginTop: 6 },
  forgot: { color: colors.greenLight, ...type.small, fontWeight: '600' },
  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  signupText: { color: colors.textSecondary, ...type.small },
  signupLink: { color: colors.greenLight, ...type.small, fontWeight: '700' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: spacing.lg },
  modalCard: { backgroundColor: colors.bgElevated, borderColor: colors.border, borderWidth: 1, borderRadius: 20, padding: spacing.lg },
  modalClose: { alignSelf: 'flex-end', padding: 4 },
  modalTitle: { color: colors.textPrimary, ...type.h2, marginBottom: spacing.md },
});
