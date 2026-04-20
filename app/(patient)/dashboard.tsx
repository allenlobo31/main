import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { useGamification } from '../../src/hooks/useGamification';
import { XPBar } from '../../src/components/gamification/XPBar';
import { StreakCounter } from '../../src/components/gamification/StreakCounter';
import { TaskCard } from '../../src/components/gamification/TaskCard';
import { Card } from '../../src/components/ui/Card';
import { Avatar } from '../../src/components/ui/Avatar';
import { Button } from '../../src/components/ui/Button';
import { theme } from '../../src/constants/theme';
import { useResponsiveLayout } from '../../src/hooks/useResponsiveLayout';
import { DAILY_TASKS, BADGES } from '../../src/constants/gamification';
import { PHASE_CONFIGS } from '../../src/constants/phases';
import { BadgeId } from '../../src/types';
import { surgeryCountdownLabel } from '../../src/utils/dateHelpers';
import { CalendarClock, Hand, Hospital, Flame, Zap, Camera, Book, Phone, Shield, Activity, Star } from 'lucide-react-native';

const BADGE_ICONS: Record<string, any> = {
  Hospital, Flame, Zap, Camera, Book, Phone, Shield, Activity, Star
};

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const gamification = useGamification();
  const { isCompact, horizontalPadding } = useResponsiveLayout();
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initializeGamification = async () => {
      await gamification.refresh();
      if (!isMounted) return;
      await gamification.checkDailyStreak();
    };

    void initializeGamification();

    return () => {
      isMounted = false;
    };
  }, []);

  const phase = gamification.phase;
  const phaseConfig = PHASE_CONFIGS[phase];
  const surgeryStageChip = useMemo(() => {
    const isPostOp = user?.surgeryStatus === 'completed';
    const config = PHASE_CONFIGS[isPostOp ? 'post-op' : 'pre-op'];
    return {
      label: config.label,
      color: config.color,
    };
  }, [user?.surgeryStatus]);
  const surgeryReminder = useMemo(() => {
    if (user?.surgeryStatus !== 'scheduled') return null;
    return surgeryCountdownLabel(user?.scheduledSurgeryDate);
  }, [user?.surgeryStatus, user?.scheduledSurgeryDate]);

  const tasks = useMemo(
    () =>
      DAILY_TASKS.map((t) => ({
        ...t,
        completed: gamification.tasksCompletedToday.includes(t.id),
      })),
    [gamification.tasksCompletedToday],
  );

  const pendingTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => task.completed);

  // Only medication_logged can be manually completed
  const isManuallyCompletable = (taskId: string): boolean => {
    return taskId === 'medication_logged';
  };

  const onCompleteTask = async (taskId: string, xpReward: number) => {
    if (!user?.uid) return;
    setCompletingTaskId(taskId);
    try {
      await gamification.completeTask(taskId, xpReward);
      setExpandedTaskId(null);
    } finally {
      setCompletingTaskId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingHorizontal: horizontalPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] ?? 'there'}</Text>
              {/* <Hand size={20} color={theme.colors.textPrimary} strokeWidth={2} /> */}
            </View>
            <View style={styles.phaseChip}>
              <View style={[styles.phaseDot, { backgroundColor: surgeryStageChip.color }]} />
              <Text style={[styles.phaseText, { color: surgeryStageChip.color }]}> 
                {surgeryStageChip.label}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.headerRight}
            activeOpacity={0.8}
            onPress={() => router.push('/(patient)/profile')}
          >
            <Avatar name={user?.name} size={40} />
          </TouchableOpacity>
        </View>

        {/* XP Bar */}
        <Card style={styles.xpCard}>
          <XPBar xp={gamification.xp} />
        </Card>

        {surgeryReminder ? (
          <Card style={styles.surgeryReminderCard}>
            <View style={styles.surgeryReminderRow}>
              <CalendarClock size={18} color={theme.colors.textPrimary} strokeWidth={2.2} />
              <View style={styles.surgeryReminderTextWrap}>
                <Text style={styles.surgeryReminderTitle}>Surgery Reminder</Text>
                <Text style={styles.surgeryReminderValue}>{surgeryReminder}</Text>
              </View>
            </View>
          </Card>
        ) : null}

        {/* Streak + Stats Row */}
        <View style={[styles.statsRow, isCompact && styles.statsRowCompact]}>
          <Card style={[styles.statCard, isCompact && styles.statCardCompact]}>
            <StreakCounter streak={gamification.streak} />
          </Card>
          <Card style={[styles.statCard, isCompact && styles.statCardCompact]}>
            <View style={styles.statCenter}>
              <Text style={styles.statValue}>{gamification.xp}</Text>
              <Text style={styles.statLabel}>Total XP</Text>
            </View>
          </Card>
          <Card style={[styles.statCard, isCompact && styles.statCardFull]}>
            <View style={styles.statCenter}>
              <Text style={styles.statValue}>{gamification.badges.length}</Text>
              <Text style={styles.statLabel}>Badges</Text>
            </View>
          </Card>
        </View>

        {/* Today's Tasks */}
        <Text style={styles.sectionTitle}>Today's tasks</Text>
        {pendingTasks.length === 0 ? (
          <Text style={styles.noBadges}>All daily tasks completed. Great job!</Text>
        ) : (
          pendingTasks.map((task) => {
            const isExpanded = expandedTaskId === task.id;
            const canManualComplete = isManuallyCompletable(task.id);
            return (
              <View key={task.id}>
                <TaskCard
                  task={task}
                  onPress={() => canManualComplete && setExpandedTaskId((current) => (current === task.id ? null : task.id))}
                  isManuallyCompletable={canManualComplete}
                />
                {isExpanded && canManualComplete ? (
                  <View style={styles.completeActionWrap}>
                    <Button
                      label="Completed"
                      onPress={() => onCompleteTask(task.id, task.xpReward)}
                      isLoading={completingTaskId === task.id}
                      style={styles.completeBtn}
                    />
                  </View>
                ) : null}
              </View>
            );
          })
        )}

        

        <Text style={styles.sectionTitle}>Tasks completed today</Text>
        {completedTasks.length === 0 ? (
          <Text style={styles.noBadges}>No tasks completed yet.</Text>
        ) : (
          completedTasks.map((task) => <TaskCard key={`completed-${task.id}`} task={task} isManuallyCompletable={false} />)
        )}


        {/* Badges */}
        {/* <Text style={styles.sectionTitle}>Badges earned</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgesRow}>
          {gamification.badges.length === 0 ? (
            <Text style={styles.noBadges}>Complete tasks to earn your first badge!</Text>
          ) : (
            gamification.badges.map((badgeId) => {
              const badge = BADGES[badgeId as BadgeId];
              const BadgeIcon = BADGE_ICONS[badge.icon];
              return (
                <View key={badgeId} style={styles.badgeItem}>
                  <View style={styles.badgeEmojiWrap}>
                    {BadgeIcon ? <BadgeIcon size={32} color={theme.colors.textPrimary} strokeWidth={1.5} /> : null}
                  </View>
                  <Text style={styles.badgeLabel}>{badge.label}</Text>
                </View>
              );
            })
          )}
        </ScrollView> */}

      </ScrollView>

      <TouchableOpacity
        style={styles.contactNowFab}
        activeOpacity={0.9}
        onPress={() => router.push('/(patient)/experts')}
      >
        <View style={styles.contactNowRow}>
          <Phone size={18} color={theme.colors.textPrimary} strokeWidth={2.2} />
          <Text style={styles.contactNowText}>Contact Now</Text>
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  container: { paddingTop: theme.spacing.lg, paddingBottom: theme.spacing.xxxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg, marginTop: theme.spacing.lg },
  headerLeft: { gap: 4 },
  greeting: { ...theme.typography.h2, color: theme.colors.textPrimary },
  phaseChip: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  phaseDot: { width: 8, height: 8, borderRadius: 4 },
  phaseText: { ...theme.typography.caption, fontWeight: '700' },
  headerRight: { alignItems: 'center', justifyContent: 'center' },
  xpCard: { marginBottom: theme.spacing.md, marginTop: theme.spacing.md, paddingTop: theme.spacing.md },
  surgeryReminderCard: {
    marginBottom: theme.spacing.md,
    backgroundColor: '#f3f8fc',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  surgeryReminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  surgeryReminderTextWrap: {
    flex: 1,
  },
  surgeryReminderTitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontWeight: '700',
  },
  surgeryReminderValue: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    fontWeight: '700',
    marginTop: 2,
  },
  statsRow: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.xl, flexWrap: 'wrap' },
  statsRowCompact: { rowGap: theme.spacing.sm },
  statCard: { flex: 1, padding: theme.spacing.md, alignItems: 'center', minWidth: 0 },
  statCardCompact: { flexBasis: '48%' },
  statCardFull: { flexBasis: '100%' },
  statCenter: { alignItems: 'center' },
  statValue: { ...theme.typography.h2, color: theme.colors.textPrimary, fontWeight: '800' },
  statLabel: { ...theme.typography.caption, color: theme.colors.textMuted, marginTop: 2 },
  sectionTitle: { ...theme.typography.h3, color: theme.colors.textPrimary, marginBottom: theme.spacing.sm, marginTop: theme.spacing.lg },
  badgesRow: { marginTop: theme.spacing.xs },
  completeActionWrap: {
    marginTop: -theme.spacing.xs,
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
  },
  completeBtn: {
    backgroundColor: theme.colors.success,
    alignSelf: 'flex-start',
    minHeight: 40,
    paddingHorizontal: theme.spacing.lg,
  },
  badgeItem: { alignItems: 'center', marginRight: theme.spacing.md, width: 68, marginBottom: theme.spacing.sm },
  badgeEmojiWrap: { height: 40, justifyContent: 'center', marginBottom: 4 },
  badgeLabel: { ...theme.typography.caption, color: theme.colors.textMuted, textAlign: 'center' },
  noBadges: { ...theme.typography.caption, color: theme.colors.textMuted, fontStyle: 'italic' },
  contactNowFab: {
    position: 'absolute',
    right: theme.spacing.lg,
    bottom: 92,
    backgroundColor: '#f3f8fc',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    minHeight: 54,
    minWidth: 170,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    elevation: 4,
  },
  contactNowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  contactNowText: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
  },
});
