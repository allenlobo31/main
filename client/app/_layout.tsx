import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import {
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../src/hooks/useAuth';
import { theme } from '../src/constants/theme';
import { setupNotificationTapHandler } from '../src/services/notifications/pushService';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isInitialized, role, user } = useAuth();

  useEffect(() => {
    if (!isInitialized) return;

    // Use a short setTimeout to allow the Root Layout to fully mount
    // before attempting any router.replace calls
    const timeoutId = setTimeout(() => {
      const inAuth = segments[0] === '(auth)';
      const inPatient = segments[0] === '(patient)';
      const inDoctor = segments[0] === '(doctor)';
      let inPatientOnboarding: string | undefined = undefined;
      if (inPatient && Array.isArray(segments) && segments.length > 1) {
        inPatientOnboarding = (segments as string[])[1];
      }
      const needsPatientOnboarding =
        role === 'patient' && isAuthenticated && user?.profileSetupCompleted === false;

      if (!isAuthenticated && !inAuth) {
        router.replace('/(auth)/login');
      } else if (isAuthenticated) {
        if (role === 'doctor' && !inDoctor) {
          router.replace('/(doctor)/patient-list');
        } else if (role === 'patient') {
          if (needsPatientOnboarding && inPatientOnboarding !== 'onboarding') {
            router.replace('/(patient)/onboarding');
          } else if (!needsPatientOnboarding && !inPatient) {
            router.replace('/(patient)/dashboard');
          }
        }
      }
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [isAuthenticated, isInitialized, role, segments, user?.profileSetupCompleted]);

  if (!isInitialized) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  useEffect(() => {
    const cleanup = setupNotificationTapHandler((data) => {
      // Deep link handled by Expo Router's linking config
      console.log('[Notification tap]', data);
    });
    return cleanup;
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthGuard>
          <Stack screenOptions={{ headerShown: false }} />
        </AuthGuard>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
