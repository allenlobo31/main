import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GamificationProfile,
  BadgeId,
  Phase,
} from '../types';
import {
  db,
  gamificationDoc,
  runTransaction,
  getDoc,
  setDoc,
  arrayUnion,
  serverTimestamp,
} from '../services/firebase/firestore';
import { todayDateString } from '../utils/dateHelpers';
import { getLevelForXP } from '../constants/gamification';
import { getStreakStatus } from '../utils/dateHelpers';

const handledFirestoreCodes = new Set<string>();

function getFirebaseCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return String((error as { code?: unknown }).code ?? '');
  }
  return '';
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function isNonFatalFirestoreIssue(error: unknown): boolean {
  const code = getFirebaseCode(error);
  const msg = getErrorMessage(error);
  if (code === 'unavailable' || code === 'failed-precondition' || code === 'unimplemented') {
    return true;
  }
  return (
    msg.includes('client is offline') ||
    msg.includes('database (default) does not exist') ||
    msg.includes('Database \'(default)\' not found')
  );
}

function logFirestoreIssue(scope: string, error: unknown): void {
  const code = getFirebaseCode(error) || 'unknown';
  const key = `${scope}:${code}`;
  const msg = getErrorMessage(error);

  if (isNonFatalFirestoreIssue(error)) {
    if (!handledFirestoreCodes.has(key)) {
      handledFirestoreCodes.add(key);
      console.warn(`[GamificationStore] ${scope} skipped: ${msg}`);
    }
    return;
  }

  console.error(`[GamificationStore] ${scope} error:`, error);
}

interface GamificationState {
  profile: GamificationProfile | null;
}

interface GamificationActions {
  setProfile: (profile: GamificationProfile | null) => void;
  addXP: (userId: string, amount: number) => Promise<void>;
  checkStreak: (userId: string) => Promise<void>;
  completeDailyTask: (userId: string, taskId: string, xpReward: number) => Promise<void>;
  unlockBadge: (userId: string, badgeId: BadgeId) => Promise<void>;
  transitionPhase: (userId: string, nextPhase: Phase) => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
}

function buildDefaultProfile(): Omit<GamificationProfile, 'lastCheckIn'> & { lastCheckIn: ReturnType<typeof serverTimestamp> } {
  const now = todayDateString();
  return {
    xp: 0,
    level: 1,
    streakDays: 1,
    lastCheckIn: serverTimestamp(),
    badges: [],
    phase: 'pre-op',
    surgeryDate: null,
    tasksCompletedToday: [],
    lastTaskResetDate: now,
  };
}

export const useGamificationStore = create<GamificationState & GamificationActions>()(
  persist(
    (set, get) => ({
      profile: null,

      setProfile: (profile) => set({ profile }),

      fetchProfile: async (userId) => {
        const ref = gamificationDoc(userId);
        try {
          let snap = await getDoc(ref);

          if (!snap.exists()) {
            await setDoc(ref as never, buildDefaultProfile() as never, { merge: true } as never);
            snap = await getDoc(ref);
          }

          if (!snap.exists()) return;

          const data = snap.data() as GamificationProfile;
          const today = todayDateString();
          const resetNeeded = data.lastTaskResetDate !== today;

          if (resetNeeded) {
            await setDoc(
              ref as never,
              {
                tasksCompletedToday: [],
                lastTaskResetDate: today,
              } as never,
              { merge: true },
            );
            const refreshed = await getDoc(ref);
            if (refreshed.exists()) {
              set({ profile: refreshed.data() as GamificationProfile });
            }
            return;
          }

          set({ profile: data });
        } catch (error) {
          logFirestoreIssue('fetchProfile', error);
        }
      },

      addXP: async (userId, amount) => {
        try {
          const ref = gamificationDoc(userId);
          await runTransaction(db, async (tx) => {
            const snap = await tx.get(ref as never);
            if (!snap.exists()) return;
            const current = snap.data() as GamificationProfile;
            const newXP = (current.xp ?? 0) + amount;
            const newLevel = getLevelForXP(newXP).level;
            tx.update(ref as never, {
              xp: newXP,
              level: newLevel,
            });
          });
          // Sync local state
          const updated = await getDoc(ref);
          if (updated.exists()) set({ profile: updated.data() as GamificationProfile });
        } catch (error) {
          logFirestoreIssue('addXP', error);
        }
      },

      checkStreak: async (userId) => {
        try {
          const ref = gamificationDoc(userId);
          await runTransaction(db, async (tx) => {
            const snap = await tx.get(ref as never);
            if (!snap.exists()) return;
            const current = snap.data() as GamificationProfile;
            const status = getStreakStatus(current.lastCheckIn);

            if (status === 'already_checked') return;

            let newStreak: number;
            if (status === 'increment') {
              newStreak = Math.max(current.streakDays ?? 0, 0) + 1;
            } else {
              newStreak = 1; // reset
            }

            tx.update(ref as never, {
              streakDays: newStreak,
              lastCheckIn: serverTimestamp(),
            });
          });
          // Sync local
          const updated = await getDoc(ref);
          if (updated.exists()) set({ profile: updated.data() as GamificationProfile });
        } catch (error) {
          logFirestoreIssue('checkStreak', error);
        }
      },

      completeDailyTask: async (userId, taskId, xpReward) => {
        try {
          const ref = gamificationDoc(userId);
          await runTransaction(db, async (tx) => {
            const snap = await tx.get(ref as never);
            const today = todayDateString();

            if (!snap.exists()) {
              const newXP = xpReward;
              tx.set(
                ref as never,
                {
                  ...buildDefaultProfile(),
                  xp: newXP,
                  level: getLevelForXP(newXP).level,
                  tasksCompletedToday: [taskId],
                  lastTaskResetDate: today,
                  badges: ['first_checkin'],
                } as never,
                { merge: true } as never,
              );
              return;
            }

            const current = snap.data() as GamificationProfile;
            const completedToday = current.lastTaskResetDate === today
              ? current.tasksCompletedToday ?? []
              : [];

            if (completedToday.includes(taskId)) {
              return;
            }

            const updatedCompleted = [...completedToday, taskId];
            const newXP = (current.xp ?? 0) + xpReward;
            const newLevel = getLevelForXP(newXP).level;
            const shouldUnlockFirstBadge =
              updatedCompleted.length === 1 && !(current.badges ?? []).includes('first_checkin');

            tx.update(ref as never, {
              xp: newXP,
              level: newLevel,
              tasksCompletedToday: updatedCompleted,
              lastTaskResetDate: today,
              ...(shouldUnlockFirstBadge ? { badges: arrayUnion('first_checkin') } : {}),
            });
          });

          const updated = await getDoc(ref);
          if (updated.exists()) set({ profile: updated.data() as GamificationProfile });
        } catch (error) {
          logFirestoreIssue('completeDailyTask', error);
        }
      },

      unlockBadge: async (userId, badgeId) => {
        const current = get().profile;
        if (current?.badges.includes(badgeId)) return; // already unlocked — prevent duplicate

        try {
          const ref = gamificationDoc(userId);
          await runTransaction(db, async (tx) => {
            const snap = await tx.get(ref as never);
            if (!snap.exists()) return;
            const data = snap.data() as GamificationProfile;
            if (data.badges.includes(badgeId)) return; // double-check in transaction
            tx.update(ref as never, {
              badges: arrayUnion(badgeId),
            });
          });
          // Sync
          const updated = await getDoc(ref);
          if (updated.exists()) set({ profile: updated.data() as GamificationProfile });
        } catch (error) {
          logFirestoreIssue('unlockBadge', error);
        }
      },

      transitionPhase: async (userId, nextPhase) => {
        try {
          const ref = gamificationDoc(userId);
          await runTransaction(db, async (tx) => {
            const snap = await tx.get(ref as never);
            if (!snap.exists()) return;
            tx.update(ref as never, { phase: nextPhase });
          });
          const updated = await getDoc(ref);
          if (updated.exists()) set({ profile: updated.data() as GamificationProfile });
        } catch (error) {
          logFirestoreIssue('transitionPhase', error);
        }
      },
    }),
    {
      name: 'herniacare-gamification',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ profile: state.profile }),
    },
  ),
);
