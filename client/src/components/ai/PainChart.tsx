import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, TouchableOpacity, ScrollView } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { theme } from '../../constants/theme';
import { SymptomEntry } from '../../types';
import { format } from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react-native';

interface PainChartProps {
  entries: SymptomEntry[];
}

export function PainChart({ entries }: PainChartProps) {
  const { width } = useWindowDimensions();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const chartWidth = Math.max(width - 64, 280);

  // Chevron navigation handlers
  const handlePrev = () => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() - 1);
      return next;
    });
  };

  const handleNext = () => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + 1);
      return next;
    });
  };

  // Determine if next button is disabled (cannot view future dates)
  const isNextDisabled = useMemo(() => {
    const today = new Date();
    return selectedDate.toDateString() === today.toDateString() || selectedDate > today;
  }, [selectedDate]);

  // Format header label based on active period
  const dateHeaderLabel = useMemo(() => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (selectedDate.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (selectedDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return format(selectedDate, 'EEEE, MMM d, yyyy');
  }, [selectedDate]);

  // Group and filter entries based on Day view
  const dayEntries = useMemo(() => {
    return entries.filter((e) => {
      const entryDate = new Date(e.date);
      return entryDate.toDateString() === selectedDate.toDateString();
    });
  }, [entries, selectedDate]);

  // Sort day check-ins chronologically (oldest to newest for graphing left-to-right)
  const chronDayEntries = useMemo(() => {
    return [...dayEntries].reverse();
  }, [dayEntries]);

  // Stats calculation for the metric banner
  const dayStats = useMemo(() => {
    if (dayEntries.length === 0) return { avg: 0, peak: 0, count: 0 };
    const painLevels = dayEntries.map((e) => e.painLevel);
    const sum = painLevels.reduce((acc, v) => acc + v, 0);
    const avg = Math.round((sum / painLevels.length) * 10) / 10;
    const peak = Math.max(...painLevels);
    return { avg, peak, count: painLevels.length };
  }, [dayEntries]);

  // Day Chart Data
  const dayChartData = useMemo(() => {
    if (chronDayEntries.length === 0) return null;

    const mapPainLevel = (level: number) => {
      if (level <= 4) return 1; // Mild (1)
      if (level <= 7) return 5; // Medium (5)
      return 9; // High (9)
    };

    let labels = chronDayEntries.map((e) => format(new Date(e.date), 'HH:mm'));
    let data = chronDayEntries.map((e) => mapPainLevel(e.painLevel));

    if (data.length === 1) {
      labels = ['', labels[0]];
      data = [data[0], data[0]];
    }

    return { labels, data, isEmpty: false };
  }, [chronDayEntries]);

  // Fallback Empty Chart Data
  const fallbackChartData = useMemo(() => {
    return {
      labels: ['08:00', '12:00', '16:00', '20:00'],
      data: [1, 1, 1, 1],
      isEmpty: true,
    };
  }, []);

  const chartToRender = dayChartData || fallbackChartData;



  return (
    <View style={styles.container}>
      {/* 2. Date Navigation with Chevrons */}
      <View style={styles.dateNavContainer}>
        <TouchableOpacity style={styles.chevronButton} onPress={handlePrev} activeOpacity={0.7}>
          <ChevronLeft color="#000000" size={20} strokeWidth={2.5} />
        </TouchableOpacity>
        
        <Text style={styles.dateNavText} numberOfLines={1}>
          {dateHeaderLabel}
        </Text>
        
        <TouchableOpacity 
          style={[styles.chevronButton, isNextDisabled && styles.chevronButtonDisabled]} 
          onPress={handleNext} 
          disabled={isNextDisabled}
          activeOpacity={0.7}
        >
          <ChevronRight color={isNextDisabled ? '#a0a0a0' : '#000000'} size={20} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* 3. Large Metric Display Header */}
      <View style={styles.metricContainer}>
        <View style={styles.metricHeaderBadge}>
          <Text style={styles.metricHeaderBadgeText}>DAILY AVERAGE</Text>
        </View>
        {dayStats.count > 0 ? (
          <View style={styles.metricValueRow}>
            <Text style={styles.metricValue}>{dayStats.avg}</Text>
            <Text style={styles.metricLabel}>/ 10</Text>
          </View>
        ) : (
          <Text style={styles.metricEmptyValue}>No Logs Yet</Text>
        )}
        <Text style={styles.bannerExcludes}>Excludes days with no recorded logs</Text>
      </View>

      {/* 4. Graph Visualizer */}
      <View style={styles.chartShadowContainer}>
        <View style={styles.chartBorderContainer}>
          <LineChart
            data={{
              labels: chartToRender.labels,
              datasets: [
                {
                  data: chartToRender.data,
                  color: (opacity = 1) => chartToRender.isEmpty 
                    ? 'rgba(0, 0, 0, 0)' 
                    : `rgba(0, 0, 0, ${opacity})`,
                  strokeWidth: chartToRender.isEmpty ? 0 : 3,
                  withDots: !chartToRender.isEmpty,
                },
                {
                  // Force Y-axis scale to exactly 1 to 9
                  data: chartToRender.data.map((_, idx) => idx === 0 ? 1 : idx === chartToRender.data.length - 1 ? 9 : 1),
                  withDots: false,
                  strokeWidth: 0,
                  color: () => 'rgba(0, 0, 0, 0)',
                },
              ],
            }}
            width={chartWidth}
            height={180}
            yAxisSuffix=""
            yAxisInterval={1}
            fromZero={false}
            segments={2}
            withHorizontalLines={true}
            withVerticalLines={false}
            formatYLabel={(yValue) => {
              const val = Math.round(parseFloat(yValue));
              if (val === 9) return 'High';
              if (val === 5) return 'Medium';
              if (val === 1) return 'Mild';
              return '';
            }}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: () => '#000000',
              labelColor: () => '#000000',
              style: {
                borderRadius: 12,
              },
              propsForDots: {
                r: '5.5',
                strokeWidth: '2.5',
                stroke: '#000000',
                fill: '#ffffff',
              },
              propsForBackgroundLines: {
                strokeWidth: 1,
                stroke: '#cbd5e1', // clean slate gray grid lines
                strokeDasharray: '4, 4',
              },
              propsForLabels: {
                fontSize: 10,
                fontWeight: '800',
                fill: '#000000',
              },
              // Custom shadow config to completely eliminate background curves/shadows
              useShadowColorFromDataset: true,
              fillShadowGradient: 'transparent',
              fillShadowGradientOpacity: 0,
              fillShadowGradientFromOpacity: 0,
              fillShadowGradientToOpacity: 0,
            }}
            bezier={!chartToRender.isEmpty}
            withShadow={false}
            style={styles.chart}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#e6f9ed',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  toggleContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: theme.borderRadius.full,
    flexDirection: 'row',
    padding: 3,
    marginBottom: theme.spacing.md,
    alignSelf: 'stretch',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: theme.spacing.xs + 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.full,
  },
  toggleButtonActive: {
    backgroundColor: '#000000',
  },
  toggleText: {
    ...theme.typography.caption,
    fontWeight: '700',
    color: '#000000',
  },
  toggleTextActive: {
    color: '#ffffff',
  },
  dateNavContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  chevronButton: {
    width: 36,
    height: 36,
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: theme.borderRadius.sm,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  chevronButtonDisabled: {
    borderColor: '#a0a0a0',
    backgroundColor: '#f5f5f5',
    shadowOpacity: 0,
    elevation: 0,
  },
  dateNavText: {
    ...theme.typography.body,
    fontWeight: '800',
    color: '#000000',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: theme.spacing.sm,
  },
  metricContainer: {
    alignSelf: 'stretch',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  metricHeaderBadge: {
    backgroundColor: '#000000',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.sm - 4,
    marginBottom: 6,
  },
  metricHeaderBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  metricValue: {
    fontSize: 34,
    fontWeight: '800',
    color: '#000000',
  },
  metricEmptyValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#000000',
    marginBottom: theme.spacing.xs,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#404040',
    marginLeft: theme.spacing.xs,
  },
  metricSubtitle: {
    ...theme.typography.caption,
    fontWeight: '700',
    color: '#303030',
    marginTop: 2,
  },
  bannerExcludes: {
    fontSize: 9,
    fontWeight: '600',
    color: '#606060',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  chartShadowContainer: {
    alignSelf: 'center',
    marginVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  chartBorderContainer: {
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: '#000000',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  chart: {
    alignSelf: 'center',
  },
  emptyState: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: theme.spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1.5,
    borderColor: '#000000',
    borderStyle: 'dashed',
    borderRadius: theme.borderRadius.md,
    marginVertical: theme.spacing.xs,
  },
  emptyText: {
    ...theme.typography.body,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
  },
  emptySubText: {
    ...theme.typography.caption,
    color: '#404040',
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
});
