import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { spacing, type, radius} from '../../theme/theme';
import { useTheme } from '../../theme/ThemeContext';
import { marketplaceListings, batches } from '../../data/mockData';

export default function SalesScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [tab, setTab] = useState('buy'); // buy | sell

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <Text style={styles.title}>Sales & Marketplace</Text>
        <Text style={styles.subtitle}>Buy or sell batches with other pharmacists</Text>
      </View>

      <View style={styles.tabRow}>
        <Pressable style={[styles.tab, tab === 'buy' && styles.tabActive]} onPress={() => setTab('buy')}>
          <Text style={[styles.tabText, tab === 'buy' && styles.tabTextActive]}>Buy from others</Text>
        </Pressable>
        <Pressable style={[styles.tab, tab === 'sell' && styles.tabActive]} onPress={() => setTab('sell')}>
          <Text style={[styles.tabText, tab === 'sell' && styles.tabTextActive]}>My listings</Text>
        </Pressable>
      </View>

      {tab === 'buy' ? (
        <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 100 }}>
          {marketplaceListings.map((m) => (
            <Card key={m.id} style={styles.listingCard}>
              <View style={styles.listingTop}>
                <Text style={styles.drugName}>{m.drugName}</Text>
                <Text style={styles.postedAgo}>{m.postedAgo}</Text>
              </View>
              <Text style={styles.seller}>{m.seller}</Text>
              <View style={styles.listingBottom}>
                <Text style={styles.priceQty}>Qty {m.quantity} · ₦{m.unitPrice}/unit</Text>
                <Pressable style={styles.buyBtn}>
                  <Text style={styles.buyBtnText}>Buy batch</Text>
                </Pressable>
              </View>
            </Card>
          ))}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 100 }}>
          <Text style={styles.sectionNote}>List a batch from your inventory for other pharmacists to buy.</Text>
          {batches.slice(0, 3).map((b) => (
            <Card key={b.id} style={styles.myBatchCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.drugName}>{b.drugName}</Text>
                <Text style={styles.postedAgo}>Qty {b.quantity} · ₦{b.unitPrice}/unit in stock</Text>
              </View>
              <Pressable style={styles.listBtn}>
                <Ionicons name="megaphone-outline" size={15} color={colors.greenLight} />
                <Text style={styles.listBtnText}>List</Text>
              </Pressable>
            </Card>
          ))}
        </ScrollView>
      )}

      <View style={styles.fabWrap}>
        <Button label={tab === 'buy' ? 'Post a request' : 'Create new listing'} onPress={() => {}} />
      </View>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: 60, paddingBottom: spacing.sm },
  title: { color: colors.textPrimary, ...type.h1 },
  subtitle: { color: colors.textSecondary, ...type.small, marginTop: 4 },
  tabRow: { flexDirection: 'row', marginHorizontal: spacing.lg, backgroundColor: colors.bgElevated2, borderRadius: radius.md, padding: 4, marginBottom: spacing.md, marginTop: spacing.sm },
  tab: { flex: 1, paddingVertical: 10, borderRadius: radius.sm, alignItems: 'center' },
  tabActive: { backgroundColor: colors.green },
  tabText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#06110D' },
  listingCard: { marginBottom: spacing.sm },
  listingTop: { flexDirection: 'row', justifyContent: 'space-between' },
  drugName: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  postedAgo: { color: colors.textMuted, fontSize: 11 },
  seller: { color: colors.textSecondary, fontSize: 12.5, marginTop: 3 },
  listingBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  priceQty: { color: colors.textSecondary, fontSize: 12.5, fontWeight: '600' },
  buyBtn: { backgroundColor: colors.green, paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.pill },
  buyBtnText: { color: '#06110D', fontSize: 12.5, fontWeight: '700' },
  sectionNote: { color: colors.textMuted, fontSize: 12.5, marginBottom: spacing.md, lineHeight: 17 },
  myBatchCard: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  listBtn: { flexDirection: 'row', gap: 5, alignItems: 'center', borderWidth: 1, borderColor: colors.green, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill },
  listBtnText: { color: colors.greenLight, fontSize: 12, fontWeight: '700' },
  fabWrap: { position: 'absolute', bottom: 20, left: spacing.lg, right: spacing.lg },
});
