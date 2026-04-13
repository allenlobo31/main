import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../constants/theme';
import { MoodType } from '../../types';

import { Laugh, Smile, Meh, Frown, Annoyed } from 'lucide-react-native';

const MOODS: Array<{ value: MoodType; iconName: string; label: string }> = [
  { value: 'great', iconName: 'Laugh', label: 'Great' },
  { value: 'good', iconName: 'Smile', label: 'Good' },
  { value: 'okay', iconName: 'Meh', label: 'Okay' },
  { value: 'bad', iconName: 'Frown', label: 'Bad' },
  { value: 'terrible', iconName: 'Annoyed', label: 'Terrible' },
];

const ICONS: Record<string, any> = { Laugh, Smile, Meh, Frown, Annoyed };

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
            {ICONS[m.iconName] && React.createElement(ICONS[m.iconName], { size: 24, strokeWidth: 1.5, color: selected === m.value ? theme.colors.primaryLight : theme.colors.textMuted, style: { marginBottom: 4 } })}
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
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs },
  option: {
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexBasis: '18%',
    flexGrow: 1,
    minWidth: 86,
    backgroundColor: theme.colors.surfaceAlt,
  },
  selected: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}22`,
  },
  optLabel: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  optLabelSelected: { color: theme.colors.primaryLight },
});
