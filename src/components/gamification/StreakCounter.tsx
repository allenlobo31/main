import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { theme } from '../../constants/theme';

interface StreakCounterProps {
  streak: number;
}

export function StreakCounter({ streak }: StreakCounterProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (streak === 0) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    ).start();
    return () => pulseAnim.stopAnimation();
  }, [streak]);

  return (
    <View style={styles.container}>
      <Animated.Text
        style={[styles.flame, { transform: [{ scale: pulseAnim }] }]}
      >
        🔥
      </Animated.Text>
      <Text style={styles.count}>{streak}</Text>
      <Text style={styles.label}>day streak</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  flame: { fontSize: 28 },
  count: {
    ...theme.typography.h2,
    color: theme.colors.warning,
    fontWeight: '800',
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
});
