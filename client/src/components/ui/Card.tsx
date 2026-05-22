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
    backgroundColor: '#ffffff',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 2,
    borderColor: '#000000',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  alt: {
    backgroundColor: '#ffffff',
  },
  bordered: {
    borderWidth: 2,
    borderColor: '#000000',
  },
});
