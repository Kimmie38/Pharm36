import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Input from '../../components/Input';
import Button from '../../components/Button';
import ScreenHeader from '../../components/ScreenHeader';
import { spacing, type, radius } from '../../theme/theme';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../api/client';
import { apiErrorMessage, showMessage } from '../../utils/ui';
import { drugCategories as fallbackCategories } from '../../data/mockData';
import { useTranslation } from 'react-i18next';
import { useSync } from '../../offline/SyncContext';
import { newClientId } from '../../offline/outbox';

const REMINDERS = ['1 year', '6 months', '3 months', '1 month', '2 weeks', '1 week'];

export default function DataInputScreen({ navigation }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { user } = useAuth();
  const { queueWrite } = useSync();
  const clientId = useRef(newClientId());
  const [form, setForm] = useState({ drugName: '', manufactureDate: '', expiryDate: '', price: '', quantity: '', batchCode: '', manufacturer: '', strength: '', form: '', nafdacNo: '' });
  const [reminder, setReminder] = useState(user?.settings?.defaultReminder || '1 month');
  const [category, setCategory] = useState('general');
  const [loading, setLoading] = useState(false);
  const categories = user?.categories?.length ? user.categories : fallbackCategories.map((item) => ({ ...item, allowed: item.requiredSections.length === 0 }));
  const selectedCategory = categories.find((item) => item.key === category) || categories[0];
  const isAllowed = selectedCategory?.allowed !== false;
  const update = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));

  const handleScan = () => navigation.navigate('ScanBatchCode', { onScanned: (code) => update('batchCode')(code) });

  const handleSave = async () => {
    if (!isAllowed) return showMessage('Category restricted', `This account needs council-confirmed section access to add ${selectedCategory?.label || 'this category'}.`);
    if (!form.drugName.trim() || !form.expiryDate.trim() || !form.batchCode.trim() || !form.quantity.trim()) {
      return showMessage(t('add.missingTitle'), t('add.missing'));
    }
    setLoading(true);
    try {
      const payload = {
        clientId: clientId.current,
        nafdacNo: form.nafdacNo.trim() || undefined,
        drugName: form.drugName.trim(),
        category,
        batchCode: form.batchCode.trim(),
        manufactureDate: form.manufactureDate.trim() || undefined,
        expiryDate: form.expiryDate.trim(),
        price: form.price.trim() || '0',
        quantity: form.quantity.trim(),
        reminder,
        manufacturer: form.manufacturer.trim() || undefined,
        strength: form.strength.trim() || undefined,
        form: form.form.trim() || undefined,
      };
      try {
        await api.post('batches', payload);
        showMessage(t('add.savedTitle'), t('add.savedBody', { name: form.drugName }));
      } catch (error) {
        if (error?.status !== 0) throw error;
        // Offline: keep it on the phone; the same clientId makes the later upload safe to retry.
        await queueWrite({ path: 'batches', method: 'POST', body: payload, label: form.drugName });
        showMessage(t('add.queuedTitle'), t('add.queuedBody', { name: form.drugName }));
      }
      navigation.goBack();
    } catch (error) {
      showMessage('Could not save batch', apiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title={t('add.title')} subtitle={t('add.subtitle')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>{t('add.category')}</Text>
        <View style={styles.categoryRow}>
          {categories.map((item) => {
            const locked = !item.allowed;
            const active = category === item.key;
            return (
              <Pressable key={item.key} onPress={() => setCategory(item.key)} style={[styles.chip, active && (locked ? styles.chipActiveLocked : styles.chipActive)]}>
                {locked && <Ionicons name="lock-closed" size={11} color={active ? '#fff' : colors.textMuted} style={{ marginRight: 4 }} />}
                <Text style={[styles.chipText, active && (locked ? styles.chipTextActiveLocked : styles.chipTextActive)]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
        {!isAllowed && (
          <View style={styles.restrictedBox}>
            <Ionicons name="alert-circle" size={20} color={colors.danger} />
            <View style={{ flex: 1 }}><Text style={styles.restrictedTitle}>Restricted category</Text><Text style={styles.restrictedText}>Your council must confirm one of these sections: {(selectedCategory?.requiredSectionLabels || []).join(' or ')}.</Text></View>
          </View>
        )}

        <Text style={styles.label}>{t('add.batchCode')}</Text>
        <Pressable style={styles.scanBox} onPress={handleScan}>
          {form.batchCode ? <><Ionicons name="checkmark-circle" size={20} color={colors.success} /><Text style={styles.scanCode}>{form.batchCode}</Text><Text style={styles.rescan}>{t('add.rescan')}</Text></> : <><View style={styles.scanIconWrap}><Ionicons name="barcode-outline" size={22} color={colors.greenLight} /></View><View style={{ flex: 1 }}><Text style={styles.scanTitle}>{t('add.scanTitle')}</Text><Text style={styles.scanSub}>{t('add.scanSub')}</Text></View><Ionicons name="chevron-forward" size={20} color={colors.textMuted} /></>}
        </Pressable>
        <Input label={t('add.manual')} placeholder="e.g. 5012345678901" value={form.batchCode} onChangeText={update('batchCode')} icon="barcode-outline" autoCapitalize="none" />
        <Input label={t('add.nafdac')} placeholder="A4-1234" value={form.nafdacNo} onChangeText={update('nafdacNo')} icon="shield-checkmark-outline" autoCapitalize="characters" />
        <Text style={styles.hint}>{t('add.nafdacHint')}</Text>
        <Input label={t('add.drugName')} placeholder="e.g. Amoxicillin 500mg" value={form.drugName} onChangeText={update('drugName')} icon="medical-outline" />
        <Input label={t('add.manufacturer')} placeholder="Manufacturer" value={form.manufacturer} onChangeText={update('manufacturer')} icon="business-outline" />
        <View style={styles.dateRow}><View style={{ flex: 1 }}><Input label={t('add.strength')} placeholder="500mg" value={form.strength} onChangeText={update('strength')} /></View><View style={{ width: spacing.sm }} /><View style={{ flex: 1 }}><Input label={t('add.form')} placeholder="Capsule" value={form.form} onChangeText={update('form')} /></View></View>
        <View style={styles.dateRow}><View style={{ flex: 1 }}><Input label={t('add.mfgDate')} placeholder="YYYY-MM-DD" value={form.manufactureDate} onChangeText={update('manufactureDate')} icon="calendar-outline" /></View><View style={{ width: spacing.sm }} /><View style={{ flex: 1 }}><Input label={t('add.expDate')} placeholder="YYYY-MM-DD" value={form.expiryDate} onChangeText={update('expiryDate')} icon="calendar-outline" /></View></View>
        <View style={styles.dateRow}><View style={{ flex: 1 }}><Input label={t('add.price')} placeholder="0.00" value={form.price} onChangeText={update('price')} icon="cash-outline" keyboardType="numeric" /></View><View style={{ width: spacing.sm }} /><View style={{ flex: 1 }}><Input label={t('add.quantity')} placeholder="0" value={form.quantity} onChangeText={update('quantity')} icon="layers-outline" keyboardType="numeric" /></View></View>
        <Text style={styles.label}>{t('add.reminder')}</Text>
        <View style={styles.reminderRow}>{REMINDERS.map((value) => <Pressable key={value} onPress={() => setReminder(value)} style={[styles.chip, reminder === value && styles.chipActive]}><Text style={[styles.chipText, reminder === value && styles.chipTextActive]}>{value}</Text></Pressable>)}</View>
        <Text style={styles.hint}>{t('add.reminderHint')}</Text>
        <Button label={loading ? t('add.saving') : isAllowed ? t('add.save') : 'Category restricted'} onPress={handleSave} disabled={!isAllowed || loading} loading={loading} style={{ marginTop: spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  label: { color: colors.textSecondary, ...type.small, marginBottom: 8, marginTop: spacing.sm, fontWeight: '600' },
  scanBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.bgElevated, borderWidth: 1.5, borderColor: colors.green, borderStyle: 'dashed', borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  scanIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(31,174,116,0.14)', alignItems: 'center', justifyContent: 'center' }, scanTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' }, scanSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 }, scanCode: { flex: 1, color: colors.textPrimary, fontSize: 14, fontWeight: '600', letterSpacing: 0.5 }, rescan: { color: colors.greenLight, fontSize: 12, fontWeight: '700' },
  dateRow: { flexDirection: 'row' }, categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.sm }, reminderRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill, backgroundColor: colors.bgElevated2, borderWidth: 1, borderColor: colors.border }, chipActive: { backgroundColor: 'rgba(31,174,116,0.16)', borderColor: colors.green }, chipActiveLocked: { backgroundColor: colors.danger, borderColor: colors.danger }, chipText: { color: colors.textSecondary, fontSize: 12.5, fontWeight: '600' }, chipTextActive: { color: colors.greenLight }, chipTextActiveLocked: { color: '#fff' },
  restrictedBox: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: colors.dangerGlow, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.danger }, restrictedTitle: { color: colors.danger, fontSize: 13, fontWeight: '800' }, restrictedText: { color: colors.textPrimary, fontSize: 12, lineHeight: 17, marginTop: 3 }, hint: { color: colors.textMuted, fontSize: 11.5, lineHeight: 16 },
});
