import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';
import { DiaryEntry as DiaryEntryType, MoodType } from '../../types';
import { formatDate } from '../../utils/dateHelpers';

const MOOD_CONFIG: Record<MoodType, { emoji: string; color: string }> = {
  great: { emoji: '😄', color: theme.colors.successLight },
  good: { emoji: '🙂', color: theme.colors.accent },
  okay: { emoji: '😐', color: theme.colors.textMuted },
  bad: { emoji: '😟', color: theme.colors.warning },
  terrible: { emoji: '😣', color: theme.colors.dangerLight },
};

interface DiaryEntryProps {
  entry: DiaryEntryType;
}

export function DiaryEntry({ entry }: DiaryEntryProps) {
  const moodCfg = MOOD_CONFIG[entry.mood];

  return (
    <View style={styles.container}>
      <View style={[styles.moodBar, { backgroundColor: moodCfg.color }]} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.dateText}>{formatDate(entry.date)}</Text>
          <Text style={styles.moodEmoji}>{moodCfg.emoji}</Text>
        </View>
        <Text style={styles.text}>{entry.text}</Text>
        {entry.aiSummary ? (
          <Text style={styles.aiSummary}>🤖 {entry.aiSummary}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  moodBar: { width: 4 },
  content: { flex: 1, padding: theme.spacing.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  dateText: { ...theme.typography.caption, color: theme.colors.textMuted, fontWeight: '600' },
  moodEmoji: { fontSize: 18 },
  text: { ...theme.typography.body, color: theme.colors.textSecondary, lineHeight: 20 },
  aiSummary: {
    ...theme.typography.caption,
    color: theme.colors.primaryLight,
    marginTop: theme.spacing.sm,
    fontStyle: 'italic',
  },
});
