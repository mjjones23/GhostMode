import { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  
  ScrollView,
  Switch,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import GhostSafeArea from '../components/GhostSafeArea';
import { useNavigation, CommonActions, useFocusEffect } from '@react-navigation/native';
import {
  loadNoContactStart,
  saveNoContactStart,
  loadReminderSettings,
  saveReminderSettings,
  formatDisplayDate,
  clearAllAppData,
} from '../utils/storage';
import { useStreak } from '../context/StreakContext';
import { usePremium } from '../context/PremiumContext';
import { usePremiumGate } from '../hooks/usePremiumGate';
import {
  REMINDER_BODY,
  requestReminderPermissionsWithAlert,
  showReminderScheduleFailureAlert,
  saveAndSyncReminderSettings,
  applyReminderNotificationSettings,
  cancelDailyReminderNotification,
} from '../utils/reminderNotifications';
import { ReminderTimePickerModal } from '../components/ReminderTimePicker';
import { dismissKeyboard } from '../utils/keyboard';
import { useAuth } from '../context/AuthContext';
import { navigateToAppScreen } from '../navigation/navigationHelpers';
import ScreenLoader from '../components/ScreenLoader';

const START_PRESETS_DAYS_AGO = [0, 7, 12, 30];

function SettingsRow({ label, value, onPress, showChevron = true }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && onPress && styles.rowPressed]}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        {showChevron && onPress ? (
          <Text style={styles.chevron}>›</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function daysAgoIso(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { refreshStreak } = useStreak();
  const { isPremium, developerPremium, setDeveloperPremium, refreshPremium } =
    usePremium();
  const { openPaywall } = usePremiumGate();
  const { user, logout, refreshAuth } = useAuth();
  const [startDateIso, setStartDateIso] = useState(null);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [notificationTime, setNotificationTime] = useState('9:00 PM');
  const [loading, setLoading] = useState(true);
  const [presetIndex, setPresetIndex] = useState(2);
  const [timePickerVisible, setTimePickerVisible] = useState(false);

  const loadAll = useCallback(async () => {
    const [start, reminder] = await Promise.all([
      loadNoContactStart(),
      loadReminderSettings(),
    ]);
    if (start) setStartDateIso(start);
    setReminderEnabled(isPremium ? reminder.enabled : false);
    setNotificationTime(reminder.time);
    setLoading(false);
  }, [isPremium]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useFocusEffect(
    useCallback(() => {
      refreshAuth();
    }, [refreshAuth])
  );

  const showDemoAlert = (title, message) => {
    Alert.alert(title, message, [{ text: 'OK' }]);
  };

  const changeStartDate = async () => {
    const nextIndex = (presetIndex + 1) % START_PRESETS_DAYS_AGO.length;
    const daysAgo = START_PRESETS_DAYS_AGO[nextIndex];
    const iso = daysAgoIso(daysAgo);
    setPresetIndex(nextIndex);
    setStartDateIso(iso);
    await saveNoContactStart(iso);
    await refreshStreak();
    showDemoAlert(
      'Start date saved',
      `No-contact started ${formatDisplayDate(iso)}. Your Home streak updated immediately.`
    );
  };

  const openNotificationTimePicker = () => {
    if (!isPremium) {
      openPaywall();
      return;
    }
    setTimePickerVisible(true);
  };

  const confirmNotificationTime = async (next) => {
    dismissKeyboard();
    setTimePickerVisible(false);
    setNotificationTime(next);
    const reminder = await loadReminderSettings();
    const result = await saveAndSyncReminderSettings(
      { ...reminder, time: next, enabled: reminderEnabled, message: REMINDER_BODY },
      isPremium
    );
    showDemoAlert(
      result.scheduled ? 'Reminder scheduled' : 'Time saved',
      result.scheduled
        ? `Daily notification set for ${next}.`
        : `Saved for ${next}. Turn on daily reminder to schedule it.`
    );
  };

  const toggleReminder = async (value) => {
    if (!isPremium) {
      openPaywall();
      return;
    }

    if (value) {
      const permission = await requestReminderPermissionsWithAlert();
      if (!permission.granted) return;
    }

    setReminderEnabled(value);
    const reminder = await loadReminderSettings();
    const result = await saveAndSyncReminderSettings(
      { ...reminder, enabled: value, message: REMINDER_BODY },
      isPremium
    );

    if (value && !result.scheduled) {
      setReminderEnabled(false);
      await saveReminderSettings({ ...reminder, enabled: false, message: REMINDER_BODY });
      showReminderScheduleFailureAlert(result);
      return;
    }

    showDemoAlert(
      value ? 'Daily reminder on' : 'Daily reminder off',
      value
        ? `You'll get a notification at ${notificationTime}.\n\n"${REMINDER_BODY}"`
        : 'Scheduled notifications were turned off.'
    );
  };

  const navigateToScreen = useCallback(
    (screen, params) => {
      navigateToAppScreen(navigation, screen, params);
    },
    [navigation]
  );

  const openPrivacy = () => {
    navigateToScreen('LegalDocument', { documentId: 'privacy' });
  };

  const openSafetyDisclaimer = () => {
    navigateToScreen('SafetyDisclaimer');
  };

  const openTerms = () => {
    navigateToScreen('LegalDocument', { documentId: 'terms' });
  };

  const toggleDeveloperPremium = async (value) => {
    await setDeveloperPremium(value);
    const reminder = await loadReminderSettings();
    if (value) {
      setReminderEnabled(reminder.enabled);
      await applyReminderNotificationSettings(true);
    } else {
      setReminderEnabled(false);
      await saveReminderSettings({ ...reminder, enabled: false, message: REMINDER_BODY });
      await cancelDailyReminderNotification();
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Log out?',
      'You can sign back in anytime with your email and password.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          onPress: async () => {
            await logout();
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              })
            );
          },
        },
      ]
    );
  };

  const deleteAccount = () => {
    Alert.alert(
      'Delete all local data?',
      'This removes your account, journal entries, moods, streak date, and reminder settings from this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await cancelDailyReminderNotification();
            await logout();
            await clearAllAppData();
            await refreshPremium();
            await refreshStreak();
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              })
            );
            showDemoAlert(
              'Data cleared',
              'All saved Ghost Mode data was removed from this device.'
            );
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <GhostSafeArea style={styles.safe} tabBar>
        <ScreenLoader message="Loading settings..." />
      </GhostSafeArea>
    );
  }

  return (
    <GhostSafeArea style={styles.safe} tabBar>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Your account</Text>
        </View>

        <Text style={styles.title}>Settings</Text>

        {user?.name ? (
          <Text style={styles.greeting}>Signed in as {user.name}</Text>
        ) : null}

        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <SettingsRow label="Name" value={user?.name || '—'} showChevron={false} />
          <View style={styles.divider} />
          <SettingsRow label="Email" value={user?.email || '—'} showChevron={false} />
        </View>

        <Text style={styles.sectionTitle}>No contact</Text>
        <View style={styles.card}>
          <SettingsRow
            label="Start date"
            value={startDateIso ? formatDisplayDate(startDateIso) : '—'}
            onPress={changeStartDate}
          />
        </View>

        <Text style={styles.sectionTitle}>Reminders</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLabelWrap}>
              <Text style={styles.rowLabel}>Daily reminder</Text>
              {!isPremium && (
                <Text style={styles.premiumTag}>Premium</Text>
              )}
            </View>
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
          <View style={styles.divider} />
          <SettingsRow
            label="Notification time"
            value={notificationTime}
            onPress={isPremium ? openNotificationTimePicker : openPaywall}
            showChevron
          />
          <View style={styles.divider} />
          <SettingsRow
            label="Reminder screen"
            value="Customize"
            onPress={isPremium ? () => navigateToScreen('DailyReminder') : openPaywall}
          />
          {!isPremium && (
            <Text style={styles.rowHint}>
              Daily healing reminders are a Premium feature.
            </Text>
          )}
          {isPremium && !reminderEnabled && (
            <Text style={styles.rowHint}>Turn on daily reminder to schedule notifications</Text>
          )}
          {isPremium && reminderEnabled && (
            <Text style={styles.rowHint}>
              Notification: "{REMINDER_BODY}"
            </Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>Subscription</Text>
        <View style={styles.card}>
          <SettingsRow
            label="Premium status"
            value={isPremium ? 'Premium' : 'Free plan'}
            onPress={() =>
              isPremium
                ? showDemoAlert('Premium', 'You have Ghost Mode Premium.')
                : navigateToScreen('Paywall')
            }
          />
          {__DEV__ ? (
            <>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Premium access</Text>
                <Switch
                  value={developerPremium}
                  onValueChange={toggleDeveloperPremium}
                  trackColor={{
                    false: 'rgba(255,255,255,0.15)',
                    true: 'rgba(124, 58, 237, 0.5)',
                  }}
                  thumbColor={developerPremium ? '#a78bfa' : '#f4f4f5'}
                  ios_backgroundColor="rgba(255,255,255,0.15)"
                />
              </View>
              <Text style={styles.rowHint}>
                Enable Premium features on this device while subscriptions are being set up.
              </Text>
            </>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>Privacy & Safety</Text>
        <View style={styles.card}>
          <SettingsRow label="Privacy Policy" onPress={openPrivacy} />
          <View style={styles.divider} />
          <SettingsRow label="Safety Disclaimer" onPress={openSafetyDisclaimer} />
          <View style={styles.divider} />
          <SettingsRow label="Terms of Service" onPress={openTerms} />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={deleteAccount}
        >
          <Text style={styles.deleteText}>Delete account</Text>
        </Pressable>
      </ScrollView>
      <ReminderTimePickerModal
        visible={timePickerVisible}
        value={notificationTime}
        onClose={() => setTimePickerVisible(false)}
        onConfirm={confirmNotificationTime}
      />
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
    marginBottom: 8,
  },
  greeting: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 340,
  },
  sectionTitle: {
    width: '100%',
    maxWidth: 340,
    color: '#a78bfa',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 24,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  rowPressed: { backgroundColor: 'rgba(255, 255, 255, 0.04)' },
  rowLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  rowLabelWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  premiumTag: {
    color: '#c4b5fd',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
  },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowValue: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 15,
    fontWeight: '500',
  },
  chevron: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 22,
    fontWeight: '300',
    marginTop: -2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 18,
  },
  rowHint: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 12,
    paddingHorizontal: 18,
    paddingBottom: 12,
    marginTop: -8,
  },
  sectionHint: {
    width: '100%',
    maxWidth: 340,
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 20,
  },
  logoutButton: {
    width: '100%',
    maxWidth: 340,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 12,
  },
  logoutText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    width: '100%',
    maxWidth: 340,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.35)',
    marginBottom: 12,
  },
  deleteText: { color: '#fca5a5', fontSize: 16, fontWeight: '700' },
  backButton: {
    width: '100%',
    maxWidth: 340,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  backText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
