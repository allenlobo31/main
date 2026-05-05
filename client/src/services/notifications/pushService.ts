import { Platform } from 'react-native';
import Constants from 'expo-constants';

// We are disabling expo-notifications as per user request to avoid Expo Go limitations.
// Using dashboard cards instead.

export async function registerForPushNotifications(
  userId: string,
): Promise<string | null> {
  console.log('[PushService] Registration disabled by user preference.');
  return null;
}

export function setupNotificationTapHandler(
  onTap: (data: Record<string, string>) => void,
): () => void {
  return () => {};
}

export async function scheduleDailyReminder(): Promise<void> {
  console.log('[PushService] Scheduling disabled. Using dashboard cards instead.');
}
