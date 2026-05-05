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
        const response = await apiClient.get('/users/me');
        set({ profile: response.data });
      },
      addXP: async (userId, amount) => {
        const response = await apiClient.put('/users/profile', { 
          xp: (get().profile?.xp || 0) + amount 
        });
        set({ profile: response.data });
      },
      completeDailyTask: async (userId, taskId, xpReward) => {
        // Implementation for MongoDB backend would go here
        // For now, updating local profile via API
        const newXP = (get().profile?.xp || 0) + xpReward;
        const response = await apiClient.put('/users/profile', { 
          xp: newXP,
          $addToSet: { tasksCompletedToday: taskId } 
        });
        set({ profile: response.data });
      },
      unlockBadge: async (userId, badgeId) => {
        const response = await apiClient.put('/users/profile', { 
          $addToSet: { badges: badgeId } 
        });
        set({ profile: response.data });
      },
      checkStreak: async (userId) => {
        // Logic to check streak on server
        await apiClient.post('/users/check-streak');
      }
    }),
    {
      name: 'herniacare-gamification',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);