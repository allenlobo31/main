import React from 'react';
import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { theme } from '../../src/constants/theme';

function TabEmoji({ symbol, size }: { symbol: string; size: number }) {
  return <Text style={{ fontSize: size, lineHeight: size + 2 }}>{symbol}</Text>;
}

export default function PatientLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: {
          ...theme.typography.caption,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ size }) => <TabEmoji symbol="🏠" size={size} />,
        }}
      />
      <Tabs.Screen
        name="ai-monitor"
        options={{
          title: 'AI',
          tabBarIcon: ({ size }) => <TabEmoji symbol="📈" size={size} />,
        }}
      />
      <Tabs.Screen
        name="experts"
        options={{
          title: 'Experts',
          tabBarIcon: ({ size }) => <TabEmoji symbol="📞" size={size} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ size }) => <TabEmoji symbol="📁" size={size} />,
        }}
      />
      <Tabs.Screen
        name="diary"
        options={{
          title: 'Diary',
          tabBarIcon: ({ size }) => <TabEmoji symbol="📓" size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
