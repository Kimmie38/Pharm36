import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { radius, type } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';

export default function Badge({ label, tone = 'neutral' }) {
  const { colors } = useTheme();
  const TONES = {
    success: { bg: 'rgba(46,204,129,0.14)', fg: colors.success },
    warning: { bg: 'rgba(232,163,61,0.14)', fg: colors.warning },
    danger: { bg: 'rgba(228,72,63,0.16)', fg: colors.danger },
    info: { bg: 'rgba(61,169,232,0.14)', fg: colors.info },
    neutral: { bg: colors.bgElevated2, fg: colors.textSecondary },
  };
  const t = TONES[tone] || TONES.neutral;
  const styles = makeStyles();
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <Text style={[styles.text, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

const makeStyles = () => StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, alignSelf: 'flex-start' },
  text: { ...type.tiny, textTransform: 'none' },
});
