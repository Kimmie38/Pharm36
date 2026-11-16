import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Badge from '../../components/Badge';
import { spacing, type, radius } from '../../theme/theme';
import { useTheme } from '../../theme/ThemeContext';
import { api } from '../../api/client';
import { apiErrorMessage, confirmAction, showMessage } from '../../utils/ui';

function ExpiryCard({ batch, onDispose, onSale, navigation, busy }) {
  const { colors } = useTheme();
  const styles = makeCardStyles(colors);
  const flash = useRef(new Animated.Value(0)).current;
  const isUrgent = batch.status === 'expiring_2w' || batch.status === 'expired';
  useEffect(() => {
    if (!isUrgent) return undefined;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(flash, { toValue: 1, duration: 550, useNativeDriver: false }),
      Animated.timing(flash, { toValue: 0, duration: 550, useNativeDriver: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [isUrgent, flash]);
  const borderColor = flash.interpolate({ inputRange: [0, 1], outputRange: [colors.border, colors.danger] });
  const bgColor = flash.interpolate({ inputRange: [0, 1], outputRange: [colors.bgElevated, colors.dangerGlow] });
  const shadowOpacity = flash.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.55] });
  return (
    <Pressable onPress={() => navigation?.navigate('BatchDetail', { batchId: batch.id })}>
      <Animated.View style={[styles.card, { borderColor: isUrgent ? borderColor : colors.border, backgroundColor: isUrgent ? bgColor : colors.bgElevated }, isUrgent && { shadowColor: colors.danger, shadowOpacity, shadowRadius: 14, elevation: 6 }]}>
        <View style={styles.cardTop}><View style={{ flex: 1 }}><Text style={styles.drugName}>{batch.drugName}</Text><Text style={styles.meta}>Batch {batch.batchCode.slice(-6)} · Qty {batch.quantity}</Text></View>
          {batch.status === 'expired' ? <Badge label="Expired" tone="danger" /> : <Badge label={batch.daysToExpiry <= 14 ? `${batch.daysToExpiry}d left` : `${Math.round(batch.daysToExpiry / 30)}mo left`} tone={batch.status === 'expiring_2w' ? 'danger' : 'warning'} />}
        </View>
        <Text style={styles.expiryDate}>Expires {String(batch.expiryDate).slice(0, 10)}</Text>
        <View style={styles.actionsRow}>
          <Pressable style={styles.disposeBtn} disabled={busy} onPress={(event) => { event.stopPropagation?.(); onDispose(batch); }}><Ionicons name="trash-outline" size={16} color="#fff" /><Text style={styles.actionLabel}>Dispose</Text></Pressable>
          {batch.status !== 'expired' && <Pressable style={styles.saleBtn} disabled={busy} onPress={(event) => { event.stopPropagation?.(); onSale(batch); }}><Ionicons name="pricetag-outline" size={16} color="#fff" /><Text style={styles.actionLabel}>Mark Sold</Text></Pressable>}
        </View>
      </Animated.View>
    </Pressable>
  );
}

export default function ExpiryScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api.get('batches/expiring');
      setItems(result.items || []);
    } catch (e) { setError(apiErrorMessage(e)); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const resolve = async (batch, action) => {
    const dispose = action === 'dispose';
    if (!(await confirmAction(dispose ? 'Dispose this batch?' : 'Mark this batch sold?', dispose
      ? `${batch.drugName} will be removed from active inventory.`
      : `This records a sale of all ${batch.quantity} remaining units at ₦${batch.unitPrice} per unit.`))) return;
    setBusyId(batch.id);
    try {
      await api.post(`batches/${batch.id}/${dispose ? 'dispose' : 'sell'}`, dispose ? { reason: batch.status === 'expired' ? 'expired' : 'other' } : {});
      showMessage(dispose ? 'Batch disposed' : 'Sale recorded', `${batch.drugName} has been updated.`);
      await load();
    } catch (e) { showMessage('Could not update batch', apiErrorMessage(e)); }
    finally { setBusyId(null); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}><Text style={styles.title}>Expiry Alerts</Text><Text style={styles.subtitle}>{items.length} batch{items.length !== 1 ? 'es' : ''} need action</Text></View>
      {!!error && <Pressable onPress={load} style={styles.errorBox}><Text style={styles.errorText}>{error} · Tap to retry</Text></Pressable>}
      {loading && <ActivityIndicator color={colors.greenLight} style={{ marginVertical: spacing.md }} />}
      {!loading && !items.length ? <View style={styles.emptyWrap}><Ionicons name="checkmark-done-circle-outline" size={56} color={colors.success} /><Text style={styles.emptyTitle}>All clear</Text><Text style={styles.emptySub}>No batches are close to expiring right now.</Text></View> : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 40 }}>
          {items.map((batch) => <ExpiryCard key={batch.id} batch={batch} navigation={navigation} busy={busyId === batch.id} onDispose={(item) => resolve(item, 'dispose')} onSale={(item) => resolve(item, 'sale')} />)}
        </ScrollView>
      )}
    </View>
  );
}

const makeCardStyles = (colors) => StyleSheet.create({
  card: { borderWidth: 1.5, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md }, cardTop: { flexDirection: 'row', alignItems: 'flex-start' }, drugName: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' }, meta: { color: colors.textMuted, fontSize: 12, marginTop: 3 }, expiryDate: { color: colors.textSecondary, fontSize: 12.5, marginTop: spacing.sm, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }, disposeBtn: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: '#3A3A3A', height: 42, borderRadius: radius.sm }, saleBtn: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.green, height: 42, borderRadius: radius.sm }, actionLabel: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
const makeStyles = (colors) => StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: 60, paddingBottom: spacing.md }, title: { color: colors.textPrimary, ...type.h1 }, subtitle: { color: colors.textSecondary, ...type.small, marginTop: 4 }, emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, marginTop: -60 }, emptyTitle: { color: colors.textPrimary, ...type.h2, marginTop: spacing.md }, emptySub: { color: colors.textMuted, ...type.small, marginTop: 6, textAlign: 'center' }, errorBox: { marginHorizontal: spacing.lg, padding: spacing.md, backgroundColor: colors.dangerGlow, borderRadius: radius.md }, errorText: { color: colors.danger, fontSize: 12 },
});
