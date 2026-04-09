import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { theme } from '../../constants/theme';
import { AIInsight, PainTrend } from '../../types';
import { formatRelative } from '../../utils/dateHelpers';

interface AIInsightCardProps {
  insight: AIInsight;
}

const TREND_CONFIG: Record<PainTrend, { label: string; color: string; emoji: string }> = {
  improving: { label: 'Improving', color: theme.colors.successLight, emoji: '📈' },
  stable: { label: 'Stable', color: theme.colors.textSecondary, emoji: '📊' },
  worsening: { label: 'Worsening', color: theme.colors.dangerLight, emoji: '📉' },
};

export function AIInsightCard({ insight }: AIInsightCardProps) {
  const trendConfig = TREND_CONFIG[insight.painTrend];

  return (
    <Card style={styles.card} bordered>
      <View style={styles.header}>
        <Text style={styles.title}>🤖 AI Health Monitor</Text>
        <Text style={styles.timestamp}>{formatRelative(insight.generatedAt)}</Text>
      </View>

      <View style={styles.trendRow}>
        <Text style={styles.trendEmoji}>{trendConfig.emoji}</Text>
        <Text style={[styles.trendLabel, { color: trendConfig.color }]}>
          Pain trend: {trendConfig.label}
        </Text>
      </View>

      <Text style={styles.recommendation}>{insight.recommendation}</Text>

      {insight.flags.length > 0 && (
        <View style={styles.flagsRow}>
          {insight.flags.map((flag, i) => (
            <Badge key={i} label={flag} variant="warning" />
          ))}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: theme.spacing.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  timestamp: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  trendEmoji: { fontSize: 18 },
  trendLabel: {
    ...theme.typography.body,
    fontWeight: '600',
  },
  recommendation: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  flagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
});
