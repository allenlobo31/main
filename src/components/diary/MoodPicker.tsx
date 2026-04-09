import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../constants/theme';
import { MoodType } from '../../types';

const MOODS: Array<{ value: MoodType; emoji: string; label: string }> = [
  { value: 'great', emoji: '😄', label: 'Great' },
  { value: 'good', emoji: '🙂', label: 'Good' },
  { value: 'okay', emoji: '😐', label: 'Okay' },
  { value: 'bad', emoji: '😟', label: 'Bad' },
  { value: 'terrible', emoji: '😣', label: 'Terrible' },
];

interface MoodPickerProps {
  selected: MoodType | null;
  onSelect: (mood: MoodType) => void;
}

export function MoodPicker({ selected, onSelect }: MoodPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>How are you feeling?</Text>
      <View style={styles.row}>
        {MOODS.map((m) => (
          <TouchableOpacity
            key={m.value}
            style={[styles.option, selected === m.value && styles.selected]}
            onPress={() => onSelect(m.value)}
            activeOpacity={0.7}
          >
            <Text style={styles.emoji}>{m.emoji}</Text>
            <Text style={[styles.optLabel, selected === m.value && styles.optLabelSelected]}>
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: theme.spacing.md },
  label: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.sm,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  option: {
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flex: 1,
    marginHorizontal: 2,
    backgroundColor: theme.colors.surfaceAlt,
  },
  selected: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}22`,
  },
  emoji: { fontSize: 22, marginBottom: 2 },
  optLabel: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  optLabelSelected: { color: theme.colors.primaryLight },
});
