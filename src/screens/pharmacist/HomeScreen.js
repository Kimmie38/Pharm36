import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import { spacing, type, radius } from '../../theme/theme';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../api/client';
import { apiErrorMessage } from '../../utils/ui';

const levelTone = { high: 'success', medium: 'warning', low: 'danger' };
const levelLabel = { high: 'High', medium: 'Medium', low: 'Low' };

export default function HomeScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await api.get('dashboard'));
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const professional = data?.professional || user || {};
  const batches = data?.recentBatches || [];
  const soonCount = data?.expiringCount || 0;
  const initials = (professional.name || 'Pharm36').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <View><Text style={styles.greeting}>Good morning,</Text><Text style={styles.name}>{(professional.name || 'Pharmacist').split(' ')[0]}</Text></View>
        <Pressable onPress={() => navigation.navigate('Profile')} style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></Pressable>
      </View>

      {loading && !data && <ActivityIndicator color={colors.greenLight} style={{ marginVertical: spacing.lg }} />}
      {!!error && <Pressable onPress={load} style={styles.errorBox}><Text style={styles.errorText}>{error}  ·  Tap to retry</Text></Pressable>}

      {soonCount > 0 && (
        <Pressable onPress={() => navigation.navigate('Expiry')}>
          <LinearGradient colors={['#7A1A16', colors.danger]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.alertBanner}>
            <Ionicons name="warning" size={20} color="#fff" />
            <Text style={styles.alertText}>{soonCount} batch{soonCount > 1 ? 'es' : ''} need attention — expiring soon</Text>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </LinearGradient>
        </Pressable>
      )}

      <View style={styles.statsRow}>
        <Card style={styles.statCard}><Ionicons name="cube-outline" size={20} color={colors.greenLight} /><Text style={styles.statValue}>{data?.totalBatches ?? '—'}</Text><Text style={styles.statLabel}>Batches in store</Text></Card>
        <Card style={styles.statCard}><Ionicons name="layers-outline" size={20} color={colors.info} /><Text style={styles.statValue}>{data?.totalUnits ?? '—'}</Text><Text style={styles.statLabel}>Units total</Text></Card>
        <Card style={styles.statCard}><Ionicons name="alert-circle-outline" size={20} color={colors.danger} /><Text style={styles.statValue}>{data ? soonCount : '—'}</Text><Text style={styles.statLabel}>Expiring soon</Text></Card>
      </View>

      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Sales level by drug</Text><Pressable onPress={() => navigation.navigate('Sales')}><Text style={styles.sectionLink}>See sales</Text></Pressable></View>
      <Card style={{ gap: 0 }}>
        {(data?.salesLevels || []).length ? data.salesLevels.map((sale, index) => (
          <View key={sale.drugName} style={[styles.salesRow, index !== data.salesLevels.length - 1 && styles.salesRowBorder]}>
            <View style={{ flex: 1 }}><Text style={styles.salesDrug}>{sale.drugName}</Text><Text style={styles.salesMeta}>{sale.unitsSold} units · ₦{Number(sale.revenue || 0).toLocaleString()}</Text></View>
            <Badge label={levelLabel[sale.level] || sale.level} tone={levelTone[sale.level] || 'neutral'} />
          </View>
        )) : <Text style={styles.emptyText}>{data ? 'No sales in the last 30 days.' : 'Sales data will appear here.'}</Text>}
      </Card>

      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Recent batches</Text><Pressable onPress={() => navigation.navigate('Inventory')}><Text style={styles.sectionLink}>View all</Text></Pressable></View>
      {batches.length ? batches.map((batch) => (
        <Pressable key={batch.id} onPress={() => navigation.navigate('BatchDetail', { batchId: batch.id })}>
          <Card style={styles.batchCard}><View style={{ flex: 1 }}><Text style={styles.batchName}>{batch.drugName}</Text><Text style={styles.batchMeta}>Qty {batch.quantity} · ₦{batch.unitPrice}/unit</Text></View><Text style={styles.batchExpiry}>Exp {String(batch.expiryDate).slice(0, 10)}</Text></Card>
        </Pressable>
      )) : !loading && <Text style={styles.emptyText}>No active batches yet. Add your first batch from Inventory.</Text>}
    </ScrollView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: 60, paddingBottom: spacing.md },
  greeting: { color: colors.textSecondary, ...type.small }, name: { color: colors.textPrimary, ...type.h1, marginTop: 2 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.tealDeep, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.green }, avatarText: { color: '#fff', fontWeight: '700' },
  alertBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: spacing.lg, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.md }, alertText: { flex: 1, color: '#fff', ...type.small, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.lg }, statCard: { flex: 1, alignItems: 'flex-start', gap: 6 }, statValue: { color: colors.textPrimary, fontSize: 22, fontWeight: '800' }, statLabel: { color: colors.textMuted, fontSize: 11 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, marginBottom: spacing.sm, marginTop: spacing.sm }, sectionTitle: { color: colors.textPrimary, ...type.h3 }, sectionLink: { color: colors.greenLight, ...type.small, fontWeight: '600' },
  salesRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, marginHorizontal: spacing.md }, salesRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border }, salesDrug: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' }, salesMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  batchCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.lg, marginBottom: spacing.sm }, batchName: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' }, batchMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 }, batchExpiry: { color: colors.textSecondary, fontSize: 12 },
  emptyText: { color: colors.textMuted, fontSize: 13, padding: spacing.md }, errorBox: { marginHorizontal: spacing.lg, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.dangerGlow }, errorText: { color: colors.danger, fontSize: 12 },
});
