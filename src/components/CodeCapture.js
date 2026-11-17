import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Input from './Input';
import Button from './Button';
import { spacing, type, radius } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { showMessage } from '../utils/ui';

// Camera barcode scanner with a typed-code fallback. Used by both the pharmacist and consumer flows.
export default function CodeCapture({ title, buttonLabel, onCode, onClose }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [permission, requestPermission] = useCameraPermissions();
  const [code, setCode] = useState('');
  const handled = useRef(false);

  const finish = (value) => {
    const clean = String(value || '').trim();
    if (clean.length < 3) return showMessage(t('scan.needCode'));
    if (handled.current) return undefined;
    handled.current = true;
    return onCode(clean);
  };

  const granted = permission?.granted;
  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}><Ionicons name="close" size={24} color="#fff" /></Pressable>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.cameraBox}>
        {granted ? (
          <>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr', 'datamatrix', 'itf14'] }}
              onBarcodeScanned={({ data }) => finish(data)}
            />
            <View style={styles.frame} pointerEvents="none" />
          </>
        ) : (
          <View style={styles.noCamera}>
            <Ionicons name="camera-outline" size={34} color={colors.greenLight} />
            <Text style={styles.hint}>{t('scan.cameraOff')}</Text>
            {permission?.canAskAgain !== false && <Button label={t('scan.allow')} onPress={requestPermission} />}
          </View>
        )}
      </View>
      {granted && <Text style={styles.hint}>{t('scan.hint')}</Text>}

      <View style={styles.form}>
        <Input label={t('scan.typeInstead')} placeholder={t('scan.placeholder')} value={code} onChangeText={setCode} icon="barcode-outline" autoCapitalize="none" />
        <Button label={buttonLabel} onPress={() => finish(code)} />
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  closeBtn: { position: 'absolute', top: 56, right: spacing.lg, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  title: { color: '#fff', ...type.h2, textAlign: 'center', marginBottom: spacing.md, marginTop: 40 },
  cameraBox: { width: '100%', height: 260, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center' },
  frame: { position: 'absolute', width: '78%', height: '45%', borderWidth: 2, borderColor: colors.greenLight, borderRadius: 12 },
  noCamera: { alignItems: 'center', gap: 10, padding: spacing.md },
  hint: { color: 'rgba(255,255,255,0.7)', ...type.small, marginTop: 8, textAlign: 'center', lineHeight: 19 },
  form: { width: '100%', backgroundColor: colors.bgElevated, padding: spacing.md, borderRadius: radius.md, marginTop: spacing.md },
});
