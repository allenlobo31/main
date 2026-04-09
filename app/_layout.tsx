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
  const { isAuthenticated, isInitialized, role } = useAuth();

  useEffect(() => {
    if (!isInitialized) return;

    const inAuth = segments[0] === '(auth)';
    const inPatient = segments[0] === '(patient)';
    const inDoctor = segments[0] === '(doctor)';

    if (!isAuthenticated && !inAuth) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuth) {
      if (role === 'doctor') {
        router.replace('/(doctor)/patient-list');
      } else {
        router.replace('/(patient)/dashboard');
      }
    } else if (isAuthenticated && inPatient && role === 'doctor') {
      router.replace('/(doctor)/patient-list');
    } else if (isAuthenticated && inDoctor && role === 'patient') {
      router.replace('/(patient)/dashboard');
    }
  }, [isAuthenticated, isInitialized, role, segments]);

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
