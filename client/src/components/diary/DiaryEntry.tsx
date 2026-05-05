import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';
import { DiaryEntry as DiaryEntryType, MoodType } from '../../types';
import { formatDate } from '../../utils/dateHelpers';
import { Laugh, Smile, Meh, Frown, Annoyed, Bot } from 'lucide-react-native';

const MOOD_CONFIG: Record<MoodType, { iconName: string; color: string }> = {
  great: { iconName: 'Laugh', color: theme.colors.successLight },
  good: { iconName: 'Smile', color: theme.colors.accent },
  okay: { iconName: 'Meh', color: theme.colors.textMuted },
  bad: { iconName: 'Frown', color: theme.colors.warning },
  terrible: { iconName: 'Annoyed', color: theme.colors.dangerLight },
};

const ICONS: Record<string, any> = { Laugh, Smile, Meh, Frown, Annoyed };

interface DiaryEntryProps {
  entry: DiaryEntryType;
}

export function DiaryEntry({ entry }: DiaryEntryProps) {
  const moodCfg = MOOD_CONFIG[entry.mood];
  const Icon = ICONS[moodCfg?.iconName];
  const isHealthMonitorEntry = entry.text?.startsWith('Health Monitor Report') ?? false;

  return (
    <View style={styles.container}>
      <View style={[styles.moodBar, { backgroundColor: moodCfg.color }]} />
      <View style={styles.content}>
        {isHealthMonitorEntry ? (
          <View style={styles.sourceTag}>
            <Bot size={12} color={theme.colors.primaryLight} strokeWidth={1.8} />
            <Text style={styles.sourceTagText}>Health Monitor</Text>
          </View>
        ) : null}
        <View style={styles.header}>
          <Text style={styles.dateText}>{formatDate(entry.date)}</Text>
          {Icon && <Icon size={20} color={moodCfg.color} strokeWidth={2} />}
        </View>
        <Text style={styles.text}>{entry.text}</Text>
        {entry.aiSummary ? (
          <View style={styles.aiSummaryRow}>
            <Bot size={14} color={theme.colors.primaryLight} strokeWidth={1.5} style={{ marginTop: 2 }} />
            <Text style={styles.aiSummary}>{entry.aiSummary}</Text>
          </View>
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
  sourceTag: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}44`,
    backgroundColor: `${theme.colors.primary}1f`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: theme.spacing.xs,
  },
  sourceTagText: {
    ...theme.typography.caption,
    color: theme.colors.primaryLight,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  dateText: { ...theme.typography.caption, color: theme.colors.textMuted, fontWeight: '600' },
  text: { ...theme.typography.body, color: theme.colors.textSecondary, lineHeight: 20 },
  aiSummaryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: theme.spacing.sm },
  aiSummary: {
    ...theme.typography.caption,
    color: theme.colors.primaryLight,
    fontStyle: 'italic',
    flex: 1,
  },
});
