import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Input from '../../components/Input';
import Button from '../../components/Button';
import ScreenHeader from '../../components/ScreenHeader';
import { spacing, type, radius } from '../../theme/theme';
import { useTheme } from '../../theme/ThemeContext';
import { pharmacistProfile, professionalTypes, drugCategories, canAddDrugCategory } from '../../data/mockData';

export default function DataInputScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [form, setForm] = useState({
    drugName: '', manufactureDate: '', expiryDate: '', price: '', quantity: '', batchCode: '',
  });
  const [reminder, setReminder] = useState('1 month');
  const [category, setCategory] = useState('general');
  const update = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const profession = professionalTypes[pharmacistProfile.professionalType];
  const selectedCategory = drugCategories.find((c) => c.key === category);
  const isAllowed = canAddDrugCategory(pharmacistProfile, category);
  const requiredSectionLabels = selectedCategory?.requiredSections
    .map((key) => {
      for (const prof of Object.values(professionalTypes)) {
        const match = prof.sections.find((s) => s.key === key);
        if (match) return match.label;
      }
      return key;
    }) || [];

  const handleScan = () => {
    navigation.navigate('ScanBatchCode', {
      onScanned: (code) => update('batchCode')(code),
    });
  };

  const handleSave = () => {
    if (!isAllowed) {
      Alert.alert(
        'You can\'t add this drug category',
        `Adding "${selectedCategory.label}" requires your account to carry one of these sections: ${requiredSectionLabels.join(' or ')}. Your account is currently only registered for: ${pharmacistProfile.sections.map(k => sectionLabel(k)).join(', ')}. Contact ${profession.council} to update your license.`
      );
      return;
    }
    if (!form.drugName || !form.expiryDate || !form.batchCode) {
      Alert.alert('Missing details', 'Please fill in the drug name, expiry date, and scan the batch code.');
      return;
    }
    // In production: POST to backend, which also forwards the batch record to the council admin.
    Alert.alert('Batch saved', `${form.drugName} has been added to your inventory and reported to ${profession.councilShort}.`, [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Add drug batch" subtitle="Record a new batch entering your store" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">

        <Text style={styles.label}>Drug category</Text>
        <View style={styles.categoryRow}>
          {drugCategories.map((c) => {
            const locked = !canAddDrugCategory(pharmacistProfile, c.key);
            const active = category === c.key;
            return (
              <Pressable
                key={c.key}
                onPress={() => setCategory(c.key)}
                style={[styles.chip, active && (locked ? styles.chipActiveLocked : styles.chipActive)]}
              >
                {locked && <Ionicons name="lock-closed" size={11} color={active ? '#fff' : colors.textMuted} style={{ marginRight: 4 }} />}
                <Text style={[styles.chipText, active && (locked ? styles.chipTextActiveLocked : styles.chipTextActive)]}>{c.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {!isAllowed && (
          <View style={styles.restrictedBox}>
            <Ionicons name="alert-circle" size={20} color={colors.danger} />
            <View style={{ flex: 1 }}>
              <Text style={styles.restrictedTitle}>Restricted category</Text>
              <Text style={styles.restrictedText}>
                Your account isn't registered under {requiredSectionLabels.join(' or ')}. You can't add this drug until {profession.councilShort} approves that section on your license.
              </Text>
            </View>
          </View>
        )}

        <Text style={styles.label}>Batch code</Text>
        <Pressable style={styles.scanBox} onPress={handleScan}>
          {form.batchCode ? (
            <>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.scanCode}>{form.batchCode}</Text>
              <Text style={styles.rescan}>Rescan</Text>
            </>
          ) : (
            <>
              <View style={styles.scanIconWrap}>
                <Ionicons name="barcode-outline" size={22} color={colors.greenLight} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.scanTitle}>Scan batch barcode</Text>
                <Text style={styles.scanSub}>Line up the code in the frame</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </>
          )}
        </Pressable>

        <Input label="Drug name" placeholder="e.g. Amoxicillin 500mg" value={form.drugName} onChangeText={update('drugName')} icon="medical-outline" />

        <View style={styles.dateRow}>
          <View style={{ flex: 1 }}>
            <Input label="Manufacture date" placeholder="YYYY-MM-DD" value={form.manufactureDate} onChangeText={update('manufactureDate')} icon="calendar-outline" />
          </View>
          <View style={{ width: spacing.sm }} />
          <View style={{ flex: 1 }}>
            <Input label="Expiry date" placeholder="YYYY-MM-DD" value={form.expiryDate} onChangeText={update('expiryDate')} icon="calendar-outline" />
          </View>
        </View>

        <View style={styles.dateRow}>
          <View style={{ flex: 1 }}>
            <Input label="Price per unit (₦)" placeholder="0.00" value={form.price} onChangeText={update('price')} icon="cash-outline" keyboardType="numeric" />
          </View>
          <View style={{ width: spacing.sm }} />
          <View style={{ flex: 1 }}>
            <Input label="Quantity" placeholder="0" value={form.quantity} onChangeText={update('quantity')} icon="layers-outline" keyboardType="numeric" />
          </View>
        </View>

        <Text style={styles.label}>Extra reminder before the 1-month/2-week alerts</Text>
        <View style={styles.reminderRow}>
          {['1 year', '6 months', '3 months', '1 month', '2 weeks', '1 week'].map((r) => (
            <Pressable key={r} onPress={() => setReminder(r)} style={[styles.chip, reminder === r && styles.chipActive]}>
              <Text style={[styles.chipText, reminder === r && styles.chipTextActive]}>{r}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.hint}>Pharm36 always alerts you automatically at 1 month and 2 weeks before expiry — this sets an earlier heads-up too.</Text>

        <Button
          label={isAllowed ? 'Save Batch' : 'Category restricted'}
          onPress={handleSave}
          disabled={!isAllowed}
          style={{ marginTop: spacing.xl }}
        />
      </ScrollView>
    </View>
  );
}

function sectionLabel(key) {
  for (const prof of Object.values(professionalTypes)) {
    const match = prof.sections.find((s) => s.key === key);
    if (match) return match.label;
  }
  return key;
}

const makeStyles = (colors) => StyleSheet.create({
  label: { color: colors.textSecondary, ...type.small, marginBottom: 8, marginTop: spacing.sm, fontWeight: '600' },
  scanBox: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.bgElevated, borderWidth: 1.5, borderColor: colors.green,
    borderStyle: 'dashed', borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md,
  },
  scanIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(31,174,116,0.14)', alignItems: 'center', justifyContent: 'center' },
  scanTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  scanSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  scanCode: { flex: 1, color: colors.textPrimary, fontSize: 14, fontWeight: '600', letterSpacing: 0.5 },
  rescan: { color: colors.greenLight, fontSize: 12, fontWeight: '700' },
  dateRow: { flexDirection: 'row' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.sm },
  reminderRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill, backgroundColor: colors.bgElevated2, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: 'rgba(31,174,116,0.16)', borderColor: colors.green },
  chipActiveLocked: { backgroundColor: colors.danger, borderColor: colors.danger },
  chipText: { color: colors.textSecondary, fontSize: 12.5, fontWeight: '600' },
  chipTextActive: { color: colors.greenLight },
  chipTextActiveLocked: { color: '#fff' },
  restrictedBox: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: colors.dangerGlow, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.danger },
  restrictedTitle: { color: colors.danger, fontSize: 13, fontWeight: '800' },
  restrictedText: { color: colors.textPrimary, fontSize: 12, lineHeight: 17, marginTop: 3 },
  hint: { color: colors.textMuted, fontSize: 11.5, lineHeight: 16 },
});
