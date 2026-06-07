import { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useStreak } from '../context/StreakContext';
import { resetNoContactStreak } from '../utils/storage';

export default function StreakResetScreen() {
  const navigation = useNavigation();
  const { refreshStreak } = useStreak();
  const [phase, setPhase] = useState('confirm');
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    if (resetting) return;

    setResetting(true);
    try {
      await resetNoContactStreak();
      await refreshStreak();
      setPhase('success');
    } finally {
      setResetting(false);
    }
  };

  const handleClose = () => {
    navigation.goBack();
  };

  return (
    <GhostSafeArea style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {phase === 'confirm' ? (
          <>
            <View style={styles.iconWrap}>
              <Ionicons name="heart-half" size={36} color="#c4b5fd" />
            </View>

            <Text style={styles.title}>It happened. You're still healing.</Text>
            <Text style={styles.message}>
              Resetting your streak does not mean you failed. It means you start
              again with more awareness.
            </Text>

            <View style={styles.actions}>
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  styles.buttonPrimary,
                  resetting && styles.buttonDisabled,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleReset}
                disabled={resetting}
              >
                {resetting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.buttonPrimaryText}>Reset My Streak</Text>
                )}
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  styles.buttonSecondary,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleClose}
                disabled={resetting}
              >
                <Text style={styles.buttonSecondaryText}>Cancel</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <View style={[styles.iconWrap, styles.iconWrapSuccess]}>
              <Ionicons name="leaf" size={36} color="#86efac" />
            </View>

            <Text style={styles.title}>New start. Same goal. You've got this.</Text>
            <Text style={styles.message}>
              Your streak is back to Day 1. That takes honesty — and honesty is
              part of healing.
            </Text>

            <View style={styles.successCard}>
              <Text style={styles.successLabel}>You're not starting from zero</Text>
              <Text style={styles.successText}>
                You still have your reasons, journal, and every lesson from before.
                Keep going.
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.buttonPrimary,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleClose}
            >
              <Text style={styles.buttonPrimaryText}>Back to Home</Text>
            </Pressable>
          </>
        )}
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
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 40,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
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
  iconWrapSuccess: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: 'rgba(134, 239, 172, 0.35)',
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 34,
    marginBottom: 16,
    maxWidth: 320,
  },
  message: {
    color: 'rgba(255, 255, 255, 0.68)',
    fontSize: 17,
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 320,
  },
  successCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.25)',
    marginBottom: 28,
  },
  successLabel: {
    color: '#a78bfa',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  successText: {
    color: 'rgba(255, 255, 255, 0.78)',
    fontSize: 15,
    lineHeight: 23,
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
    justifyContent: 'center',
    minHeight: 52,
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
  buttonSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPrimaryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
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
