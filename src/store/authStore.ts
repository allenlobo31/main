import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole } from '../types';
import { db, userDoc, getDoc } from '../services/firebase/firestore';
import {
  loginUser,
  logoutUser,
  registerUser,
  fetchUserRole,
} from '../services/firebase/auth';

interface AuthState {
  user: User | null;
  role: UserRole | null;
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
      isLoading: false,
      isInitialized: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const fbUser = await loginUser({ email, password });
          const role = await fetchUserRole(fbUser.uid);
          const snap = await getDoc(userDoc(fbUser.uid));
          const userData = snap.exists() ? (snap.data() as User) : null;
          set({ user: userData, role, isLoading: false });
        } finally {
          set({ isLoading: false });
        }
      },

      register: async ({ email, password, name, role }) => {
        set({ isLoading: true });
        try {
          const fbUser = await registerUser({ email, password, name, role });
          const snap = await getDoc(userDoc(fbUser.uid));
          const userData = snap.exists() ? (snap.data() as User) : null;
          set({ user: userData, role, isLoading: false });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await logoutUser();
          set({ user: null, role: null });
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
      partialize: (state) => ({ user: state.user, role: state.role }),
    },
  ),
);
