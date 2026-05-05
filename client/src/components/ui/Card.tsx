import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { theme } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'alt';
  bordered?: boolean;
}

export function Card({ children, style, variant = 'default', bordered = false }: CardProps) {
  return (
    <View
      style={[
        styles.base,
        variant === 'alt' && styles.alt,
        bordered && styles.bordered,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  alt: {
    backgroundColor: theme.colors.surfaceAlt,
  },
  bordered: {
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
});
