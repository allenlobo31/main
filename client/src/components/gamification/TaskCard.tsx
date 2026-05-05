import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../constants/theme';
import { Task } from '../../types';
import { Bandage, Pill, Camera, BarChart, Check } from 'lucide-react-native';

const TASK_ICONS: Record<string, any> = {
  Bandage,
  Pill,
  Camera,
  BarChart,
};

interface TaskCardProps {
  task: Task;
  onPress?: () => void;
  isManuallyCompletable?: boolean;
}

export function TaskCard({ task, onPress, isManuallyCompletable = true }: TaskCardProps) {
  return (
    <TouchableOpacity
      style={[styles.container, task.completed && styles.completed]}
      onPress={onPress}
      disabled={task.completed || !isManuallyCompletable}
      activeOpacity={isManuallyCompletable ? 0.7 : 1}
    >
      <View style={styles.left}>
        <View style={[styles.check, task.completed && styles.checkDone]}>
          {task.completed && <Check size={14} color="#fff" strokeWidth={3} />}
        </View>
        <View style={styles.iconWrap}>
          {TASK_ICONS[task.icon] ? React.createElement(TASK_ICONS[task.icon], { size: 18, color: theme.colors.textPrimary }) : null}
        </View>
        <View style={styles.labelContainer}>
          <Text style={[styles.label, task.completed && styles.labelDone]}>
            {task.label}
          </Text>
          {!isManuallyCompletable && !task.completed && (
            <Text style={styles.autoCompleteHint}>Auto-completes when you log data</Text>
          )}
        </View>
      </View>
      <View style={styles.xpChip}>
        <Text style={styles.xpText}>+{task.xpReward} XP</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexWrap: 'wrap',
    rowGap: theme.spacing.sm,
  },
  completed: {
    borderColor: theme.colors.success,
    backgroundColor: `${theme.colors.success}1A`,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.successLight,
  },
  iconWrap: { width: 24, alignItems: 'center' },
  labelContainer: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
  },
  labelDone: { color: theme.colors.textMuted, textDecorationLine: 'line-through' },
  autoCompleteHint: {
    ...theme.typography.caption,
    color: theme.colors.primaryLight,
    fontStyle: 'italic',
    marginTop: 2,
  },
  xpChip: {
    backgroundColor: `${theme.colors.primary}33`,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.full,
    marginLeft: 'auto',
  },
  xpText: {
    ...theme.typography.caption,
    color: theme.colors.primaryLight,
    fontWeight: '700',
  },
});
