import { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import GhostSafeArea from '../components/GhostSafeArea';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getRandomReason } from '../utils/storage';

const START_SECONDS = 60;

const FALLBACK_REASON =
  'You broke no-contact for a reason. Going back resets your healing.';

export default function EmergencyScreen() {
  const navigation = useNavigation();
  const [secondsLeft, setSecondsLeft] = useState(START_SECONDS);
  const [personalReason, setPersonalReason] = useState(null);
  const [reasonLoading, setReasonLoading] = useState(true);

  const loadPersonalReason = useCallback(async () => {
    setReasonLoading(true);
    const reason = await getRandomReason();
    setPersonalReason(reason);
    setReasonLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setSecondsLeft(START_SECONDS);
      loadPersonalReason();
    }, [loadPersonalReason])
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const progress = (START_SECONDS - secondsLeft) / START_SECONDS;

  return (
    <GhostSafeArea style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Emergency mode</Text>
        </View>

        <Text style={styles.title}>Don't text them.</Text>
        <Text style={styles.subtitle}>
          Wait 60 seconds. The feeling will pass.
        </Text>

        <View style={styles.timerCard}>
          <View style={styles.timerRing}>
            <View
              style={[
                styles.timerRingFill,
                { height: `${progress * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.timerNumber}>{secondsLeft}</Text>
          <Text style={styles.timerLabel}>
            {secondsLeft === 0 ? "Time's up — you made it" : 'seconds left'}
          </Text>
        </View>

        <View style={styles.breathingCard}>
          <Text style={styles.breathingLabel}>Calm your body</Text>
          <Text style={styles.breathingText}>
            Breathe in. Hold. Breathe out.
          </Text>
        </View>

        <View style={styles.reasonsCard}>
          <Text style={styles.reasonsTitle}>Remember why</Text>
          {reasonLoading ? (
            <ActivityIndicator color="#a78bfa" style={styles.reasonLoader} />
          ) : personalReason ? (
            <>
              <Text style={styles.reasonPersonalLabel}>Your reason</Text>
              <Text style={styles.reasonHighlight}>{personalReason.text}</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.shuffleButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={loadPersonalReason}
              >
                <Text style={styles.shuffleButtonText}>Show another reason</Text>
              </Pressable>
            </>
          ) : (
            <Text style={styles.reasonFallback}>{FALLBACK_REASON}</Text>
          )}
          {!reasonLoading && !personalReason && (
            <Pressable
              style={({ pressed }) => [
                styles.addReasonLink,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => navigation.navigate('Reasons')}
            >
              <Text style={styles.addReasonLinkText}>
                Add personal reasons in My Reasons
              </Text>
            </Pressable>
          )}
        </View>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              styles.actionPrimary,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.actionPrimaryText}>I'm okay now</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              styles.actionSecondary,
              pressed && styles.buttonPressed,
            ]}
            onPress={() =>
              navigation.navigate('MainTabs', { screen: 'Journal' })
            }
          >
            <Text style={styles.actionSecondaryText}>Write in Journal</Text>
          </Pressable>
        </View>
      </ScrollView>
    </GhostSafeArea>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 40,
  },
  badge: {
    marginBottom: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 80, 80, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 120, 120, 0.25)',
  },
  badgeText: {
    color: 'rgba(255, 180, 180, 0.9)',
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
  timerCard: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(167, 139, 250, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
      },
      android: { elevation: 10 },
      default: {},
    }),
  },
  timerRing: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  timerRingFill: {
    width: '100%',
    backgroundColor: 'rgba(124, 58, 237, 0.25)',
  },
  timerNumber: {
    color: '#ffffff',
    fontSize: 64,
    fontWeight: '800',
    letterSpacing: -2,
  },
  timerLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  breathingCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.25)',
    marginBottom: 20,
    alignItems: 'center',
  },
  breathingLabel: {
    color: '#a5b4fc',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  breathingText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 30,
  },
  reasonsCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 28,
  },
  reasonsTitle: {
    color: '#a78bfa',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  reasonLoader: {
    marginVertical: 12,
  },
  reasonPersonalLabel: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  reasonHighlight: {
    color: '#ffffff',
    fontSize: 18,
    lineHeight: 27,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  reasonFallback: {
    color: 'rgba(255, 255, 255, 0.78)',
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  shuffleButton: {
    alignSelf: 'flex-start',
    marginTop: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
    ...Platform.select({
      web: { cursor: 'pointer' },
      default: {},
    }),
  },
  shuffleButtonText: {
    color: '#c4b5fd',
    fontSize: 13,
    fontWeight: '700',
  },
  addReasonLink: {
    marginTop: 14,
    alignSelf: 'flex-start',
    ...Platform.select({
      web: { cursor: 'pointer' },
      default: {},
    }),
  },
  addReasonLinkText: {
    color: '#a78bfa',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  actions: {
    width: '100%',
    maxWidth: 340,
    gap: 12,
  },
  actionButton: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  actionPrimary: {
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
  actionPrimaryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  actionSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionSecondaryText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
