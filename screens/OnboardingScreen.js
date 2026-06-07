import { StyleSheet, Text, View, Pressable,  Platform } from 'react-native';
import GhostSafeArea from '../components/GhostSafeArea';

export default function OnboardingScreen({ onStartHealing }) {
  return (
    <GhostSafeArea style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Breakup recovery</Text>
        </View>

        <Text style={styles.title}>Ghost Mode</Text>
        <Text style={styles.subtitle}>Stay strong. Don't text them.</Text>

        <Text style={styles.hint}>Go no-contact. Heal on your terms.</Text>

        <Pressable
          style={({ pressed }) => [
            styles.buttonOuter,
            pressed && styles.buttonPressed,
          ]}
          onPress={onStartHealing}
        >
          <View style={styles.buttonGlow} />
          <View style={styles.button}>
            <Text style={styles.buttonText}>Start Healing</Text>
          </View>
        </Pressable>
      </View>
    </GhostSafeArea>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  badge: {
    marginBottom: 28,
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
    fontSize: 42,
    fontWeight: '700',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 16,
  },
  hint: {
    color: 'rgba(255, 255, 255, 0.38)',
    fontSize: 15,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 48,
    maxWidth: 280,
  },
  buttonOuter: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  buttonGlow: {
    position: 'absolute',
    width: '92%',
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7c3aed',
    opacity: 0.45,
    ...Platform.select({
      ios: {
        shadowColor: '#a78bfa',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 24,
      },
      android: { elevation: 16 },
      default: {},
    }),
  },
  button: {
    width: '100%',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 28,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    ...Platform.select({
      ios: {
        shadowColor: '#c4b5fd',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
