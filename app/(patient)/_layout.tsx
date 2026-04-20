import React, { useEffect } from 'react';
import { useWindowDimensions } from 'react-native';
import { Tabs } from 'expo-router';
import { theme } from '../../src/constants/theme';
import { Home, TrendingUp, Phone, Heart, BookOpen, Activity } from 'lucide-react-native';
import { useGamification } from '../../src/hooks/useGamification';

function useResponsiveFooter() {
  const { height: screenHeight } = useWindowDimensions();
  
  // Responsive sizing based on screen height
  const tabBarHeight = screenHeight > 800 ? 90 : screenHeight > 600 ? 80 : 72;
  const iconSize = screenHeight > 800 ? 28 : screenHeight > 600 ? 24 : 22;
  const paddingBottom = screenHeight > 800 ? 12 : screenHeight > 600 ? 10 : 8;
  const paddingTop = screenHeight > 800 ? 8 : screenHeight > 600 ? 6 : 4;

  return { tabBarHeight, iconSize, paddingBottom, paddingTop };
}

export default function PatientLayout() {
  const footer = useResponsiveFooter();
  const gamification = useGamification();

  // Auto-complete daily logging task when app opens
  useEffect(() => {
    const completeDailyLogging = async () => {
      const taskId = 'daily_logging';
      if (!gamification.tasksCompletedToday.includes(taskId)) {
        await gamification.completeTask(taskId, 10);
      }
    };
    completeDailyLogging();
  }, []);

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
          fontWeight: '600',
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home size={footer.iconSize} color={color} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="ai-monitor"
        options={{
          title: 'AI',
          tabBarIcon: ({ color }) => <TrendingUp size={footer.iconSize} color={color} strokeWidth={2.5} />,
        }}
      />
       <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color }) => <Activity size={footer.iconSize} color={color} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="experts"
        options={{
          title: 'Experts',
          tabBarIcon: ({ color }) => <Phone size={footer.iconSize} color={color} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Wound Health',
          tabBarIcon: ({ color }) => <Heart size={footer.iconSize} color={color} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="diary"
        options={{
          title: 'Diary',
          tabBarIcon: ({ color }) => <BookOpen size={footer.iconSize} color={color} strokeWidth={2.5} />,
        }}
      />
     
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="onboarding"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
