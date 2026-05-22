import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GamificationProfile, BadgeId, Phase } from '../types';
import apiClient from '../services/apiClient';

interface GamificationState {
  profile: GamificationProfile | null;
}

interface GamificationActions {
  setProfile: (profile: GamificationProfile | null) => void;
  fetchProfile: (userId: string) => Promise<void>;
  addXP: (userId: string, amount: number) => Promise<void>;
  completeDailyTask: (userId: string, taskId: string, xpReward: number) => Promise<void>;
  unlockBadge: (userId: string, badgeId: BadgeId) => Promise<void>;
  checkStreak: (userId: string) => Promise<void>;
}

export const useGamificationStore = create<GamificationState & GamificationActions>()(
  persist(
    (set, get) => ({
      profile: null,
      setProfile: (profile) => set({ profile }),
      fetchProfile: async (userId) => {
        try {
          const response = await apiClient.get('/users/me');
          set({ profile: response.data });
        } catch (error) {
          console.error('[GamificationStore] fetchProfile error:', error);
        }
      },
      addXP: async (userId, amount) => {
        try {
          const response = await apiClient.put('/users/profile', { 
            xp: (get().profile?.xp || 0) + amount 
          });
          set({ profile: response.data });
        } catch (error) {
          console.error('[GamificationStore] addXP error:', error);
        }
      },
      completeDailyTask: async (userId, taskId, xpReward) => {
        try {
          const newXP = (get().profile?.xp || 0) + xpReward;
          const response = await apiClient.put('/users/profile', { 
            xp: newXP,
            $addToSet: { tasksCompletedToday: taskId } 
          });
          set({ profile: response.data });
        } catch (error) {
          console.error('[GamificationStore] completeDailyTask error:', error);
        }
      },
      unlockBadge: async (userId, badgeId) => {
        try {
          const response = await apiClient.put('/users/profile', { 
            $addToSet: { badges: badgeId } 
          });
          set({ profile: response.data });
        } catch (error) {
          console.error('[GamificationStore] unlockBadge error:', error);
        }
      },
      checkStreak: async (userId) => {
        try {
          const response = await apiClient.post('/users/check-streak');
          set((state) => {
            if (state.profile) {
              return {
                profile: {
                  ...state.profile,
                  streakDays: response.data.streakDays,
                },
              };
            }
            return state;
          });
        } catch (error) {
          console.error('[GamificationStore] checkStreak error:', error);
        }
      }
    }),
    {
      name: 'herniacare-gamification',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);