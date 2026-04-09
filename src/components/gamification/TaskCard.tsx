import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../constants/theme';
import { Task } from '../../types';

interface TaskCardProps {
  task: Task;
  onPress?: () => void;
}

export function TaskCard({ task, onPress }: TaskCardProps) {
  return (
    <TouchableOpacity
      style={[styles.container, task.completed && styles.completed]}
      onPress={onPress}
      disabled={task.completed}
      activeOpacity={0.7}
    >
      <View style={styles.left}>
        <View style={[styles.check, task.completed && styles.checkDone]}>
          {task.completed && <Text style={styles.checkMark}>✓</Text>}
        </View>
        <Text style={styles.icon}>{task.icon}</Text>
        <Text style={[styles.label, task.completed && styles.labelDone]}>
          {task.label}
        </Text>
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
    opacity: 0.55,
    borderColor: theme.colors.success,
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
  checkMark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  icon: { fontSize: 18 },
  label: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    flex: 1,
    minWidth: 0,
  },
  labelDone: { color: theme.colors.textMuted, textDecorationLine: 'line-through' },
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
