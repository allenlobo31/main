import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { db, userDoc, updateDoc } from '../firebase/firestore';

// ─── Configure default behavior ───────────────────────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});


// ─── Request permissions and register push token ──────────────────────────────

export async function registerForPushNotifications(
  userId: string,
): Promise<string | null> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[PushService] Push notification permission denied.');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    // Store token in Firestore
    const ref = userDoc(userId);
    await updateDoc(ref as never, { expoPushToken: token });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('herniacare-default', {
        name: 'HerniaCare',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#7c6ef7',
      });
    }

    return token;
  } catch (error) {
    console.error('[PushService] registerForPushNotifications error:', error);
    return null;
  }
}

// ─── Notification tap handler → deep link ────────────────────────────────────

export function setupNotificationTapHandler(
  onTap: (data: Record<string, string>) => void,
): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = response.notification.request.content.data as Record<string, string>;
      onTap(data);
    },
  );
  return () => subscription.remove();
}

// ─── Schedule local notifications ────────────────────────────────────────────

export async function scheduleDailyReminder(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const alreadySet = scheduled.some((n) =>
    n.content.title?.includes('Time to log'),
  );
  if (alreadySet) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '⏰ Daily Check-In',
      body: 'Time to log your symptoms and earn your XP!',
      data: { type: 'daily_reminder', screen: '/(patient)/ai-monitor' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour: 8,
      minute: 0,
      repeats: true,
    } as Notifications.CalendarTriggerInput,

  });
}
