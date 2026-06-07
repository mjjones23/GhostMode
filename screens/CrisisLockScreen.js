import { useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  
  ScrollView,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import GhostSafeArea from '../components/GhostSafeArea';
import { useFocusEffect, useNavigation, CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import BreathingAnimation from '../components/BreathingAnimation';
import {
  CALMING_MESSAGES,
  FALLBACK_REASON,
  PAUSE_COUNTDOWN_SECONDS,
  RECOVERY_COUNTDOWN_SECONDS,
  formatCountdown,
  getCalmingMessage,
  getRandomSupportMessage,
} from '../content/crisisLockContent';
import { getRandomReason } from '../utils/storage';

function CoachBubble({ text }) {
  return (
    <View style={styles.coachBubble}>
      <View style={styles.coachHeader}>
        <Ionicons name="chatbubble-ellipses" size={14} color="#c4b5fd" />
        <Text style={styles.coachLabel}>Ghost Coach</Text>
      </View>
      <Text style={styles.coachText}>{text}</Text>
    </View>
  );
}

export default function CrisisLockScreen() {
  const navigation = useNavigation();
  const [phase, setPhase] = useState('recovery');
  const [secondsLeft, setSecondsLeft] = useState(RECOVERY_COUNTDOWN_SECONDS);
  const [pauseSecondsLeft, setPauseSecondsLeft] = useState(PAUSE_COUNTDOWN_SECONDS);
  const [calmingIndex, setCalmingIndex] = useState(0);
  const [supportMessage, setSupportMessage] = useState(getRandomSupportMessage);
  const [personalReason, setPersonalReason] = useState(null);
  const [reasonLoading, setReasonLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const loadPersonalReason = useCallback(async () => {
    setReasonLoading(true);
    const reason = await getRandomReason();
    setPersonalReason(reason);
    setReasonLoading(false);
  }, []);

  const resetFlow = useCallback(() => {
    setPhase('recovery');
    setSecondsLeft(RECOVERY_COUNTDOWN_SECONDS);
    setPauseSecondsLeft(PAUSE_COUNTDOWN_SECONDS);
    setCalmingIndex(0);
    setSupportMessage(getRandomSupportMessage());
    fadeAnim.setValue(1);
  }, [fadeAnim]);

  useFocusEffect(
    useCallback(() => {
      resetFlow();
      loadPersonalReason();
    }, [loadPersonalReason, resetFlow])
  );

  useEffect(() => {
    const timer = setInterval(() => {
      if (phase === 'recovery') {
        setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
      } else {
        setPauseSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    const rotate = setInterval(() => {
      setCalmingIndex((prev) => (prev + 1) % CALMING_MESSAGES.length);
    }, 7000);
    return () => clearInterval(rotate);
  }, []);

  const transitionToPause = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setPhase('pause');
      setPauseSecondsLeft(PAUSE_COUNTDOWN_SECONDS);
      setSupportMessage(getRandomSupportMessage());
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }).start();
    });
  };

  const closeFlow = () => {
    navigation.goBack();
  };

  const openJournal = () => {
    navigation.dispatch(
      CommonActions.navigate({
        name: 'MainTabs',
        params: { screen: 'Journal' },
        merge: true,
      })
    );
  };

  const recoveryProgress =
    (RECOVERY_COUNTDOWN_SECONDS - secondsLeft) / RECOVERY_COUNTDOWN_SECONDS;
  const pauseProgress =
    (PAUSE_COUNTDOWN_SECONDS - pauseSecondsLeft) / PAUSE_COUNTDOWN_SECONDS;

  return (
    <GhostSafeArea style={styles.safe}>
      <Animated.View style={[styles.flex, { opacity: fadeAnim }]}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {phase === 'recovery' ? (
            <>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Crisis lock</Text>
              </View>

              <Text style={styles.title}>Pause before you text.</Text>
              <Text style={styles.subtitle}>
                This full-screen lock gives your nervous system time to settle.
              </Text>

              <BreathingAnimation />

              <View style={styles.timerCard}>
                <View style={styles.timerTrack}>
                  <View
                    style={[
                      styles.timerFill,
                      { width: `${Math.min(100, recoveryProgress * 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.timerValue}>{formatCountdown(secondsLeft)}</Text>
                <Text style={styles.timerHint}>
                  {secondsLeft === 0
                    ? 'You made it through the first wave'
                    : 'Stay with the lock — let the urge pass'}
                </Text>
              </View>

              <View style={styles.messageCard}>
                <Text style={styles.messageLabel}>Calm reminder</Text>
                <Text style={styles.messageText}>
                  {getCalmingMessage(calmingIndex)}
                </Text>
              </View>

              <View style={styles.reasonCard}>
                <Text style={styles.reasonLabel}>Your reason</Text>
                {reasonLoading ? (
                  <ActivityIndicator color="#a78bfa" style={styles.loader} />
                ) : personalReason ? (
                  <Text style={styles.reasonText}>{personalReason.text}</Text>
                ) : (
                  <Text style={styles.reasonFallback}>{FALLBACK_REASON}</Text>
                )}
              </View>

              <CoachBubble text={supportMessage} />

              <View style={styles.actions}>
                <Pressable
                  style={({ pressed }) => [
                    styles.button,
                    styles.buttonPrimary,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={closeFlow}
                >
                  <Text style={styles.buttonPrimaryText}>I'm okay now</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.button,
                    styles.buttonSecondary,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={transitionToPause}
                >
                  <Text style={styles.buttonSecondaryText}>
                    Still want to text them?
                  </Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <View style={[styles.badge, styles.badgePause]}>
                <Text style={styles.badgeText}>Take ten more minutes</Text>
              </View>

              <Text style={styles.title}>Wait before you send anything.</Text>
              <Text style={styles.subtitle}>
                The urge often fades if you give it ten more minutes. Try journaling
                what you would have texted instead.
              </Text>

              <View style={styles.pauseTimerCard}>
                <Ionicons name="hourglass-outline" size={28} color="#c4b5fd" />
                <Text style={styles.pauseTimerValue}>
                  {formatCountdown(pauseSecondsLeft)}
                </Text>
                <Text style={styles.pauseTimerHint}>10-minute calm window</Text>
                <View style={styles.timerTrack}>
                  <View
                    style={[
                      styles.timerFillPause,
                      { width: `${Math.min(100, pauseProgress * 100)}%` },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.journalCard}>
                <Ionicons name="book-outline" size={22} color="#c4b5fd" />
                <View style={styles.journalCardText}>
                  <Text style={styles.journalTitle}>Journal it out</Text>
                  <Text style={styles.journalBody}>
                    Write the message you wanted to send — then keep it unsent. Your
                    journal is a safe place to feel everything.
                  </Text>
                </View>
              </View>

              <CoachBubble text={supportMessage} />

              <View style={styles.actions}>
                <Pressable
                  style={({ pressed }) => [
                    styles.button,
                    styles.buttonPrimary,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={openJournal}
                >
                  <Text style={styles.buttonPrimaryText}>Open Journal</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.button,
                    styles.buttonSecondary,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={closeFlow}
                >
                  <Text style={styles.buttonSecondaryText}>I'm okay now</Text>
                </Pressable>
              </View>
            </>
          )}
        </ScrollView>
      </Animated.View>
    </GhostSafeArea>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0a12' },
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  badge: {
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.4)',
  },
  badgePause: {
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
    borderColor: 'rgba(129, 140, 248, 0.35)',
  },
  badgeText: {
    color: '#c4b5fd',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 10,
    maxWidth: 320,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 8,
    maxWidth: 320,
  },
  timerCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    marginBottom: 14,
  },
  timerTrack: {
    width: '100%',
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    marginBottom: 14,
  },
  timerFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#a78bfa',
  },
  timerFillPause: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#818cf8',
  },
  timerValue: {
    color: '#ffffff',
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1,
  },
  timerHint: {
    marginTop: 6,
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 13,
    textAlign: 'center',
  },
  messageCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.25)',
    marginBottom: 14,
  },
  messageLabel: {
    color: '#a78bfa',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  messageText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 17,
    lineHeight: 26,
    fontWeight: '500',
  },
  reasonCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 14,
    minHeight: 88,
    justifyContent: 'center',
  },
  reasonLabel: {
    color: '#c4b5fd',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  reasonText: {
    color: '#ffffff',
    fontSize: 17,
    lineHeight: 26,
    fontWeight: '600',
  },
  reasonFallback: {
    color: 'rgba(255, 255, 255, 0.78)',
    fontSize: 16,
    lineHeight: 24,
  },
  loader: { marginVertical: 8 },
  coachBubble: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.28)',
    marginBottom: 20,
  },
  coachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  coachLabel: {
    color: '#c4b5fd',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  coachText: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  pauseTimerCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.28)',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  pauseTimerValue: {
    color: '#ffffff',
    fontSize: 48,
    fontWeight: '800',
    marginTop: 10,
    letterSpacing: -1,
  },
  pauseTimerHint: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
  },
  journalCard: {
    width: '100%',
    maxWidth: 340,
    flexDirection: 'row',
    gap: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  journalCardText: { flex: 1 },
  journalTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  journalBody: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 14,
    lineHeight: 22,
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
    backgroundColor: '#7c3aed',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    ...Platform.select({
      ios: {
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.45,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
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
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
