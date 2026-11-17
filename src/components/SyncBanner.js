import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSync } from '../offline/SyncContext';
import { useTheme } from '../theme/ThemeContext';

export default function SyncBanner() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { pending, failed, syncing, syncNow, dismissFailed } = useSync();
  if (!pending && !failed) return null;
  const styles = StyleSheet.create({
    bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingBottom: 8, paddingTop: 8 + insets.top, paddingHorizontal: 12, backgroundColor: failed ? colors.danger : colors.warning },
    text: { color: '#fff', fontSize: 12.5, fontWeight: '700' },
  });
  if (failed && !pending) {
    return <Pressable style={styles.bar} onPress={dismissFailed}><Text style={styles.text}>{t('sync.failed', { count: failed })} · {t('common.close')}</Text></Pressable>;
  }
  return (
    <Pressable style={styles.bar} onPress={syncNow} disabled={syncing}>
      {syncing ? <ActivityIndicator size="small" color="#fff" /> : <View />}
      <Text style={styles.text}>{syncing ? t('sync.syncing') : `${t('sync.pending', { count: pending })} · ${t('sync.tap')}`}</Text>
    </Pressable>
  );
}
