import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { theme } from '../../constants/theme';
import { SymptomEntry } from '../../types';

interface SymptomFlagAlertProps {
  entry: SymptomEntry;
  onPress?: () => void;
}

export function SymptomFlagAlert({ entry, onPress }: SymptomFlagAlertProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.9, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Animated.View
        style={[styles.container, { transform: [{ scale: pulseAnim }] }]}
      >
        <Text style={styles.icon}>⚠️</Text>
        <View style={styles.content}>
          <Text style={styles.title}>Flag Detected</Text>
          <Text style={styles.reason} numberOfLines={2}>
            {entry.aiFlagReason ?? 'Your AI monitor has flagged a concern.'}
          </Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.danger}22`,
    borderWidth: 1,
    borderColor: theme.colors.danger,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    flexWrap: 'wrap',
  },
  icon: { fontSize: 22 },
  content: { flex: 1 },
  title: {
    ...theme.typography.body,
    color: theme.colors.dangerLight,
    fontWeight: '700',
    marginBottom: 2,
  },
  reason: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  arrow: {
    fontSize: 22,
    color: theme.colors.dangerLight,
  },
});
