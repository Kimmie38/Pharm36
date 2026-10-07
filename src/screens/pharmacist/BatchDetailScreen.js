import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import { spacing, type, radius } from '../../theme/theme';
import { useTheme } from '../../theme/ThemeContext';
import { batches, drugCategories, pharmacistProfile, professionalTypes } from '../../data/mockData';

const statusMap = {
  ok: { label: 'Good', tone: 'success' },
  expiring_1m: { label: 'Expiring · 1 month', tone: 'warning' },
  expiring_2w: { label: 'Expiring · 2 weeks', tone: 'danger' },
  expired: { label: 'Expired', tone: 'danger' },
};

export default function BatchDetailScreen({ navigation, route }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { batchId } = route.params || {};
  const batch = batches.find((b) => b.id === batchId) || batches[0];
  const s = statusMap[batch.status];
  const isUrgent = batch.status === 'expiring_2w' || batch.status === 'expired';

  const glow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!isUrgent) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 700, useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0, duration: 700, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isUrgent]);

  const shadowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.75] });
  const bannerGradient = isUrgent
    ? ['#7A1A16', colors.danger]
    : batch.status === 'expiring_1m'
    ? ['#7A5A16', colors.warning]
    : [colors.tealDeep, colors.green];

  const totalValue = batch.quantity * batch.unitPrice;
  const category = drugCategories.find((c) => c.key === batch.category);
  const councilShort = professionalTypes[pharmacistProfile.professionalType].councilShort;

  const handleAction = (action) => {
    Alert.alert(
      action === 'dispose' ? 'Marked as disposed' : 'Marked as sold',
      `${batch.drugName} has been ${action === 'dispose' ? 'removed from inventory and logged as disposed' : 'sold and removed from active inventory'}. This update was sent to ${councilShort}.`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 60 }}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Batch Details</Text>
        <View style={{ width: 34 }} />
      </View>

      <Animated.View
        style={[
          styles.bannerShadowWrap,
          isUrgent && { shadowOpacity, shadowColor: colors.danger, shadowRadius: 18, elevation: 10 },
        ]}
      >
        <LinearGradient colors={bannerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.banner}>
          <View style={styles.bannerIconWrap}>
            <Ionicons name={isUrgent ? 'alert-circle' : 'medical'} size={30} color="#fff" />
          </View>
          <Text style={styles.drugNameBig}>{batch.drugName}</Text>
          <Text style={styles.bannerSub}>Batch {batch.batchCode}</Text>
          <View style={{ marginTop: spacing.sm, flexDirection: 'row', gap: 6 }}>
            <Badge label={s.label} tone="neutral" />
            {category && <Badge label={category.label} tone="info" />}
          </View>
        </LinearGradient>
      </Animated.View>

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{batch.quantity}</Text>
          <Text style={styles.statLabel}>Units in stock</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>₦{batch.unitPrice}</Text>
          <Text style={styles.statLabel}>Per unit</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>₦{totalValue.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total value</Text>
        </Card>
      </View>

      <Text style={styles.sectionLabel}>Batch information</Text>
      <Card style={{ marginHorizontal: spacing.lg }}>
        <DetailRow colors={colors} icon="medical-outline" label="Drug name" value={batch.drugName} />
        <DetailRow colors={colors} icon="pricetags-outline" label="Category" value={category?.label || 'General / OTC'} />
        <DetailRow colors={colors} icon="barcode-outline" label="Batch code" value={batch.batchCode} />
        <DetailRow colors={colors} icon="calendar-outline" label="Manufactured" value={batch.manufactureDate} />
        <DetailRow
          colors={colors}
          icon="alert-circle-outline"
          label="Expires"
          value={`${batch.expiryDate}${batch.daysToExpiry >= 0 ? ` (${batch.daysToExpiry}d left)` : ' (expired)'}`}
          valueColor={isUrgent ? colors.danger : colors.textPrimary}
        />
        <DetailRow colors={colors} icon="cube-outline" label="Quantity" value={`${batch.quantity} units`} />
        <DetailRow colors={colors} icon="cash-outline" label="Unit price" value={`₦${batch.unitPrice}`} last />
      </Card>

      <View style={styles.actionsRow}>
        <Pressable style={styles.disposeBtn} onPress={() => handleAction('dispose')}>
          <Ionicons name="trash-outline" size={17} color="#fff" />
          <Text style={styles.actionLabel}>Dispose</Text>
        </Pressable>
        <Pressable style={styles.saleBtn} onPress={() => handleAction('sale')}>
          <Ionicons name="pricetag-outline" size={17} color="#fff" />
          <Text style={styles.actionLabel}>Mark Sold</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function DetailRow({ icon, label, value, last, valueColor, colors }) {
  const s = makeDetailStyles(colors);
  return (
    <View style={[s.row, !last && s.border]}>
      <Ionicons name={icon} size={17} color={colors.textMuted} style={{ marginRight: 10 }} />
      <Text style={s.label}>{label}</Text>
      <Text style={[s.value, valueColor && { color: valueColor }]} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const makeDetailStyles = (colors) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12 },
  border: { borderBottomWidth: 1, borderBottomColor: colors.border },
  label: { color: colors.textMuted, fontSize: 12.5, width: 110 },
  value: { color: colors.textPrimary, fontSize: 13.5, flex: 1, textAlign: 'right', fontWeight: '700' },
});

const makeStyles = (colors) => StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: 60, paddingBottom: spacing.sm },
  backBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.bgElevated2, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: colors.textPrimary, ...type.h3 },
  bannerShadowWrap: { marginHorizontal: spacing.lg, borderRadius: radius.lg },
  banner: { alignItems: 'center', padding: spacing.xl, borderRadius: radius.lg },
  bannerIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  drugNameBig: { color: '#fff', fontSize: 24, fontWeight: '800', textAlign: 'center' },
  bannerSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12.5, marginTop: 4, letterSpacing: 0.3 },
  statsRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, marginTop: spacing.lg, marginBottom: spacing.md },
  statCard: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { color: colors.textPrimary, fontSize: 15, fontWeight: '800' },
  statLabel: { color: colors.textMuted, fontSize: 10, textAlign: 'center' },
  sectionLabel: { color: colors.textMuted, ...type.tiny, textTransform: 'uppercase', marginHorizontal: spacing.lg, marginBottom: spacing.sm, marginTop: spacing.sm },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl, marginHorizontal: spacing.lg },
  disposeBtn: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: '#3A3A3A', height: 50, borderRadius: radius.md },
  saleBtn: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.green, height: 50, borderRadius: radius.md },
  actionLabel: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
