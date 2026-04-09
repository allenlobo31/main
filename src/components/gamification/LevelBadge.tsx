import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';
import { getLevelForXP } from '../../constants/gamification';
import { Ionicons } from '@expo/vector-icons';

interface LevelBadgeProps {
  xp: number;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_MAP = { sm: 32, md: 48, lg: 64 };
const FONT_MAP = { sm: 10, md: 14, lg: 18 };

export function LevelBadge({ xp, size = 'md' }: LevelBadgeProps) {
  const levelDef = getLevelForXP(xp);
  const dim = SIZE_MAP[size];
  const fontSize = FONT_MAP[size];

  return (
    <View style={[styles.badge, { width: dim, height: dim, borderRadius: dim / 2 }]}>
      <Text style={[styles.number, { fontSize }]}>{levelDef.level}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primaryLight,
  },
  number: {
    color: theme.colors.textPrimary,
    fontWeight: '800',
  },
});
