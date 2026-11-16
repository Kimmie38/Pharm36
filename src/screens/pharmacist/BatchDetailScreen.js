import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import { spacing, type, radius } from '../../theme/theme';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../api/client';
import { apiErrorMessage, confirmAction, showMessage } from '../../utils/ui';

const statusMap = {
  ok: { label: 'Good', tone: 'success' },
  expiring_1m: { label: 'Expiring · 1 month', tone: 'warning' },
  expiring_2w: { label: 'Expiring · 2 weeks', tone: 'danger' },
  expired: { label: 'Expired', tone: 'danger' },
};

export default function BatchDetailScreen({ navigation, route }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { user } = useAuth();
  const { batchId } = route.params || {};
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const glow = useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api.get(`batches/${batchId}`);
      setBatch(result.batch);
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => { load(); }, [load]);
  const isUrgent = batch?.status === 'expiring_2w' || batch?.status === 'expired';
  useEffect(() => {
    if (!isUrgent) return undefined;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 700, useNativeDriver: false }),
      Animated.timing(glow, { toValue: 0, duration: 700, useNativeDriver: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [isUrgent, glow]);

  const handleAction = async (action) => {
    if (!batch) return;
    const verb = action === 'dispose' ? 'dispose' : 'sell';
    const title = action === 'dispose' ? 'Dispose this batch?' : 'Mark this batch sold?';
    const detail = action === 'dispose'
      ? `${batch.drugName} will be removed from active inventory.`
      : `This will record a sale of all ${batch.quantity} remaining units at ₦${batch.unitPrice} per unit.`;
    if (!(await confirmAction(title, detail))) return;
    setActionLoading(true);
    try {
      await api.post(`batches/${batchId}/${verb}`, action === 'dispose' ? { reason: batch.status === 'expired' ? 'expired' : 'other' } : {});
      showMessage(action === 'dispose' ? 'Batch disposed' : 'Sale recorded', `${batch.drugName} has been updated in your inventory.`);
      navigation.goBack();
    } catch (e) {
      showMessage('Could not update batch', apiErrorMessage(e));
      await load();
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !batch) return <View style={[styles.center, { backgroundColor: colors.bg }]}><ActivityIndicator size="large" color={colors.greenLight} /><Text style={styles.message}>Loading batch…</Text></View>;
  if (!batch) return <View style={[styles.center, { backgroundColor: colors.bg }]}><Text style={styles.message}>{error || 'Batch not found.'}</Text><Pressable onPress={load}><Text style={styles.retry}>Tap to retry</Text></Pressable></View>;

  const status = statusMap[batch.status] || statusMap.ok;
  const isActive = batch.state === 'active';
  const category = user?.categories?.find((item) => item.key === batch.category);
  const shadowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.75] });
  const bannerGradient = isUrgent ? ['#7A1A16', colors.danger] : batch.status === 'expiring_1m' ? ['#7A5A16', colors.warning] : [colors.tealDeep, colors.green];
  const totalValue = batch.totalValue ?? batch.quantity * batch.unitPrice;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 60 }}>
      <View style={styles.header}><Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backBtn}><Ionicons name="chevron-back" size={22} color={colors.textPrimary} /></Pressable><Text style={styles.headerTitle}>Batch Details</Text><View style={{ width: 34 }} /></View>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <Animated.View style={[styles.bannerShadowWrap, isUrgent && { shadowOpacity, shadowColor: colors.danger, shadowRadius: 18, elevation: 10 }]}>
        <LinearGradient colors={bannerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.banner}>
          <View style={styles.bannerIconWrap}><Ionicons name={isUrgent ? 'alert-circle' : 'medical'} size={30} color="#fff" /></View>
          <Text style={styles.drugNameBig}>{batch.drugName}</Text><Text style={styles.bannerSub}>Batch {batch.batchCode}</Text>
          <View style={{ marginTop: spacing.sm, flexDirection: 'row', gap: 6 }}><Badge label={status.label} tone="neutral" />{category && <Badge label={category.label} tone="info" />}</View>
        </LinearGradient>
      </Animated.View>
      <View style={styles.statsRow}>
        <Card style={styles.statCard}><Text style={styles.statValue}>{batch.quantity}</Text><Text style={styles.statLabel}>Units in stock</Text></Card>
        <Card style={styles.statCard}><Text style={styles.statValue}>₦{batch.unitPrice}</Text><Text style={styles.statLabel}>Per unit</Text></Card>
        <Card style={styles.statCard}><Text style={styles.statValue}>₦{Number(totalValue).toLocaleString()}</Text><Text style={styles.statLabel}>Total value</Text></Card>
      </View>
      <Text style={styles.sectionLabel}>Batch information</Text>
      <Card style={{ marginHorizontal: spacing.lg }}>
        <DetailRow colors={colors} icon="medical-outline" label="Drug name" value={batch.drugName} />
        <DetailRow colors={colors} icon="business-outline" label="Manufacturer" value={batch.manufacturer || 'Not recorded'} />
        <DetailRow colors={colors} icon="flask-outline" label="Strength / form" value={[batch.strength, batch.form].filter(Boolean).join(' · ') || 'Not recorded'} />
        <DetailRow colors={colors} icon="pricetags-outline" label="Category" value={category?.label || batch.category || 'General / OTC'} />
        <DetailRow colors={colors} icon="barcode-outline" label="Batch code" value={batch.batchCode} />
        <DetailRow colors={colors} icon="calendar-outline" label="Manufactured" value={batch.manufactureDate ? String(batch.manufactureDate).slice(0, 10) : 'Not recorded'} />
        <DetailRow colors={colors} icon="alert-circle-outline" label="Expires" value={`${String(batch.expiryDate).slice(0, 10)}${batch.daysToExpiry >= 0 ? ` (${batch.daysToExpiry}d left)` : ' (expired)'}`} valueColor={isUrgent ? colors.danger : colors.textPrimary} />
        <DetailRow colors={colors} icon="cube-outline" label="Quantity" value={`${batch.quantity} units`} />
        <DetailRow colors={colors} icon="cash-outline" label="Unit price" value={`₦${batch.unitPrice}`} last />
      </Card>
      {isActive && <View style={styles.actionsRow}>
        <Pressable style={styles.disposeBtn} disabled={actionLoading} onPress={() => handleAction('dispose')}><Ionicons name="trash-outline" size={17} color="#fff" /><Text style={styles.actionLabel}>Dispose</Text></Pressable>
        {batch.status !== 'expired' && <Pressable style={styles.saleBtn} disabled={actionLoading} onPress={() => handleAction('sale')}><Ionicons name="pricetag-outline" size={17} color="#fff" /><Text style={styles.actionLabel}>{actionLoading ? 'Updating…' : 'Mark Sold'}</Text></Pressable>}
      </View>}
      {!isActive && <Text style={styles.message}>This batch is {batch.state} and can no longer be changed.</Text>}
    </ScrollView>
  );
}

function DetailRow({ icon, label, value, last, valueColor, colors }) {
  const styles = makeDetailStyles(colors);
  return <View style={[styles.row, !last && styles.border]}><Ionicons name={icon} size={17} color={colors.textMuted} style={{ marginRight: 10 }} /><Text style={styles.label}>{label}</Text><Text style={[styles.value, valueColor && { color: valueColor }]} numberOfLines={2}>{value}</Text></View>;
}

const makeDetailStyles = (colors) => StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12 }, border: { borderBottomWidth: 1, borderBottomColor: colors.border }, label: { color: colors.textMuted, fontSize: 12.5, width: 110 }, value: { color: colors.textPrimary, fontSize: 13.5, flex: 1, textAlign: 'right', fontWeight: '700' } });
const makeStyles = (colors) => StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }, message: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md }, retry: { color: colors.greenLight, marginTop: spacing.md, fontWeight: '700' }, error: { color: colors.danger, marginHorizontal: spacing.lg, marginBottom: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: 60, paddingBottom: spacing.sm }, backBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.bgElevated2, alignItems: 'center', justifyContent: 'center' }, headerTitle: { color: colors.textPrimary, ...type.h3 },
  bannerShadowWrap: { marginHorizontal: spacing.lg, borderRadius: radius.lg }, banner: { alignItems: 'center', padding: spacing.xl, borderRadius: radius.lg }, bannerIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm }, drugNameBig: { color: '#fff', fontSize: 24, fontWeight: '800', textAlign: 'center' }, bannerSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12.5, marginTop: 4, letterSpacing: 0.3 },
  statsRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, marginTop: spacing.lg, marginBottom: spacing.md }, statCard: { flex: 1, alignItems: 'center', gap: 4 }, statValue: { color: colors.textPrimary, fontSize: 15, fontWeight: '800' }, statLabel: { color: colors.textMuted, fontSize: 10, textAlign: 'center' }, sectionLabel: { color: colors.textMuted, ...type.tiny, textTransform: 'uppercase', marginHorizontal: spacing.lg, marginBottom: spacing.sm, marginTop: spacing.sm },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl, marginHorizontal: spacing.lg }, disposeBtn: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: '#3A3A3A', height: 50, borderRadius: radius.md }, saleBtn: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.green, height: 50, borderRadius: radius.md }, actionLabel: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
