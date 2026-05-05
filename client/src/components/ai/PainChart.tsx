import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { theme } from '../../constants/theme';
import { SymptomEntry } from '../../types';
import { isToday, isYesterday, format } from 'date-fns';

interface PainChartProps {
  entries: SymptomEntry[];
}

export function PainChart({ entries }: PainChartProps) {
  const { width } = useWindowDimensions();
  const last7 = entries.slice(0, 7).reverse();
  const chartWidth = Math.max(width - 32, 280);

  if (last7.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Log symptoms to see your pain trend chart</Text>
      </View>
    );
  }

  const labels = last7.map((e) => {
    const d = new Date(e.date);
    return format(d, 'HH:mm');
  });
  const data = last7.map((e) => e.painLevel);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pain Level Trend</Text>
      <LineChart
        data={{
          labels,
          datasets: [
            { 
              data, 
              color: (opacity = 1) => `rgba(124, 110, 247, ${opacity})`,
              strokeWidth: 3
            },
            {
              data: [0, 10], // Force 0-10 range
              withDots: false,
              color: () => 'transparent'
            }
          ],
        }}
        width={chartWidth}
        height={220}
        yAxisSuffix=""
        yAxisInterval={1}
        fromZero
        segments={5}
        formatYLabel={(yValue) => {
          const val = Math.round(parseFloat(yValue));
          if (val >= 10) return 'Severe';
          if (val >= 8) return 'High';
          if (val >= 6) return 'Med';
          if (val >= 4) return 'Mild';
          if (val >= 2) return 'Low';
          return 'None';
        }}
        chartConfig={{
          backgroundColor: theme.colors.surface,
          backgroundGradientFrom: theme.colors.surface,
          backgroundGradientTo: theme.colors.surfaceAlt,
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(124, 110, 247, ${opacity})`,
          labelColor: () => theme.colors.textMuted,
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: '6',
            strokeWidth: '3',
            stroke: '#ffffff',
          },
          propsForBackgroundLines: {
            strokeDasharray: '5, 5', // dashed lines
            stroke: `${theme.colors.border}88`,
          },
          propsForLabels: {
            fontSize: 10,
          }
        }}
        bezier={last7.length > 1}
        style={styles.chart}
      />
      <View style={styles.dateRow}>
        {last7.length > 0 && (
          <Text style={styles.dateRangeText}>
            {format(new Date(last7[0].date), 'MMM d')} — {format(new Date(last7[last7.length-1].date), 'MMM d')}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: theme.spacing.md, alignItems: 'center' },
  title: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  chart: { borderRadius: theme.borderRadius.md, alignSelf: 'center' },
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
  dateRow: {
    marginTop: theme.spacing.xs,
    alignItems: 'center',
  },
  dateRangeText: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: '600',
  },
});
