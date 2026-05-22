import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../src/store/authStore';
import { useGamification } from '../../src/hooks/useGamification';
import { useGamificationStore } from '../../src/store/gamificationStore';
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
import { Hand, Hospital, Flame, Zap, Camera, Book, Phone, Shield, Activity, Star, CalendarClock, Trophy } from 'lucide-react-native';
import { surgeryCountdownLabel } from '../../src/utils/dateHelpers';

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

  const countdown = useMemo(
    () =>
      user?.surgeryStatus === 'scheduled'
        ? surgeryCountdownLabel(user?.scheduledSurgeryDate)
        : null,
    [user?.surgeryStatus, user?.scheduledSurgeryDate],
  );

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await gamification.refresh();
      await gamification.checkDailyStreak();
      
      // Auto-complete "Every day login" task
      const currentProfile = useGamificationStore.getState().profile;
      const completedToday = currentProfile?.tasksCompletedToday ?? [];
      const taskId = 'daily_logging';
      if (!completedToday.includes(taskId)) {
        await gamification.completeTask(taskId, 10);
      }
    } catch (error) {
      console.error('[Dashboard] pull to refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;

      const initializeGamification = async () => {
        try {
          await gamification.refresh();
          if (!isMounted) return;
          await gamification.checkDailyStreak();
          if (!isMounted) return;

          // Auto-complete "Every day login" task
          const currentProfile = useGamificationStore.getState().profile;
          const completedToday = currentProfile?.tasksCompletedToday ?? [];
          const taskId = 'daily_logging';
          if (!completedToday.includes(taskId)) {
            await gamification.completeTask(taskId, 10);
          }
        } catch (error) {
          console.error('[Dashboard] gamification focus init error:', error);
        }
      };

      void initializeGamification();

      return () => {
        isMounted = false;
      };
    }, [])
  );

  const phase = gamification.phase;
  const phaseConfig = PHASE_CONFIGS[phase];

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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] ?? 'there'}</Text>
              {/* <Hand size={20} color={theme.colors.textPrimary} strokeWidth={2} /> */}
            </View>
            <View style={styles.phaseChip}>
              <View style={[styles.phaseDot, { backgroundColor: phaseConfig.color }]} />
              <Text style={[styles.phaseText, { color: phaseConfig.color }]}>
                {phaseConfig.label}
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

        {/* Surgery Countdown */}
        {countdown && (
          <Card style={styles.countdownCard}>
            <View style={styles.countdownRow}>
              <View style={styles.countdownIconWrap}>
                <CalendarClock size={24} color={theme.colors.primary} />
              </View>
              <View style={styles.countdownText}>
                <Text style={styles.countdownLabel}>Surgery Countdown</Text>
                <Text style={styles.countdownValue}>{countdown}</Text>
              </View>
            </View>
          </Card>
        )}

        {/* XP Bar */}
        <Card style={styles.xpCard}>
          <XPBar xp={gamification.xp} />
        </Card>

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

        {/* Today's Tasks & Completed Tasks conditional view */}
        {pendingTasks.length === 0 ? (
          <Card style={styles.allCompletedCard}>
            <View style={styles.allCompletedRow}>
              <View style={styles.allCompletedIconWrap}>
                <Trophy size={28} color="#eab308" strokeWidth={2.5} />
              </View>
              <View style={styles.allCompletedText}>
                <Text style={styles.allCompletedTitle}>All Daily Tasks Completed!</Text>
                <Text style={styles.allCompletedSubtitle}>Amazing job! You've earned all XP and completed your daily streak check-in. Keep up the excellent work!</Text>
              </View>
            </View>
          </Card>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Today's tasks</Text>
            {pendingTasks.map((task) => {
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
            })}
          </>
        )}

        {/* Badges */}
        {gamification.badges.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Badges earned</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgesRow}>
              {gamification.badges.map((badgeId) => {
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
              })}
            </ScrollView>
          </>
        )}

        {pendingTasks.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Tasks completed today</Text>
            {completedTasks.length === 0 ? (
              <Text style={styles.noBadges}>No tasks completed yet.</Text>
            ) : (
              completedTasks.map((task) => <TaskCard key={`completed-${task.id}`} task={task} isManuallyCompletable={false} />)
            )}
          </>
        )}
      </ScrollView>
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
  xpCard: { 
    marginBottom: theme.spacing.md, 
    marginTop: theme.spacing.md, 
    paddingTop: theme.spacing.md,
    backgroundColor: '#e6f9ed',
  },
  statsRow: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.xl, flexWrap: 'wrap' },
  statsRowCompact: { rowGap: theme.spacing.sm },
  statCard: { 
    flex: 1, 
    padding: theme.spacing.md, 
    alignItems: 'center', 
    minWidth: 0,
    backgroundColor: '#e6f9ed',
  },
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
  reminderCard: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    padding: 0,
    overflow: 'hidden',
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: 12,
  },
  reminderIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderText: {
    flex: 1,
  },
  reminderTitle: {
    ...theme.typography.body,
    color: '#fff',
    fontWeight: '800',
  },
  reminderSubtitle: {
    ...theme.typography.caption,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  countdownCard: {
    marginBottom: theme.spacing.md,
    backgroundColor: '#ffffff',
    borderColor: '#000000',
    borderWidth: 2,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  countdownIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownText: {
    flex: 1,
  },
  countdownLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countdownValue: {
    ...theme.typography.body,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    fontSize: 16,
  },
  allCompletedCard: {
    backgroundColor: '#ffffff',
    borderColor: '#000000',
    borderWidth: 2,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.lg,
  },
  allCompletedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  allCompletedIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#fef9c3',
    borderWidth: 2,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  allCompletedText: {
    flex: 1,
  },
  allCompletedTitle: {
    ...theme.typography.body,
    fontWeight: '800',
    color: '#000000',
    fontSize: 16,
  },
  allCompletedSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
});
