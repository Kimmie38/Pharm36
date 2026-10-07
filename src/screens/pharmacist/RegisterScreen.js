import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { spacing, type, radius } from '../../theme/theme';
import { useTheme } from '../../theme/ThemeContext';
import { professionalTypes } from '../../data/mockData';

const NIGERIAN_STATES = ['Lagos', 'Abuja (FCT)', 'Rivers', 'Oyo', 'Kano', 'Enugu', 'Kaduna', 'Delta'];

export default function RegisterScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [form, setForm] = useState({
    name: '', phone: '', email: '', location: '', state: '', password: '', confirm: '',
  });
  const [professionKey, setProfessionKey] = useState('pharmacist');
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showStates, setShowStates] = useState(false);

  const profession = professionalTypes[professionKey];
  const update = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const selectProfession = (key) => {
    setProfessionKey(key);
    setSections([]); // sections are specific to each profession — reset on switch
  };

  const toggleSection = (key) => {
    setSections((prev) => (prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]));
  };

  const handleRegister = () => {
    setLoading(true);
    // Details (including chosen professional type & sections) are submitted to
    // the relevant council admin in the background for verification.
    // The professional gets full access immediately — no "pending" screen is shown.
    setTimeout(() => {
      setLoading(false);
      navigation.replace('PharmacistApp');
    }, 1100);
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
            {Object.values(professionalTypes).map((p) => {
              const active = p.key === professionKey;
              return (
                <Pressable key={p.key} onPress={() => selectProfession(p.key)} style={[styles.professionCard, active && styles.professionCardActive]}>
                  <Ionicons
                    name={p.key === 'pharmacist' ? 'medkit-outline' : 'paw-outline'}
                    size={20}
                    color={active ? colors.greenLight : colors.textMuted}
                  />
                  <Text style={[styles.professionLabel, active && { color: colors.textPrimary }]}>{p.label}</Text>
                  <Text style={styles.professionSub}>{p.councilShort}</Text>
                </Pressable>
              );
            })}
          </View>

          <Input label="Full name" placeholder="e.g. Adaeze Okonkwo" value={form.name} onChangeText={update('name')} icon="person-outline" />
          <Input label="Phone number" placeholder="+234 800 000 0000" value={form.phone} onChangeText={update('phone')} icon="call-outline" keyboardType="phone-pad" />
          <Input label="Email address" placeholder="you@pharmacy.com" value={form.email} onChangeText={update('email')} icon="mail-outline" autoCapitalize="none" keyboardType="email-address" />
          <Input label={professionKey === 'veterinary' ? 'Practice location (address)' : 'Store location (address)'} placeholder="e.g. 14 Herbert Macaulay Way, Yaba" value={form.location} onChangeText={update('location')} icon="location-outline" />

          <Text style={styles.label}>State</Text>
          <Pressable style={styles.selectField} onPress={() => setShowStates(!showStates)}>
            <Ionicons name="map-outline" size={18} color={form.state ? colors.greenLight : colors.textMuted} style={{ marginRight: 10 }} />
            <Text style={[styles.selectText, !form.state && { color: colors.textMuted }]}>
              {form.state || 'Select a state'}
            </Text>
            <Ionicons name={showStates ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
          </Pressable>
          {showStates && (
            <View style={styles.stateList}>
              {NIGERIAN_STATES.map((s) => (
                <Pressable key={s} style={styles.stateItem} onPress={() => { update('state')(s); setShowStates(false); }}>
                  <Text style={styles.stateItemText}>{s}</Text>
                  {form.state === s && <Ionicons name="checkmark" size={18} color={colors.greenLight} />}
                </Pressable>
              ))}
            </View>
          )}

          <Text style={styles.label}>Which sections are you registered under?</Text>
          <Text style={styles.sectionHint}>Select every license/permit {profession.councilShort} has issued you. Drug categories outside these sections won't be addable to your inventory.</Text>
          <View style={{ gap: spacing.sm, marginBottom: spacing.md }}>
            {profession.sections.map((s) => {
              const checked = sections.includes(s.key);
              return (
                <Pressable key={s.key} onPress={() => toggleSection(s.key)} style={[styles.sectionRow, checked && styles.sectionRowActive]}>
                  <View style={[styles.checkbox, checked && styles.checkboxActive]}>
                    {checked && <Ionicons name="checkmark" size={14} color="#06110D" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sectionLabel}>{s.label}</Text>
                    <Text style={styles.sectionDesc}>{s.description}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Input label="Password" placeholder="Create a password" value={form.password} onChangeText={update('password')} icon="lock-closed-outline" secureTextEntry />
          <Input label="Confirm password" placeholder="Re-enter password" value={form.confirm} onChangeText={update('confirm')} icon="lock-closed-outline" secureTextEntry />

          <View style={styles.noticeBox}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.greenLight} />
            <Text style={styles.noticeText}>
              We'll check your license with {profession.councilShort} in the background. You can start using Pharm36 right away — but drug categories outside the sections you selected will stay locked until {profession.councilShort} confirms them.
            </Text>
          </View>

          <Button label="Create Account" onPress={handleRegister} loading={loading} style={{ marginTop: spacing.sm }} />

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Already have an account? </Text>
            <Pressable onPress={() => navigation.navigate('Login')}>
              <Text style={styles.signupLink}>Log in</Text>
            </Pressable>
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
  professionCard: {
    flex: 1, alignItems: 'flex-start', gap: 4, padding: spacing.md, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.bgElevated2,
  },
  professionCardActive: { borderColor: colors.green, backgroundColor: 'rgba(31,174,116,0.1)' },
  professionLabel: { color: colors.textSecondary, fontSize: 13.5, fontWeight: '700', marginTop: 4 },
  professionSub: { color: colors.textMuted, fontSize: 11 },
  selectField: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgElevated2,
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.md, height: 52, marginBottom: spacing.sm,
  },
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
