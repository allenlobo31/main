import { useCallback } from 'react';
import { useGamificationStore } from '../store/gamificationStore';
import { useAuthStore } from '../store/authStore';
import { BadgeId, Phase } from '../types';
import { XP_VALUES, BADGES } from '../constants/gamification';

export function useGamification() {
  const store = useGamificationStore();
  const { user } = useAuthStore();
  const uid = user?.uid;

  const awardXP = useCallback(
    async (action: keyof typeof XP_VALUES) => {
      if (!uid) return;
      await store.addXP(uid, XP_VALUES[action]);
    },
    [uid],
  );

  const earnBadge = useCallback(
    async (badgeId: BadgeId) => {
      if (!uid) return;
      await store.unlockBadge(uid, badgeId);
    },
    [uid],
  );

  const checkDailyStreak = useCallback(async () => {
    if (!uid) return;
    await store.checkStreak(uid);
  }, [uid]);

  const completeTask = useCallback(
    async (taskId: string, xpReward: number) => {
      if (!uid) return;
      await store.completeDailyTask(uid, taskId, xpReward);
    },
    [uid],
  );

  const transitionPhase = useCallback(
    async (nextPhase: Phase) => {
      if (!uid) return;
      // transitionPhase removed; no-op for compatibility
    },
    [uid],
  );

  const refresh = useCallback(async () => {
    if (!uid) return;
    await store.fetchProfile(uid);
  }, [uid]);

  return {
    profile: store.profile,
    xp: store.profile?.xp ?? 0,
    level: store.profile?.level ?? 1,
    streak: Math.max(store.profile?.streakDays ?? 1, 1),
    badges: store.profile?.badges ?? [],
    phase: store.profile?.phase ?? 'pre-op',
    tasksCompletedToday: store.profile?.tasksCompletedToday ?? [],
    awardXP,
    earnBadge,
    completeTask,
    checkDailyStreak,
    transitionPhase,
    refresh,
  };
}
