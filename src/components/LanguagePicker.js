import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, setLanguage } from '../i18n';
import { useTheme } from '../theme/ThemeContext';
import { radius } from '../theme/theme';

export default function LanguagePicker({ style }) {
  const { i18n } = useTranslation();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  return (
    <View style={[styles.row, style]}>
      {LANGUAGES.map((l) => {
        const active = i18n.language === l.code;
        return (
          <Pressable key={l.code} onPress={() => setLanguage(l.code)} style={[styles.chip, active && styles.chipActive]} accessibilityRole="button" accessibilityState={{ selected: active }}>
            <Text style={[styles.text, active && styles.textActive]}>{l.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.bgElevated2, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: 'rgba(31,174,116,0.16)', borderColor: colors.green },
  text: { color: colors.textSecondary, fontSize: 12.5, fontWeight: '600' },
  textActive: { color: colors.greenLight },
});
