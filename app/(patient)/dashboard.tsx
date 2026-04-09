import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/authStore';
import { useGamification } from '../../src/hooks/useGamification';
import { XPBar } from '../../src/components/gamification/XPBar';
import { LevelBadge } from '../../src/components/gamification/LevelBadge';
import { StreakCounter } from '../../src/components/gamification/StreakCounter';
import { TaskCard } from '../../src/components/gamification/TaskCard';
import { Card } from '../../src/components/ui/Card';
import { Avatar } from '../../src/components/ui/Avatar';
import { theme } from '../../src/constants/theme';
import { useResponsiveLayout } from '../../src/hooks/useResponsiveLayout';
import { DAILY_TASKS, BADGES } from '../../src/constants/gamification';
import { PHASE_CONFIGS } from '../../src/constants/phases';
import { BadgeId } from '../../src/types';

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const gamification = useGamification();
  const { isCompact, horizontalPadding } = useResponsiveLayout();

  useEffect(() => {
    gamification.refresh();
    gamification.checkDailyStreak();
  }, []);

  const phase = gamification.phase;
  const phaseConfig = PHASE_CONFIGS[phase];

  const tasks = DAILY_TASKS.map((t) => ({
    ...t,
    completed: gamification.tasksCompletedToday.includes(t.id),
  }));

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingHorizontal: horizontalPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Hey, {user?.name?.split(' ')[0] ?? 'there'} 👋</Text>
            <View style={styles.phaseChip}>
              <View style={[styles.phaseDot, { backgroundColor: phaseConfig.color }]} />
              <Text style={[styles.phaseText, { color: phaseConfig.color }]}>
                {phaseConfig.label}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <LevelBadge xp={gamification.xp} size="md" />
            <Avatar uri={user?.avatarUrl} name={user?.name} size={40} />
          </View>
        </View>

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

        {/* Today's Tasks */}
        <Text style={styles.sectionTitle}>Today's tasks</Text>
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}

        {/* Badges */}
        <Text style={styles.sectionTitle}>Badges earned</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgesRow}>
          {gamification.badges.length === 0 ? (
            <Text style={styles.noBadges}>Complete tasks to earn your first badge!</Text>
          ) : (
            gamification.badges.map((badgeId) => {
              const badge = BADGES[badgeId as BadgeId];
              return (
                <View key={badgeId} style={styles.badgeItem}>
                  <Text style={styles.badgeEmoji}>{badge.icon}</Text>
                  <Text style={styles.badgeLabel}>{badge.label}</Text>
                </View>
              );
            })
          )}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  container: { paddingTop: theme.spacing.lg, paddingBottom: theme.spacing.xxxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg },
  headerLeft: { gap: 4 },
  greeting: { ...theme.typography.h2, color: theme.colors.textPrimary },
  phaseChip: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  phaseDot: { width: 8, height: 8, borderRadius: 4 },
  phaseText: { ...theme.typography.caption, fontWeight: '700' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  xpCard: { marginBottom: theme.spacing.md },
  statsRow: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.xl, flexWrap: 'wrap' },
  statsRowCompact: { rowGap: theme.spacing.sm },
  statCard: { flex: 1, padding: theme.spacing.md, alignItems: 'center', minWidth: 0 },
  statCardCompact: { flexBasis: '48%' },
  statCardFull: { flexBasis: '100%' },
  statCenter: { alignItems: 'center' },
  statValue: { ...theme.typography.h2, color: theme.colors.textPrimary, fontWeight: '800' },
  statLabel: { ...theme.typography.caption, color: theme.colors.textMuted, marginTop: 2 },
  sectionTitle: { ...theme.typography.h3, color: theme.colors.textPrimary, marginBottom: theme.spacing.sm, marginTop: theme.spacing.sm },
  badgesRow: { marginTop: theme.spacing.xs },
  badgeItem: { alignItems: 'center', marginRight: theme.spacing.md, width: 60 },
  badgeEmoji: { fontSize: 32, marginBottom: 4 },
  badgeLabel: { ...theme.typography.caption, color: theme.colors.textMuted, textAlign: 'center' },
  noBadges: { ...theme.typography.caption, color: theme.colors.textMuted, fontStyle: 'italic' },
});
