import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import { spacing, type, radius } from '../../theme/theme';
import { useTheme } from '../../theme/ThemeContext';
import { pharmacistProfile, batches, salesLevels, expiringBatches } from '../../data/mockData';

const levelTone = { high: 'success', medium: 'warning', low: 'danger' };
const levelLabel = { high: 'High', medium: 'Medium', low: 'Low' };

export default function HomeScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const totalBatches = batches.length;
  const totalUnits = batches.reduce((s, b) => s + b.quantity, 0);
  const soonCount = expiringBatches.length;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning,</Text>
          <Text style={styles.name}>{pharmacistProfile.name.split(' ')[0]} 👋</Text>
        </View>
        <Pressable onPress={() => navigation.navigate('Profile')} style={styles.avatar}>
          <Text style={styles.avatarText}>{pharmacistProfile.name.split(' ').map(n => n[0]).join('').slice(0,2)}</Text>
        </Pressable>
      </View>

      {soonCount > 0 && (
        <Pressable onPress={() => navigation.navigate('Expiry')}>
          <LinearGradient colors={['#7A1A16', colors.danger]} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.alertBanner}>
            <Ionicons name="warning" size={20} color="#fff" />
            <Text style={styles.alertText}>{soonCount} batch{soonCount > 1 ? 'es' : ''} need attention — expiring soon</Text>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </LinearGradient>
        </Pressable>
      )}

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Ionicons name="cube-outline" size={20} color={colors.greenLight} />
          <Text style={styles.statValue}>{totalBatches}</Text>
          <Text style={styles.statLabel}>Batches in store</Text>
        </Card>
        <Card style={styles.statCard}>
          <Ionicons name="layers-outline" size={20} color={colors.info} />
          <Text style={styles.statValue}>{totalUnits}</Text>
          <Text style={styles.statLabel}>Units total</Text>
        </Card>
        <Card style={styles.statCard}>
          <Ionicons name="alert-circle-outline" size={20} color={colors.danger} />
          <Text style={styles.statValue}>{soonCount}</Text>
          <Text style={styles.statLabel}>Expiring soon</Text>
        </Card>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Sales level by drug</Text>
        <Pressable onPress={() => navigation.navigate('Sales')}>
          <Text style={styles.sectionLink}>See sales</Text>
        </Pressable>
      </View>
      <Card style={{ gap: 0 }}>
        {salesLevels.map((s, i) => (
          <View key={s.drugName} style={[styles.salesRow, i !== salesLevels.length - 1 && styles.salesRowBorder]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.salesDrug}>{s.drugName}</Text>
              <Text style={styles.salesMeta}>{s.unitsSold} units · ₦{s.revenue.toLocaleString()}</Text>
            </View>
            <Badge label={levelLabel[s.level]} tone={levelTone[s.level]} />
          </View>
        ))}
      </Card>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>All batches</Text>
        <Pressable onPress={() => navigation.navigate('Inventory')}>
          <Text style={styles.sectionLink}>View all</Text>
        </Pressable>
      </View>
      {batches.slice(0, 3).map((b) => (
        <Pressable key={b.id} onPress={() => navigation.navigate('BatchDetail', { batchId: b.id })}>
          <Card style={styles.batchCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.batchName}>{b.drugName}</Text>
              <Text style={styles.batchMeta}>Qty {b.quantity} · ₦{b.unitPrice}/unit</Text>
            </View>
            <Text style={styles.batchExpiry}>Exp {b.expiryDate}</Text>
          </Card>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: 60, paddingBottom: spacing.md },
  greeting: { color: colors.textSecondary, ...type.small },
  name: { color: colors.textPrimary, ...type.h1, marginTop: 2 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.tealDeep, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.green },
  avatarText: { color: '#fff', fontWeight: '700' },
  alertBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: spacing.lg, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.md },
  alertText: { flex: 1, color: '#fff', ...type.small, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  statCard: { flex: 1, alignItems: 'flex-start', gap: 6 },
  statValue: { color: colors.textPrimary, fontSize: 22, fontWeight: '800' },
  statLabel: { color: colors.textMuted, fontSize: 11 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, marginBottom: spacing.sm, marginTop: spacing.sm },
  sectionTitle: { color: colors.textPrimary, ...type.h3 },
  sectionLink: { color: colors.greenLight, ...type.small, fontWeight: '600' },
  salesRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, marginHorizontal: spacing.md },
  salesRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  salesDrug: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  salesMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  batchCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.lg, marginBottom: spacing.sm },
  batchName: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  batchMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  batchExpiry: { color: colors.textSecondary, fontSize: 12 },
});
