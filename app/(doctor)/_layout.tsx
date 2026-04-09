import React from 'react';
import { Stack } from 'expo-router';
import { theme } from '../../src/constants/theme';

export default function DoctorLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.textPrimary,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="patient-list" options={{ title: 'My Patients' }} />
      <Stack.Screen name="patient-detail" options={{ title: 'Patient Detail' }} />
    </Stack>
  );
}
