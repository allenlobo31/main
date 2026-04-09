import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { theme } from '../../constants/theme';
import { SymptomEntry } from '../../types';
import { formatDate } from '../../utils/dateHelpers';

interface PainChartProps {
  entries: SymptomEntry[];
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export function PainChart({ entries }: PainChartProps) {
  const last7 = entries.slice(0, 7).reverse();

  if (last7.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Log symptoms to see your pain trend chart</Text>
      </View>
    );
  }

  const labels = last7.map((e) => formatDate(e.date).slice(0, 3));
  const data = last7.map((e) => e.painLevel);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pain Level Trend</Text>
      <LineChart
        data={{
          labels,
          datasets: [{ data, color: () => theme.colors.primary }],
        }}
        width={SCREEN_WIDTH - 48}
        height={160}
        yAxisSuffix=""
        yAxisInterval={1}
        fromZero
        chartConfig={{
          backgroundColor: theme.colors.surface,
          backgroundGradientFrom: theme.colors.surface,
          backgroundGradientTo: theme.colors.surfaceAlt,
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(124, 110, 247, ${opacity})`,
          labelColor: () => theme.colors.textMuted,
          propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: theme.colors.primaryLight,
          },
        }}
        bezier
        style={styles.chart}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: theme.spacing.md },
  title: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  chart: { borderRadius: theme.borderRadius.md },
  empty: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  emptyText: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
});
