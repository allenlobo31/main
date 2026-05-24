import React from 'react';
import { useWindowDimensions } from 'react-native';
import { Tabs } from 'expo-router';
import { theme } from '../../src/constants/theme';
import { Home, Calendar, Users } from 'lucide-react-native';

function useResponsiveFooter() {
  const { height: screenHeight } = useWindowDimensions();
  
  // Responsive sizing based on screen height
  const tabBarHeight = screenHeight > 800 ? 90 : screenHeight > 600 ? 80 : 72;
  const iconSize = screenHeight > 800 ? 28 : screenHeight > 600 ? 24 : 22;
  const paddingBottom = screenHeight > 800 ? 12 : screenHeight > 600 ? 10 : 8;
  const paddingTop = screenHeight > 800 ? 8 : screenHeight > 600 ? 6 : 4;

  return { tabBarHeight, iconSize, paddingBottom, paddingTop };
}

export default function DoctorLayout() {
  const footer = useResponsiveFooter();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: footer.tabBarHeight,
          paddingBottom: footer.paddingBottom,
          paddingTop: footer.paddingTop,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: {
          ...theme.typography.caption,
          fontWeight: '700',
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home size={footer.iconSize} color={color} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Appointments',
          tabBarIcon: ({ color }) => <Calendar size={footer.iconSize} color={color} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="patient-list"
        options={{
          title: 'Patients',
          tabBarIcon: ({ color }) => <Users size={footer.iconSize} color={color} strokeWidth={2.5} />,
        }}
      />
      
      {/* Hide stack utility pages from the tab-bar footer menu */}
      <Tabs.Screen
        name="patient-detail"
        options={{
          href: null,
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
