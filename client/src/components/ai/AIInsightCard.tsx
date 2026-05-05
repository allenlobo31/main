import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { theme } from '../../constants/theme';
import { AIInsight, PainTrend } from '../../types';
import { formatRelative } from '../../utils/dateHelpers';
import { Bot, TrendingUp, Minus, TrendingDown } from 'lucide-react-native';

interface AIInsightCardProps {
  insight: AIInsight;
}

const TREND_CONFIG: Record<PainTrend, { label: string; color: string; iconName: string }> = {
  improving: { label: 'Improving', color: theme.colors.successLight, iconName: 'TrendingUp' },
  stable: { label: 'Stable', color: theme.colors.textSecondary, iconName: 'Minus' },
  worsening: { label: 'Worsening', color: theme.colors.dangerLight, iconName: 'TrendingDown' },
};

const ICONS: Record<string, any> = { TrendingUp, Minus, TrendingDown };

export function AIInsightCard({ insight }: AIInsightCardProps) {
  const trendConfig = TREND_CONFIG[insight.painTrend];
  const TrendIcon = ICONS[trendConfig.iconName];

  return (
    <Card style={styles.card} bordered>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Bot size={20} color={theme.colors.textPrimary} strokeWidth={2} />
          <Text style={styles.title}>AI Health Monitor</Text>
        </View>
        <Text style={styles.timestamp}>{formatRelative(insight.generatedAt)}</Text>
      </View>

      <View style={styles.trendRow}>
        {TrendIcon && <TrendIcon size={18} color={trendConfig.color} strokeWidth={2} />}
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
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  timestamp: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    flexShrink: 1,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
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
