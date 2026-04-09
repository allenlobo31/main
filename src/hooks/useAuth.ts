import { useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import {
  subscribeToAuthState,
  fetchUserRole,
} from '../services/firebase/auth';
import {
  db,
  userDoc,
  getDoc,
} from '../services/firebase/firestore';
import {
  registerForPushNotifications,
  scheduleDailyReminder,
} from '../services/notifications/pushService';
import { User } from '../types';

export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    store.setLoading(true);

    const unsubscribe = subscribeToAuthState(async (fbUser) => {
      try {
        if (fbUser) {
          const role = await fetchUserRole(fbUser.uid);
          const snap = await getDoc(userDoc(fbUser.uid));
          const userData: User | null = snap.exists()
            ? (snap.data() as User)
            : null;
          store.setUser(userData, role);

          // Register push token and daily reminder
          await registerForPushNotifications(fbUser.uid);
          await scheduleDailyReminder();
        } else {
          store.setUser(null, null);
        }
      } finally {
        store.setLoading(false);
        store.setInitialized();
      }
    });

    return unsubscribe;
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      await store.login(email, password);
    },
    [],
  );

  const logout = useCallback(async () => {
    await store.logout();
  }, []);

  return {
    user: store.user,
    role: store.role,
    isLoading: store.isLoading,
    isInitialized: store.isInitialized,
    isAuthenticated: !!store.user,
    login,
    logout,
  };
}
