import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import GhostSafeArea from '../components/GhostSafeArea';
import {
  saveSetupProfile,
  formatDisplayDate,
  GOAL_OPTIONS,
} from '../utils/storage';
import { useStreak } from '../context/StreakContext';
import ReminderTimePicker from '../components/ReminderTimePicker';
import KeyboardAwareScrollScreen from '../components/KeyboardAwareScrollScreen';
import { dismissKeyboard } from '../utils/keyboard';

const START_PRESETS = [
  { label: 'Today', daysAgo: 0 },
  { label: 'Yesterday', daysAgo: 1 },
  { label: '3 days ago', daysAgo: 3 },
  { label: '1 week ago', daysAgo: 7 },
  { label: '2 weeks ago', daysAgo: 14 },
];

function daysAgoIso(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

export default function SetupScreen({ navigation }) {
  const { refreshStreak } = useStreak();
  const [startPresetIndex, setStartPresetIndex] = useState(0);
  const [goal, setGoal] = useState(GOAL_OPTIONS[0]);
  const [reminderTime, setReminderTime] = useState('9:00 PM');
  const [saving, setSaving] = useState(false);

  const startDate = daysAgoIso(START_PRESETS[startPresetIndex].daysAgo);

  const cycleStartDate = () => {
    setStartPresetIndex((i) => (i + 1) % START_PRESETS.length);
  };

  const finishSetup = async () => {
    if (saving) return;
    dismissKeyboard();
    setSaving(true);
    try {
      await saveSetupProfile({ startDate, goal, reminderTime });
      await refreshStreak();
      navigation.replace('MainTabs');
    } catch {
      Alert.alert(
        'Could not save setup',
        'Something went wrong saving your profile. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <GhostSafeArea style={styles.safe}>
      <KeyboardAwareScrollScreen contentContainerStyle={styles.scroll}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Quick setup</Text>
        </View>

        <Text style={styles.title}>Let's personalize Ghost Mode</Text>
        <Text style={styles.subtitle}>
          A few questions so your streak, goals, and reminders fit you.
        </Text>

        <Text style={styles.sectionLabel}>1. No-contact start date</Text>
        <Pressable
          style={({ pressed }) => [
            styles.dateCard,
            pressed && styles.buttonPressed,
          ]}
          onPress={cycleStartDate}
        >
          <Text style={styles.dateValue}>{formatDisplayDate(startDate)}</Text>
          <Text style={styles.dateHint}>
            {START_PRESETS[startPresetIndex].label} · Tap to change
          </Text>
        </Pressable>

        <Text style={styles.sectionLabel}>2. What is your main goal?</Text>
        <View style={styles.goalList}>
          {GOAL_OPTIONS.map((option) => {
            const selected = goal === option;
            return (
              <Pressable
                key={option}
                style={({ pressed }) => [
                  styles.goalOption,
                  selected && styles.goalOptionSelected,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => setGoal(option)}
              >
                <View style={[styles.goalRadio, selected && styles.goalRadioSelected]}>
                  {selected && <View style={styles.goalRadioDot} />}
                </View>
                <Text style={[styles.goalText, selected && styles.goalTextSelected]}>
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>3. Daily reminder time</Text>
        <ReminderTimePicker
          value={reminderTime}
          onChange={setReminderTime}
          hint="Tap to pick any time"
        />

        <Pressable
          style={({ pressed }) => [
            styles.finishButton,
            saving && styles.finishButtonDisabled,
            pressed && styles.buttonPressed,
          ]}
          onPress={finishSetup}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.finishButtonText}>Finish Setup</Text>
          )}
        </Pressable>
      </KeyboardAwareScrollScreen>
    </GhostSafeArea>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  badge: {
    alignSelf: 'center',
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
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 28,
  },
  sectionLabel: {
    color: '#a78bfa',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  dateCard: {
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.35)',
    marginBottom: 28,
  },
  dateValue: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
  },
  dateHint: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 13,
    marginTop: 8,
  },
  goalList: {
    gap: 10,
    marginBottom: 28,
  },
  goalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  goalOptionSelected: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderColor: 'rgba(167, 139, 250, 0.45)',
  },
  goalRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  goalRadioSelected: {
    borderColor: '#a78bfa',
  },
  goalRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#a78bfa',
  },
  goalText: {
    flex: 1,
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 16,
    fontWeight: '500',
  },
  goalTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  timeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 32,
  },
  timeValue: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  timeHint: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  finishButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    ...Platform.select({
      ios: {
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.45,
        shadowRadius: 14,
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  finishButtonDisabled: { opacity: 0.6 },
  finishButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
