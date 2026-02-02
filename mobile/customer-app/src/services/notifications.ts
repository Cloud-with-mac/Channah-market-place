/**
 * Push notification service for Channah mobile app.
 *
 * Uses expo-notifications to:
 *  - Request permission & register for push tokens
 *  - Handle incoming foreground / background notifications
 *  - Provide helpers for local notifications
 *
 * NOTE: Actual push sending is done server-side via Expo Push Service.
 * This module sets up the client-side infrastructure only.
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { customerApi } from '../../shared/api/customer-api';

// ---------------------------------------------------------------------------
// Configure default notification handling behaviour
// ---------------------------------------------------------------------------

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ---------------------------------------------------------------------------
// Push token registration
// ---------------------------------------------------------------------------

/**
 * Request permissions and return the Expo push token string.
 * Returns null if permissions are denied or device is a simulator.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device.');
    return null;
  }

  // Check / request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted.');
    return null;
  }

  // Get Expo push token
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId || undefined,
    });
    const token = tokenData.data;
    console.log('Expo push token:', token);

    // Android requires a notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3b82f6',
      });

      await Notifications.setNotificationChannelAsync('orders', {
        name: 'Order Updates',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3b82f6',
      });

      await Notifications.setNotificationChannelAsync('promotions', {
        name: 'Promotions',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    return token;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

/**
 * Send the push token to the backend so the server can send pushes later.
 */
export async function savePushTokenToServer(token: string): Promise<void> {
  try {
    await customerApi.post('/users/me/push-token', { push_token: token });
    console.log('Push token saved to server.');
  } catch (error) {
    console.warn('Failed to save push token to server:', error);
  }
}

// ---------------------------------------------------------------------------
// Notification listeners
// ---------------------------------------------------------------------------

export type NotificationReceivedCallback = (
  notification: Notifications.Notification,
) => void;

export type NotificationResponseCallback = (
  response: Notifications.NotificationResponse,
) => void;

/**
 * Subscribe to notifications received while app is in foreground.
 * Returns an unsubscribe function.
 */
export function onNotificationReceived(
  callback: NotificationReceivedCallback,
): () => void {
  const subscription = Notifications.addNotificationReceivedListener(callback);
  return () => subscription.remove();
}

/**
 * Subscribe to notification taps (user interacted with a notification).
 * Returns an unsubscribe function.
 */
export function onNotificationResponse(
  callback: NotificationResponseCallback,
): () => void {
  const subscription =
    Notifications.addNotificationResponseReceivedListener(callback);
  return () => subscription.remove();
}

/**
 * Get the notification response that launched the app (cold start from notification tap).
 */
export async function getInitialNotification(): Promise<Notifications.NotificationResponse | null> {
  return Notifications.getLastNotificationResponseAsync();
}

// ---------------------------------------------------------------------------
// Local notifications (useful for testing or offline triggers)
// ---------------------------------------------------------------------------

/**
 * Schedule a local notification immediately.
 */
export async function showLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: true,
    },
    trigger: null, // immediate
  });
}

// ---------------------------------------------------------------------------
// Badge management
// ---------------------------------------------------------------------------

export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

export async function clearBadge(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}

// ---------------------------------------------------------------------------
// Convenience: full initialisation flow
// ---------------------------------------------------------------------------

/**
 * Call this once on app startup (e.g. in App.tsx useEffect).
 * Registers for push, saves token to backend, sets up listeners.
 */
export async function initPushNotifications(
  onReceived?: NotificationReceivedCallback,
  onTapped?: NotificationResponseCallback,
): Promise<() => void> {
  const token = await registerForPushNotifications();

  if (token) {
    await savePushTokenToServer(token);
  }

  const unsubs: Array<() => void> = [];

  if (onReceived) {
    unsubs.push(onNotificationReceived(onReceived));
  }

  if (onTapped) {
    unsubs.push(onNotificationResponse(onTapped));
  }

  // Return cleanup function
  return () => {
    unsubs.forEach((fn) => fn());
  };
}
