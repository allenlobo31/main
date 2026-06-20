// Notifications are disabled per user preference. Dashboard cards are used instead.

// We are disabling expo-notifications as per user request to avoid Expo Go limitations.
// Using dashboard cards instead.

export async function registerForPushNotifications(
  userId: string,
): Promise<string | null> {
  return null;
}

export function setupNotificationTapHandler(
  onTap: (data: Record<string, string>) => void,
): () => void {
  return () => {};
}

export async function scheduleDailyReminder(): Promise<void> {
  // Notifications disabled. Dashboard cards used instead.
}
