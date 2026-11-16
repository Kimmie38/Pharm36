import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Card from '../../components/Card';
import { spacing, type, radius } from '../../theme/theme';
import { useTheme } from '../../theme/ThemeContext';
import { api } from '../../api/client';
import { apiErrorMessage } from '../../utils/ui';

export default function UserHomeScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const search = async () => {
    const term = query.trim();
    if (term.length < 2) { setError('Enter at least 2 characters to search.'); return; }
    setLoading(true);
    setError('');
    try {
      if (/^[a-z\d-]{3,64}$/i.test(term) && /\d/.test(term)) {
        navigation.navigate('DrugInfo', { batchCode: term });
        return;
      }
      const result = await api.get('public/drugs/search', { q: term, limit: 20 }, { auth: false });
      setResults(result.items || []);
      if (!result.items?.length) setError('No matching registered batches found.');
    } catch (e) { setError(apiErrorMessage(e)); }
    finally { setLoading(false); }
  };


  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Pressable onPress={() => navigation.getParent()?.goBack()} hitSlop={10}><Ionicons name="chevron-back" size={22} color={colors.textPrimary} /></Pressable>
        <Text style={styles.headerTitle}>Check a drug</Text><View style={{ width: 22 }} />
      </View>
      <Text style={styles.lead}>Check a batch against records submitted by registered professionals. This is one safety signal, not laboratory authentication.</Text>
      <Pressable onPress={() => navigation.navigate('ScanDrug')}>
        <LinearGradient colors={[colors.tealDeep, colors.green]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.scanCard}>
          <View style={styles.scanIconWrap}><Ionicons name="barcode-outline" size={28} color="#fff" /></View>
          <View style={{ flex: 1 }}><Text style={styles.scanTitle}>Enter batch code</Text><Text style={styles.scanSub}>Camera scanning is not connected yet</Text></View>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </LinearGradient>
      </Pressable>
      <View style={styles.orRow}><View style={styles.line} /><Text style={styles.orText}>or search by name</Text><View style={styles.line} /></View>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput value={query} onChangeText={setQuery} onSubmitEditing={search} placeholder="e.g. Amoxicillin, Paracetamol..." placeholderTextColor={colors.textMuted} style={styles.searchInput} returnKeyType="search" />
        <Pressable onPress={search} disabled={loading}><Ionicons name="arrow-forward-circle" size={26} color={colors.greenLight} /></Pressable>
      </View>
      {loading && <ActivityIndicator color={colors.greenLight} style={{ marginTop: spacing.md }} />}
      {!!error && <Text style={styles.error}>{error}</Text>}
      {results.length > 0 && <Text style={styles.sectionTitle}>Registered batch matches</Text>}
      {results.map((item) => <Pressable key={item.batchCode} onPress={() => navigation.navigate('DrugInfo', { batchCode: item.batchCode })}>
        <Card style={styles.resultCard}><View style={styles.recentIcon}><Ionicons name="medical-outline" size={18} color={colors.greenLight} /></View><View style={{ flex: 1 }}><Text style={styles.recentName}>{item.name}{item.strength ? ` ${item.strength}` : ''}</Text><Text style={styles.recentDate}>Batch {item.batchCode} · Expires {String(item.expiryDate).slice(0, 10)}</Text><Text style={styles.recentDate}>{item.registeredPharmacy}</Text></View><Ionicons name="chevron-forward" size={18} color={colors.textMuted} /></Card>
      </Pressable>)}
      {query.trim().length >= 2 && !(/^[a-z\d-]{3,64}$/i.test(query.trim()) && /\d/.test(query.trim())) ? (
        <Pressable style={styles.infoSearch} onPress={() => navigation.navigate('DrugInfo', { name: query.trim() })}>
          <View style={{ flex: 1 }}><Text style={styles.recentName}>Read official label information</Text><Text style={styles.recentDate}>{query.trim()}</Text></View>
          <Ionicons name="chevron-forward" size={18} color={colors.greenLight} />
        </Pressable>
      ) : null}
      <View style={styles.aiNote}><Ionicons name="information-circle-outline" size={16} color={colors.info} /><Text style={styles.aiNoteText}>The check looks for matching pharmacist-submitted records and flags inconsistent expiry dates. Always inspect the pack seal and consult a pharmacist.</Text></View>
    </ScrollView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: 60, paddingBottom: spacing.sm }, headerTitle: { color: colors.textPrimary, ...type.h2 }, lead: { color: colors.textSecondary, ...type.body, paddingHorizontal: spacing.lg, marginTop: 6, marginBottom: spacing.lg, lineHeight: 20 },
  scanCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginHorizontal: spacing.lg, padding: spacing.lg, borderRadius: radius.lg }, scanIconWrap: { width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }, scanTitle: { color: '#fff', ...type.h3 }, scanSub: { color: 'rgba(255,255,255,0.85)', ...type.small, marginTop: 3 },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: spacing.lg, marginVertical: spacing.lg }, line: { flex: 1, height: 1, backgroundColor: colors.border }, orText: { color: colors.textMuted, fontSize: 12 }, searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.bgElevated2, marginHorizontal: spacing.lg, borderRadius: radius.md, paddingHorizontal: spacing.md, height: 50, borderWidth: 1, borderColor: colors.border }, searchInput: { flex: 1, color: colors.textPrimary, fontSize: 14 }, error: { color: colors.danger, fontSize: 12, marginHorizontal: spacing.lg, marginTop: spacing.md }, sectionTitle: { color: colors.textPrimary, ...type.h3, marginHorizontal: spacing.lg, marginTop: spacing.xl, marginBottom: spacing.sm }, resultCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginHorizontal: spacing.lg, marginBottom: spacing.sm }, recentIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(31,174,116,0.12)', alignItems: 'center', justifyContent: 'center' }, recentName: { color: colors.textPrimary, fontSize: 13.5, fontWeight: '600' }, recentDate: { color: colors.textMuted, fontSize: 11.5, marginTop: 2 }, infoSearch: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: spacing.lg, marginTop: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgElevated }, aiNote: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: 'rgba(61,169,232,0.1)', marginHorizontal: spacing.lg, padding: spacing.md, borderRadius: radius.md, marginTop: spacing.lg }, aiNoteText: { flex: 1, color: colors.textSecondary, fontSize: 12, lineHeight: 17 },
});
