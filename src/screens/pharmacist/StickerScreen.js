import React from 'react';
import { View, Text, StyleSheet, ScrollView, Share, Platform } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useTranslation } from 'react-i18next';
import Button from '../../components/Button';
import ScreenHeader from '../../components/ScreenHeader';
import { spacing, type, radius } from '../../theme/theme';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../auth/AuthContext';
import { API_BASE_URL } from '../../api/client';

// The QR points at the backend's public page /p/<id>, which always shows the live registration status.
export const pharmacyUrl = (id) => `${API_BASE_URL.replace(/\/api$/, '')}/p/${id}`;

export default function StickerScreen({ navigation }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { user } = useAuth();
  const url = pharmacyUrl(user?.id);
  const council = user?.profession?.councilShort || 'PCN';

  const share = () => Share.share({ message: `${user?.storeName || user?.name} · ${url}`, url });
  const print = () => (Platform.OS === 'web' && typeof window !== 'undefined' ? window.print() : share());

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title={t('sticker.title')} subtitle={t('sticker.sub')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, alignItems: 'center' }}>
        <View style={styles.sticker}>
          <Text style={styles.brand}>Pharm36</Text>
          <Text style={styles.store}>{user?.storeName || user?.name}</Text>
          <Text style={styles.reg}>{council} · {[user?.location, user?.state].filter(Boolean).join(', ')}</Text>
          <View style={styles.qr}><QRCode value={url} size={210} /></View>
          <Text style={styles.scan}>{t('sticker.scanMe')}</Text>
        </View>
        <Text style={styles.note}>{t('sticker.note')}</Text>
        <View style={{ width: '100%', gap: spacing.sm }}>
          <Button label={t('sticker.print')} onPress={print} />
          <Button label={t('sticker.share')} onPress={share} />
        </View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  sticker: { backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.xl, alignItems: 'center', width: '100%', maxWidth: 340, borderWidth: 6, borderColor: colors.green },
  brand: { color: '#0b6b4b', fontSize: 22, fontWeight: '900', letterSpacing: 0.5 },
  store: { color: '#111', fontSize: 18, fontWeight: '800', marginTop: 6, textAlign: 'center' },
  reg: { color: '#444', ...type.small, marginTop: 2, textAlign: 'center' },
  qr: { marginVertical: spacing.md },
  scan: { color: '#111', fontWeight: '700', textAlign: 'center' },
  note: { color: colors.textMuted, ...type.small, textAlign: 'center', marginVertical: spacing.md },
});
