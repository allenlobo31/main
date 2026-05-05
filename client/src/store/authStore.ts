import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole } from '../types';
import {
  loginUser,
  logoutUser,
  registerUser,
} from '../services/authService';

import { setAuthToken } from '../services/apiClient';

interface AuthState {
  user: User | null;
  role: UserRole | null;
  token: string | null;
  isLoading: boolean;
  isInitialized: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (params: {
    email: string;
    password: string;
    name: string;
    role: UserRole;
  }) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null, role: UserRole | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      role: null,
      token: null,
      isLoading: false,
      isInitialized: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { user, token } = await loginUser({ email, password });
          set({ user, role: user.role, token, isLoading: false });
        } finally {
          set({ isLoading: false });
        }
      },

      register: async ({ email, password, name, role }) => {
        set({ isLoading: true });
        try {
          const { user, token } = await registerUser({ email, password, name, role });
          set({
            user: { ...user, profileSetupCompleted: false }, // Ensure profileSetupCompleted is false for new users
            role: user.role,
            token,
            isLoading: false,
          });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await logoutUser();
          set({ user: null, role: null, token: null });
        } finally {
          set({ isLoading: false });
        }
      },

      setUser: (user, role) => set({ user, role }),
      setLoading: (loading) => set({ isLoading: loading }),
      setInitialized: () => set({ isInitialized: true }),
      updateProfile: (updates) => {
        const current = get().user;
        if (current) set({ user: { ...current, ...updates } });
      },
    }),
    {
      name: 'herniacare-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user, role: state.role, token: state.token }),
      onRehydrateStorage: () => (state, error) => {
        if (state) {
          if (state.token) {
            setAuthToken(state.token);
          }
          if (state.user && !state.user.uid) {
            state.user.uid = (state.user as any).id || (state.user as any)._id;
          }
          state.setInitialized();
        }
      },
    },
  ),
);
