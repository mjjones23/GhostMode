import { useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  
  ScrollView,
  Platform,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import GhostSafeArea from '../components/GhostSafeArea';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import CheckInCalendar from '../components/CheckInCalendar';
import ScreenBackButton from '../components/ScreenBackButton';
import ScreenLoader from '../components/ScreenLoader';
import {
  CHECKIN_MOODS,
  getCheckInMoodMeta,
  getCheckInSupportMessage,
} from '../content/dailyCheckInContent';
import {
  getCheckInStreak,
  getRecentCheckInCalendar,
  getTodaysCheckIn,
  loadDailyCheckIns,
  saveDailyCheckIn,
} from '../utils/storage';

function MoodOption({ mood, selected, onPress, pulseAnim }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      friction: 6,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.moodOptionWrap,
        { transform: [{ scale: scaleAnim }] },
        selected && { opacity: pulseAnim },
      ]}
    >
      <Pressable
        style={({ pressed }) => [
          styles.moodOption,
          {
            backgroundColor: mood.bg,
            borderColor: selected ? mood.color : mood.border,
          },
          pressed && styles.buttonPressed,
        ]}
        onPress={() => onPress(mood.id)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Text style={styles.moodEmoji}>{mood.emoji}</Text>
        <Text style={[styles.moodLabel, { color: mood.color }]}>{mood.label}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function DailyCheckInScreen() {
  const navigation = useNavigation();
  const [phase, setPhase] = useState('select');
  const [selectedMood, setSelectedMood] = useState(null);
  const [supportMessage, setSupportMessage] = useState('');
  const [calendarDays, setCalendarDays] = useState([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const animateIn = useCallback(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(24);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const checkins = await loadDailyCheckIns();
    const today = await getTodaysCheckIn();

    setCalendarDays(getRecentCheckInCalendar(checkins, 14));
    setStreak(getCheckInStreak(checkins));

    if (today?.mood) {
      setSelectedMood(today.mood);
      setSupportMessage(getCheckInSupportMessage(today.mood));
      setPhase('result');
    } else {
      setSelectedMood(null);
      setSupportMessage('');
      setPhase('select');
    }

    setLoading(false);
    animateIn();
  }, [animateIn]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.85,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.4,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    glowLoop.start();
    return () => glowLoop.stop();
  }, [glowAnim]);

  const handleSelectMood = async (moodId) => {
    if (saving) return;

    setSaving(true);
    setSelectedMood(moodId);
    setSupportMessage(getCheckInSupportMessage(moodId));

    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 0.65,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      await saveDailyCheckIn(moodId);
      const checkins = await loadDailyCheckIns();
      setCalendarDays(getRecentCheckInCalendar(checkins, 14));
      setStreak(getCheckInStreak(checkins));
      setPhase('result');
      animateIn();
    } finally {
      setSaving(false);
    }
  };

  const moodMeta = selectedMood ? getCheckInMoodMeta(selectedMood) : null;

  return (
    <GhostSafeArea style={styles.safe}>
      <View style={styles.topBar}>
        <ScreenBackButton style={styles.topBarBack} />
        <Text style={styles.topBarTitle}>Daily Check-In</Text>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.glowOrb, { opacity: glowAnim }]} />

        {loading ? (
          <ScreenLoader message="Loading check-in..." inline />
        ) : (
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {phase === 'select' ? (
              <>
                <Text style={styles.title}>How are you feeling today?</Text>
                <Text style={styles.subtitle}>
                  There is no wrong answer. A quick check-in helps you notice patterns and
                  celebrate small wins in recovery.
                </Text>

                <View style={styles.moodGrid}>
                  {CHECKIN_MOODS.map((mood) => (
                    <MoodOption
                      key={mood.id}
                      mood={mood}
                      selected={selectedMood === mood.id}
                      onPress={handleSelectMood}
                      pulseAnim={pulseAnim}
                    />
                  ))}
                </View>

                {saving && (
                  <View style={styles.savingRow}>
                    <ActivityIndicator color="#c4b5fd" size="small" />
                    <Text style={styles.savingText}>Saving your check-in...</Text>
                  </View>
                )}
              </>
            ) : (
              <>
                <View
                  style={[
                    styles.resultCard,
                    moodMeta && {
                      borderColor: moodMeta.border,
                      backgroundColor: moodMeta.bg,
                    },
                  ]}
                >
                  <Text style={styles.resultEmoji}>{moodMeta?.emoji ?? '✨'}</Text>
                  <Text style={[styles.resultMood, moodMeta && { color: moodMeta.color }]}>
                    {moodMeta?.label ?? 'Checked in'}
                  </Text>
                  <Text style={styles.resultMessage}>{supportMessage}</Text>
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.changeButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => {
                    setPhase('select');
                    animateIn();
                  }}
                >
                  <Ionicons name="refresh" size={16} color="#c4b5fd" />
                  <Text style={styles.changeButtonText}>Change today&apos;s mood</Text>
                </Pressable>
              </>
            )}

            <View style={styles.calendarSection}>
              <CheckInCalendar days={calendarDays} streak={streak} />
            </View>

            <Text style={styles.footerNote}>
              Showing your last 14 days. Every check-in is a quiet act of self-care.
            </Text>
          </Animated.View>
        )}
      </ScrollView>
    </GhostSafeArea>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0a0a12',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  topBarBack: {
    marginBottom: 0,
  },
  topBarTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  topBarSpacer: {
    width: 40,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  glowOrb: {
    position: 'absolute',
    top: -40,
    alignSelf: 'center',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(124, 58, 237, 0.18)',
  },
  loader: {
    marginTop: 80,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.62)',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 22,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  moodOptionWrap: {
    width: '48%',
  },
  moodOption: {
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    ...Platform.select({
      ios: {
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
      default: {},
      web: { cursor: 'pointer' },
    }),
  },
  moodEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  moodLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  savingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  savingText: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 13,
    fontWeight: '600',
  },
  resultCard: {
    borderRadius: 22,
    padding: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.3)',
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  resultEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  resultMood: {
    color: '#c4b5fd',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 10,
  },
  resultMessage: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 16,
    lineHeight: 24,
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(196, 181, 253, 0.28)',
    marginBottom: 22,
    ...Platform.select({
      web: { cursor: 'pointer' },
      default: {},
    }),
  },
  changeButtonText: {
    color: '#c4b5fd',
    fontSize: 14,
    fontWeight: '700',
  },
  calendarSection: {
    marginBottom: 16,
  },
  footerNote: {
    color: 'rgba(255, 255, 255, 0.38)',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  buttonPressed: {
    opacity: 0.82,
  },
});
