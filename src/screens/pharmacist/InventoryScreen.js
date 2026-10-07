import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import { spacing, type, radius } from '../../theme/theme';
import { useTheme } from '../../theme/ThemeContext';
import { batches } from '../../data/mockData';

const statusMap = {
  ok: { label: 'Good', tone: 'success' },
  expiring_1m: { label: 'Expiring · 1mo', tone: 'warning' },
  expiring_2w: { label: 'Expiring · 2wk', tone: 'danger' },
  expired: { label: 'Expired', tone: 'danger' },
};

export default function InventoryScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [query, setQuery] = useState('');
  const filtered = batches.filter((b) => b.drugName.toLowerCase().includes(query.toLowerCase()));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <Text style={styles.title}>Inventory</Text>
        <Pressable style={styles.addBtn} onPress={() => navigation.navigate('DataInput')}>
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search drugs..."
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 40 }}
        renderItem={({ item }) => {
          const s = statusMap[item.status];
          return (
            <Pressable onPress={() => navigation.navigate('BatchDetail', { batchId: item.id })}>
              <Card style={styles.row}>
                <View style={styles.iconWrap}>
                  <Ionicons name="medical-outline" size={20} color={colors.greenLight} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.drugName}>{item.drugName}</Text>
                  <Text style={styles.meta}>Batch {item.batchCode.slice(-6)} · Qty {item.quantity}</Text>
                  <Text style={styles.meta}>Exp {item.expiryDate} · ₦{item.unitPrice}/unit</Text>
                </View>
                <Badge label={s.label} tone={s.tone} />
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={{ marginLeft: 4 }} />
              </Card>
            </Pressable>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      />
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: 60, paddingBottom: spacing.md },
  title: { color: colors.textPrimary, ...type.h1 },
  addBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.bgElevated2, marginHorizontal: spacing.lg, borderRadius: radius.md, paddingHorizontal: spacing.md, height: 46, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(31,174,116,0.12)', alignItems: 'center', justifyContent: 'center' },
  drugName: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  meta: { color: colors.textMuted, fontSize: 11.5, marginTop: 2 },
});
