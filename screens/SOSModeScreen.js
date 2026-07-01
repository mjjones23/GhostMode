import { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import GhostSafeArea from '../components/GhostSafeArea';
import { useFocusEffect, useNavigation, CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { usePremiumGate } from '../hooks/usePremiumGate';

export const SOS_COUNTDOWN_SECONDS = 60;

function formatCountdown(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export default function SOSModeScreen() {
  const navigation = useNavigation();
  const { requirePremium } = usePremiumGate();
  const [secondsLeft, setSecondsLeft] = useState(SOS_COUNTDOWN_SECONDS);
  const [countdownDone, setCountdownDone] = useState(false);

  const resetFlow = useCallback(() => {
    setSecondsLeft(SOS_COUNTDOWN_SECONDS);
    setCountdownDone(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      resetFlow();
    }, [resetFlow])
  );

  useEffect(() => {
    if (countdownDone) return undefined;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setCountdownDone(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdownDone]);

  const closeFlow = () => {
    navigation.goBack();
  };

  const openCoach = () => {
    requirePremium(() => {
      navigation.dispatch(
        CommonActions.navigate({
          name: 'MainTabs',
          params: { screen: 'Coach' },
          merge: true,
        })
      );
    });
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

  const handleWalk = () => {
    Alert.alert(
      'Take a walk',
      'Step outside for ten minutes. Fresh air and movement help urges pass without you texting them.',
      [{ text: 'Got it' }]
    );
  };

  const progress =
    (SOS_COUNTDOWN_SECONDS - secondsLeft) / SOS_COUNTDOWN_SECONDS;

  return (
    <GhostSafeArea style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <Pressable
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            onPress={closeFlow}
            accessibilityRole="button"
            accessibilityLabel="Close SOS mode"
          >
            <Ionicons name="close" size={22} color="rgba(255,255,255,0.7)" />
          </Pressable>
        </View>

        <View style={styles.badge}>
          <Ionicons name="hand-left-outline" size={14} color="#fca5a5" />
          <Text style={styles.badgeText}>SOS Mode</Text>
        </View>

        <Text style={styles.title}>
          Pause. Breathe. You do not have to send that message right now.
        </Text>

        {!countdownDone ? (
          <View style={styles.timerCard}>
            <Text style={styles.timerLabel}>Wait it out</Text>
            <View style={styles.timerTrack}>
              <View
                style={[
                  styles.timerFill,
                  { width: `${Math.min(100, progress * 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.timerValue}>{formatCountdown(secondsLeft)}</Text>
            <Text style={styles.timerHint}>
              Let the urge peak and fade. You are in control of what you send.
            </Text>
          </View>
        ) : (
          <View style={styles.doneCard}>
            <Ionicons name="checkmark-circle" size={36} color="#86efac" />
            <Text style={styles.doneTitle}>You waited. That matters.</Text>
            <Text style={styles.doneText}>
              Choose something that moves you forward instead of back.
            </Text>
          </View>
        )}

        {countdownDone && (
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
              onPress={openCoach}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={18} color="#c4b5fd" />
              <Text style={styles.actionText}>Talk to AI Coach</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
              onPress={openJournal}
            >
              <Ionicons name="book-outline" size={18} color="#c4b5fd" />
              <Text style={styles.actionText}>Journal</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
              onPress={handleWalk}
            >
              <Ionicons name="walk-outline" size={18} color="#c4b5fd" />
              <Text style={styles.actionText}>Take a walk</Text>
            </Pressable>
          </View>
        )}

        <Pressable
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
          onPress={closeFlow}
        >
          <Text style={styles.secondaryText}>I&apos;m okay for now</Text>
        </Pressable>
      </ScrollView>
    </GhostSafeArea>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0a0a12',
  },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
    marginTop: 4,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.35)',
    marginBottom: 20,
  },
  badgeText: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  title: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 34,
    letterSpacing: -0.4,
    marginBottom: 28,
  },
  timerCard: {
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.28)',
    marginBottom: 24,
  },
  timerLabel: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  timerTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    marginBottom: 16,
  },
  timerFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#a78bfa',
  },
  timerValue: {
    color: '#e9d5ff',
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 8,
  },
  timerHint: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 15,
    lineHeight: 22,
  },
  doneCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(134, 239, 172, 0.08)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(134, 239, 172, 0.25)',
    marginBottom: 24,
  },
  doneTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 8,
  },
  doneText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  actions: {
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(124, 58, 237, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.28)',
    ...Platform.select({
      ios: {
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  actionText: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  secondaryText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 15,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.85,
  },
});
