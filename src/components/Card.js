import React from 'react';
import { View, StyleSheet } from 'react-native';
import { radius, spacing } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';

export default function Card({ children, style }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  return <View style={[styles.card, style]}>{children}</View>;
}

const makeStyles = (colors) => StyleSheet.create({
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
});
