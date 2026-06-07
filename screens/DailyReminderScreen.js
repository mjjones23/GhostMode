import { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  
  Switch,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import GhostSafeArea from '../components/GhostSafeArea';
import { useNavigation } from '@react-navigation/native';
import {
  loadReminderSettings,
  DEFAULT_REMINDER,
} from '../utils/storage';
import { usePremiumGate } from '../hooks/usePremiumGate';
import {
  REMINDER_BODY,
  requestReminderPermissionsWithAlert,
  showReminderScheduleFailureAlert,
  saveAndSyncReminderSettings,
} from '../utils/reminderNotifications';
import ReminderTimePicker from '../components/ReminderTimePicker';
import ScreenBackButton from '../components/ScreenBackButton';
import ScreenLoader from '../components/ScreenLoader';
import KeyboardAwareScrollScreen from '../components/KeyboardAwareScrollScreen';
import { dismissKeyboard } from '../utils/keyboard';

export default function DailyReminderScreen() {
  const navigation = useNavigation();
  const { isPremium, openPaywall } = usePremiumGate();
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [selectedTime, setSelectedTime] = useState(DEFAULT_REMINDER.time);
  const [message, setMessage] = useState(REMINDER_BODY);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    const settings = await loadReminderSettings();
    setReminderEnabled(settings.enabled);
    setSelectedTime(settings.time);
    setMessage(settings.message || REMINDER_BODY);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (!isPremium) {
      openPaywall();
      navigation.goBack();
    }
  }, [isPremium, navigation, openPaywall]);

  const toggleReminder = async (value) => {
    if (value) {
      const permission = await requestReminderPermissionsWithAlert();
      if (!permission.granted) return;
    }
    setReminderEnabled(value);
  };

  const saveReminder = async () => {
    dismissKeyboard();
    const result = await saveAndSyncReminderSettings(
      {
        enabled: reminderEnabled,
        time: selectedTime,
        message: REMINDER_BODY,
      },
      isPremium
    );

    if (reminderEnabled && !result.scheduled) {
      showReminderScheduleFailureAlert(result);
      return;
    }

    Alert.alert(
      reminderEnabled ? 'Reminder scheduled' : 'Reminder saved',
      reminderEnabled
        ? `Daily notification set for ${selectedTime}.\n\n"${REMINDER_BODY}"`
        : 'Daily reminders are off.',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  if (!isPremium) {
    return null;
  }

  if (loading) {
    return (
      <GhostSafeArea style={styles.safe}>
        <ScreenLoader message="Loading reminder..." />
      </GhostSafeArea>
    );
  }

  return (
    <GhostSafeArea style={styles.safe}>
      <KeyboardAwareScrollScreen contentContainerStyle={styles.scroll}>
        <ScreenBackButton />

        <View style={styles.badge}>
          <Text style={styles.badgeText}>Daily healing</Text>
        </View>

        <Text style={styles.title}>Daily Reminder</Text>
        <Text style={styles.subtitle}>
          Choose when Ghost Mode sends your daily check-in notification.
        </Text>

        <ReminderTimePicker
          value={selectedTime}
          onChange={setSelectedTime}
          hint="Tap to pick any time"
        />

        <View style={styles.previewCard}>
          <Text style={styles.previewLabel}>Message preview</Text>
          <Text style={styles.previewText}>{message}</Text>
        </View>

        <View style={styles.toggleCard}>
          <Text style={styles.toggleLabel}>Daily reminders</Text>
          <Switch
            value={reminderEnabled}
            onValueChange={toggleReminder}
            trackColor={{
              false: 'rgba(255,255,255,0.15)',
              true: 'rgba(124, 58, 237, 0.5)',
            }}
            thumbColor={reminderEnabled ? '#a78bfa' : '#f4f4f5'}
            ios_backgroundColor="rgba(255,255,255,0.15)"
          />
        </View>

        <Text style={styles.toggleHint}>
          {reminderEnabled
            ? 'Works in Expo Go on a physical iPhone or Android device.'
            : 'Reminders are off. Your preference is still saved.'}
        </Text>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.buttonPrimary,
              pressed && styles.buttonPressed,
            ]}
            onPress={saveReminder}
          >
            <Text style={styles.buttonPrimaryText}>Save Reminder</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.buttonSecondary,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonSecondaryText}>Back</Text>
          </Pressable>
        </View>
      </KeyboardAwareScrollScreen>
    </GhostSafeArea>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centerLoader: { flex: 1, alignSelf: 'center' },
  scroll: {
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  badge: {
    marginBottom: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  badgeText: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 17,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 28,
    maxWidth: 300,
  },
  timeSelector: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: 'rgba(124, 58, 237, 0.18)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.4)',
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
  timeLabel: {
    color: '#a78bfa',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  timeValue: {
    color: '#ffffff',
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -1,
  },
  timeHint: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 13,
    marginTop: 8,
  },
  previewCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 20,
  },
  previewLabel: {
    color: '#a78bfa',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  previewText: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  toggleCard: {
    width: '100%',
    maxWidth: 340,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 10,
  },
  toggleLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleHint: {
    width: '100%',
    maxWidth: 340,
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 28,
  },
  actions: {
    width: '100%',
    maxWidth: 340,
    gap: 12,
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: 'rgba(124, 58, 237, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.5)',
    ...Platform.select({
      ios: {
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
  buttonPrimaryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  buttonSecondaryText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
