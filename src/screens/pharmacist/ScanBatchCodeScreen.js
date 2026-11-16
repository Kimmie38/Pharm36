import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { spacing, type, radius } from '../../theme/theme';
import { useTheme } from '../../theme/ThemeContext';
import { showMessage } from '../../utils/ui';

export default function ScanBatchCodeScreen({ navigation, route }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [code, setCode] = useState('');
  const save = () => {
    if (code.trim().length < 3) return showMessage('Enter a batch code', 'Type the code printed on the medicine batch.');
    route.params?.onScanned?.(code.trim());
    navigation.goBack();
  };
  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pressable onPress={() => navigation.goBack()} style={styles.closeBtn} hitSlop={10}><Ionicons name="close" size={24} color="#fff" /></Pressable>
      <View style={styles.icon}><Ionicons name="barcode-outline" size={44} color={colors.greenLight} /></View>
      <Text style={styles.title}>Enter batch code</Text>
      <Text style={styles.subtitle}>Camera barcode scanning is not connected yet. Type the batch code from the pack.</Text>
      <View style={styles.form}><Input label="Batch code" placeholder="e.g. 5012345678901" value={code} onChangeText={setCode} icon="barcode-outline" autoCapitalize="none" /><Button label="Use this code" onPress={save} /></View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  closeBtn: { position: 'absolute', top: 56, right: spacing.lg, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  icon: { width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(31,174,116,0.13)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.green }, title: { color: '#fff', ...type.h2, textAlign: 'center' }, subtitle: { color: 'rgba(255,255,255,0.7)', ...type.small, marginTop: 8, marginBottom: spacing.xl, textAlign: 'center', lineHeight: 19 }, form: { width: '100%', backgroundColor: colors.bgElevated, padding: spacing.md, borderRadius: radius.md },
});
