import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';

type BadgeVariant = 'primary' | 'success' | 'danger' | 'warning' | 'muted';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export function Badge({ label, variant = 'primary' }: BadgeProps) {
  return (
    <View style={[styles.base, styles[variant]]}>
      <Text style={[styles.label, styles[`${variant}Text`]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
  },
  primary: { backgroundColor: `${theme.colors.primary}33` },
  success: { backgroundColor: `${theme.colors.success}55` },
  danger: { backgroundColor: `${theme.colors.danger}33` },
  warning: { backgroundColor: `${theme.colors.warning}33` },
  muted: { backgroundColor: theme.colors.border },
  label: { ...theme.typography.caption, fontWeight: '600' },
  primaryText: { color: theme.colors.primaryLight },
  successText: { color: theme.colors.successLight },
  dangerText: { color: theme.colors.dangerLight },
  warningText: { color: theme.colors.warning },
  mutedText: { color: theme.colors.textMuted },
});
