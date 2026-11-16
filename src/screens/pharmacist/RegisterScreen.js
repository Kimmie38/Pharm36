import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { spacing, type, radius } from '../../theme/theme';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../api/client';
import { apiErrorMessage, showMessage } from '../../utils/ui';
import { professionalTypes as fallbackTypes } from '../../data/mockData';

const FALLBACK_STATES = ['Lagos', 'Abuja (FCT)', 'Rivers', 'Oyo', 'Kano', 'Enugu', 'Kaduna', 'Delta'];

export default function RegisterScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { register } = useAuth();
  const [meta, setMeta] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', location: '', state: '', storeName: '', licenseNo: '', password: '', confirmPassword: '' });
  const [professionKey, setProfessionKey] = useState('pharmacist');
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showStates, setShowStates] = useState(false);

  useEffect(() => {
    let active = true;
    api.get('meta', undefined, { auth: false }).then((result) => {
      if (active) setMeta(result);
    }).catch((error) => showMessage('Could not load registration options', apiErrorMessage(error)));
    return () => { active = false; };
  }, []);

  const professionMap = meta?.professionalTypes || fallbackTypes;
  const profession = professionMap[professionKey] || fallbackTypes[professionKey];
  const states = meta?.states?.length ? meta.states : FALLBACK_STATES;
  const update = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));

  const selectProfession = (key) => {
    setProfessionKey(key);
    setSections([]);
  };

  const toggleSection = (key) => setSections((current) => current.includes(key)
    ? current.filter((section) => section !== key)
    : [...current, key]);

  const handleRegister = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim() || !form.location.trim() || !form.state || !form.password) {
      return showMessage('Missing details', 'Complete your name, phone, email, address, state, and password.');
    }
    if (form.password !== form.confirmPassword) return showMessage('Passwords do not match', 'Enter the same password in both password fields.');
    setLoading(true);
    try {
      const user = await register({
        professionalType: professionKey,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        location: form.location.trim(),
        state: form.state,
        storeName: form.storeName.trim() || undefined,
        licenseNo: form.licenseNo.trim() || undefined,
        sections,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      if (user?.role === 'professional') {
        navigation.getParent()?.reset({ index: 0, routes: [{ name: 'PharmacistApp' }] });
      } else {
        showMessage('Account type unavailable', 'This mobile app currently supports professional accounts.');
      }
    } catch (error) {
      showMessage('Could not create account', apiErrorMessage(error));
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
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Your details are submitted to {profession.council} for verification.</Text>

        <View style={{ marginTop: spacing.lg, width: '100%' }}>
          <Text style={styles.label}>I am a</Text>
          <View style={styles.professionRow}>
            {Object.values(professionMap).map((item) => {
              const active = item.key === professionKey;
              return (
                <Pressable key={item.key} onPress={() => selectProfession(item.key)} style={[styles.professionCard, active && styles.professionCardActive]}>
                  <Ionicons name={item.key === 'pharmacist' ? 'medkit-outline' : 'paw-outline'} size={20} color={active ? colors.greenLight : colors.textMuted} />
                  <Text style={[styles.professionLabel, active && { color: colors.textPrimary }]}>{item.label}</Text>
                  <Text style={styles.professionSub}>{item.councilShort}</Text>
                </Pressable>
              );
            })}
          </View>

          <Input label="Full name" placeholder="e.g. Adaeze Okonkwo" value={form.name} onChangeText={update('name')} icon="person-outline" />
          <Input label="Phone number" placeholder="+234 800 000 0000" value={form.phone} onChangeText={update('phone')} icon="call-outline" keyboardType="phone-pad" />
          <Input label="Email address" placeholder="you@pharmacy.com" value={form.email} onChangeText={update('email')} icon="mail-outline" autoCapitalize="none" keyboardType="email-address" />
          <Input label={professionKey === 'veterinary' ? 'Practice location (address)' : 'Store location (address)'} placeholder="e.g. 14 Herbert Macaulay Way, Yaba" value={form.location} onChangeText={update('location')} icon="location-outline" />
          <Input label={professionKey === 'veterinary' ? 'Practice name (optional)' : 'Store name (optional)'} placeholder="Your pharmacy / practice name" value={form.storeName} onChangeText={update('storeName')} icon="business-outline" />
          <Input label="License number (optional)" placeholder="PCN / VCN license number" value={form.licenseNo} onChangeText={update('licenseNo')} icon="ribbon-outline" />

          <Text style={styles.label}>State</Text>
          <Pressable style={styles.selectField} onPress={() => setShowStates(!showStates)}>
            <Ionicons name="map-outline" size={18} color={form.state ? colors.greenLight : colors.textMuted} style={{ marginRight: 10 }} />
            <Text style={[styles.selectText, !form.state && { color: colors.textMuted }]}>{form.state || 'Select a state'}</Text>
            <Ionicons name={showStates ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
          </Pressable>
          {showStates && (
            <View style={styles.stateList}>
              <ScrollView style={{ maxHeight: 240 }} nestedScrollEnabled>
                {states.map((state) => (
                  <Pressable key={state} style={styles.stateItem} onPress={() => { update('state')(state); setShowStates(false); }}>
                    <Text style={styles.stateItemText}>{state}</Text>
                    {form.state === state && <Ionicons name="checkmark" size={18} color={colors.greenLight} />}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          <Text style={styles.label}>Which sections are you registered under?</Text>
          <Text style={styles.sectionHint}>Select every license/permit {profession.councilShort} has issued you. Restricted drug categories remain locked until the council confirms them.</Text>
          <View style={{ gap: spacing.sm, marginBottom: spacing.md }}>
            {profession.sections.map((section) => {
              const checked = sections.includes(section.key);
              return (
                <Pressable key={section.key} onPress={() => toggleSection(section.key)} style={[styles.sectionRow, checked && styles.sectionRowActive]}>
                  <View style={[styles.checkbox, checked && styles.checkboxActive]}>
                    {checked && <Ionicons name="checkmark" size={14} color="#06110D" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sectionLabel}>{section.label}</Text>
                    <Text style={styles.sectionDesc}>{section.description}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Input label="Password" placeholder="Create a password (8+ characters)" value={form.password} onChangeText={update('password')} icon="lock-closed-outline" secureTextEntry />
          <Input label="Confirm password" placeholder="Re-enter password" value={form.confirmPassword} onChangeText={update('confirmPassword')} icon="lock-closed-outline" secureTextEntry />
          <View style={styles.noticeBox}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.greenLight} />
            <Text style={styles.noticeText}>We'll check your license with {profession.councilShort} in the background. You can start using Pharm36 right away, but restricted categories stay locked until the council confirms your sections.</Text>
          </View>
          <Button label="Create Account" onPress={handleRegister} loading={loading} style={{ marginTop: spacing.sm }} />
          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Already have an account? </Text>
            <Pressable onPress={() => navigation.navigate('Login')}><Text style={styles.signupLink}>Log in</Text></Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingTop: 70, paddingBottom: 48 },
  backBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.bgElevated2, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  title: { color: colors.textPrimary, ...type.h1 },
  subtitle: { color: colors.textSecondary, ...type.body, marginTop: 8, lineHeight: 20 },
  label: { color: colors.textSecondary, ...type.small, marginBottom: 6, fontWeight: '600' },
  professionRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  professionCard: { flex: 1, alignItems: 'flex-start', gap: 4, padding: spacing.md, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.bgElevated2 },
  professionCardActive: { borderColor: colors.green, backgroundColor: 'rgba(31,174,116,0.1)' },
  professionLabel: { color: colors.textSecondary, fontSize: 13.5, fontWeight: '700', marginTop: 4 },
  professionSub: { color: colors.textMuted, fontSize: 11 },
  selectField: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgElevated2, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, height: 52, marginBottom: spacing.sm },
  selectText: { flex: 1, color: colors.textPrimary, ...type.body, fontSize: 15 },
  stateList: { backgroundColor: colors.bgElevated2, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md, overflow: 'hidden' },
  stateItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.border },
  stateItemText: { color: colors.textPrimary, fontSize: 14 },
  sectionHint: { color: colors.textMuted, fontSize: 11.5, lineHeight: 16, marginBottom: spacing.sm, marginTop: -2 },
  sectionRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', padding: spacing.md, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.bgElevated2 },
  sectionRowActive: { borderColor: colors.green, backgroundColor: 'rgba(31,174,116,0.08)' },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: colors.textMuted, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkboxActive: { backgroundColor: colors.greenLight, borderColor: colors.greenLight },
  sectionLabel: { color: colors.textPrimary, fontSize: 13.5, fontWeight: '700' },
  sectionDesc: { color: colors.textMuted, fontSize: 11.5, marginTop: 2, lineHeight: 15 },
  noticeBox: { flexDirection: 'row', gap: 10, backgroundColor: 'rgba(31,174,116,0.1)', padding: spacing.md, borderRadius: radius.md, marginTop: spacing.sm, marginBottom: spacing.lg, alignItems: 'flex-start' },
  noticeText: { flex: 1, color: colors.textSecondary, ...type.small, lineHeight: 18 },
  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  signupText: { color: colors.textSecondary, ...type.small },
  signupLink: { color: colors.greenLight, ...type.small, fontWeight: '700' },
});
