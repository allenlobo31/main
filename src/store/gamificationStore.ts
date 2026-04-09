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
  arrayUnion,
  increment,
  serverTimestamp,
} from '../services/firebase/firestore';
import { doc } from 'firebase/firestore';
import { getLevelForXP } from '../constants/gamification';
import { getStreakStatus } from '../utils/dateHelpers';
import { Timestamp } from 'firebase/firestore';

interface GamificationState {
  profile: GamificationProfile | null;
}

interface GamificationActions {
  setProfile: (profile: GamificationProfile | null) => void;
  addXP: (userId: string, amount: number) => Promise<void>;
  checkStreak: (userId: string) => Promise<void>;
  unlockBadge: (userId: string, badgeId: BadgeId) => Promise<void>;
  transitionPhase: (userId: string, nextPhase: Phase) => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
}

export const useGamificationStore = create<GamificationState & GamificationActions>()(
  persist(
    (set, get) => ({
      profile: null,

      setProfile: (profile) => set({ profile }),

      fetchProfile: async (userId) => {
        try {
          const snap = await getDoc(gamificationDoc(userId));
          if (snap.exists()) {
            set({ profile: snap.data() as GamificationProfile });
          }
        } catch (error) {
          console.error('[GamificationStore] fetchProfile error:', error);
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
          console.error('[GamificationStore] addXP error:', error);
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
              newStreak = (current.streakDays ?? 0) + 1;
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
          console.error('[GamificationStore] checkStreak error:', error);
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
          console.error('[GamificationStore] unlockBadge error:', error);
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
          console.error('[GamificationStore] transitionPhase error:', error);
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
