import { Alert, Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { loadReminderSettings, saveReminderSettings } from './storage';

export const REMINDER_NOTIFICATION_ID = 'ghostmode-daily-reminder';
export const REMINDER_TITLE = 'Ghost Mode';
export const REMINDER_BODY = 'Stay strong. You do not need to text them.';

export const REMINDER_TIME_OPTIONS = [
  '7:00 PM',
  '8:00 PM',
  '9:00 PM',
  '10:00 PM',
  '11:00 PM',
  '9:00 AM',
  '12:00 PM',
];

export function configureReminderNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export function parseReminderTime(timeString) {
  const match = String(timeString || '')
    .trim()
    .match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (!match) {
    return { hour: 21, minute: 0 };
  }

  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;

  return { hour, minute };
}

export function formatReminderTime(date) {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function reminderStringToDate(timeString) {
  const { hour, minute } = parseReminderTime(timeString);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date;
}

export function isValidReminderTime(timeString) {
  return /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.test(String(timeString || '').trim());
}

export function normalizeReminderTimeInput(timeString) {
  const trimmed = String(timeString || '').trim();
  if (!isValidReminderTime(trimmed)) return null;
  const { hour, minute } = parseReminderTime(trimmed);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return formatReminderTime(date);
}

function isExpoGo() {
  return Constants.appOwnership === 'expo';
}

function getExpoGoReminderNote() {
  if (!isExpoGo()) return '';

  return '\n\nNote: Expo Go has limited local notification support (especially since SDK 53). For reliable testing, use a physical phone. A development build is recommended before launch.';
}

export function showReminderScheduleFailureAlert(result = {}) {
  if (result.reason === 'simulator') {
    Alert.alert(
      'Use a physical device',
      `Daily reminders cannot be tested on a simulator or emulator.${getExpoGoReminderNote()}`
    );
    return;
  }

  if (result.reason === 'web') {
    Alert.alert(
      'Not available on web',
      `Daily reminder notifications only work in the mobile app on a real phone.${getExpoGoReminderNote()}`
    );
    return;
  }

  if (result.permissionDenied) {
    Alert.alert(
      'Notifications are off',
      `Allow notifications for Ghost Mode in your phone Settings to get daily healing reminders.${getExpoGoReminderNote()}`
    );
    return;
  }

  Alert.alert(
    'Could not schedule reminder',
    `Ghost Mode saved your reminder settings, but could not schedule the notification.${getExpoGoReminderNote()}`
  );
}

export async function ensureNotificationPermissions() {
  if (Platform.OS === 'web') {
    return { granted: false, reason: 'web' };
  }

  if (!Device.isDevice) {
    return { granted: false, reason: 'simulator' };
  }

  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) {
    return { granted: true };
  }

  const requested = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: false,
      allowSound: true,
    },
  });

  return {
    granted: requested.granted,
    reason: requested.granted ? undefined : 'denied',
  };
}

export async function requestReminderPermissionsWithAlert() {
  const result = await ensureNotificationPermissions();

  if (result.granted) {
    return result;
  }

  if (result.reason === 'simulator') {
    Alert.alert(
      'Use a physical device',
      `Daily reminder notifications need a real phone. Simulators and emulators cannot receive them reliably.${getExpoGoReminderNote()}`
    );
    return result;
  }

  if (result.reason === 'web') {
    Alert.alert(
      'Not available on web',
      `Daily reminder notifications only work on a physical iPhone or Android device — not in the browser.${getExpoGoReminderNote()}`
    );
    return result;
  }

  Alert.alert(
    'Notifications are off',
    `Allow notifications for Ghost Mode in your phone Settings to get daily healing reminders.${getExpoGoReminderNote()}`
  );
  return result;
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('daily-reminders', {
    name: 'Daily healing reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#7c3aed',
  });
}

export async function cancelDailyReminderNotification() {
  try {
    await Notifications.cancelScheduledNotificationAsync(REMINDER_NOTIFICATION_ID);
  } catch {
    // No scheduled notification yet.
  }
}

export async function syncDailyReminderNotifications({
  enabled,
  time,
  message = REMINDER_BODY,
  isPremium,
}) {
  await cancelDailyReminderNotification();

  if (!enabled || !isPremium) {
    return { scheduled: false };
  }

  if (Platform.OS === 'web') {
    return { scheduled: false, reason: 'web' };
  }

  const permission = await ensureNotificationPermissions();
  if (!permission.granted) {
    return { scheduled: false, permissionDenied: true, reason: permission.reason };
  }

  const { hour, minute } = parseReminderTime(time);
  await ensureAndroidChannel();

  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_NOTIFICATION_ID,
    content: {
      title: REMINDER_TITLE,
      body: message || REMINDER_BODY,
      sound: true,
      ...(Platform.OS === 'android' ? { channelId: 'daily-reminders' } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      ...(Platform.OS === 'android' ? { channelId: 'daily-reminders' } : {}),
    },
  });

  return { scheduled: true, hour, minute };
}

export async function applyReminderNotificationSettings(isPremium) {
  const settings = await loadReminderSettings();
  return syncDailyReminderNotifications({
    enabled: settings.enabled,
    time: settings.time,
    message: settings.message || REMINDER_BODY,
    isPremium,
  });
}

export async function saveAndSyncReminderSettings(settings, isPremium) {
  const payload = {
    enabled: Boolean(settings.enabled),
    time: settings.time,
    message: settings.message || REMINDER_BODY,
  };
  await saveReminderSettings(payload);
  return syncDailyReminderNotifications({ ...payload, isPremium });
}
