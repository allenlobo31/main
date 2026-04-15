import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { theme } from '../../constants/theme';
import { getLevelForXP, getXPProgressInLevel } from '../../constants/gamification';

interface XPBarProps {
  xp: number;
}

export function XPBar({ xp }: XPBarProps) {
  const levelDef = getLevelForXP(xp);
  const progress = getXPProgressInLevel(xp);
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animValue, {
      toValue: progress,
      useNativeDriver: false,
      tension: 60,
      friction: 8,
    }).start();
  }, [progress]);

  const widthInterp = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  const nextXP =
    levelDef.maxXP === Infinity ? '∞' : String(levelDef.maxXP + 1);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.levelLabel}>
          Lv {levelDef.level} · {levelDef.title}
        </Text>
        <Text style={styles.xpLabel}>{xp} XP</Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { width: widthInterp }]} />
      </View>
      <View style={styles.footer}>
        <Text style={styles.subLabel}>{levelDef.minXP}</Text>
        <Text style={styles.subLabel}>{nextXP}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  levelLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  xpLabel: {
    ...theme.typography.caption,
    color: theme.colors.primaryLight,
    fontWeight: '700',
  },
  track: {
    height: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  fill: {
    height: '100%',
    backgroundColor: '#ADD8E6',
    borderRadius: theme.borderRadius.full,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xs,
  },
  subLabel: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
});
