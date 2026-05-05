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
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  primary: { backgroundColor: `${theme.colors.primary}26`, borderColor: `${theme.colors.primary}55` },
  success: { backgroundColor: `${theme.colors.success}44`, borderColor: `${theme.colors.success}66` },
  danger: { backgroundColor: `${theme.colors.danger}26`, borderColor: `${theme.colors.danger}55` },
  warning: { backgroundColor: `${theme.colors.warning}26`, borderColor: `${theme.colors.warning}55` },
  muted: { backgroundColor: theme.colors.border, borderColor: theme.colors.border },
  label: { ...theme.typography.caption, fontWeight: '600' },
  primaryText: { color: theme.colors.primaryLight },
  successText: { color: theme.colors.successLight },
  dangerText: { color: theme.colors.dangerLight },
  warningText: { color: theme.colors.warning },
  mutedText: { color: theme.colors.textMuted },
});
