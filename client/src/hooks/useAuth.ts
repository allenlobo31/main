import { AuthState, AuthActions } from '../store/authStore';
import { useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import {
  registerForPushNotifications,
  scheduleDailyReminder,
} from '../services/notifications/pushService';

export function useAuth() {
  const store: AuthState & AuthActions = useAuthStore();

  useEffect(() => {
    if (store.isInitialized && store.user) {
      const initPush = async () => {
        try {
          await registerForPushNotifications(store.user!.uid);
          await scheduleDailyReminder();
        } catch (e) {
          console.log('[useAuth] push init fail', e);
        }
      };
      initPush();
    }
  }, [store.isInitialized, store.user?.uid]);

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
    profileSetupCompleted: store.profileSetupCompleted,
  };
}
