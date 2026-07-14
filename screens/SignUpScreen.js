import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import GhostSafeArea from '../components/GhostSafeArea';
import { useNavigation } from '@react-navigation/native';
import AuthTextField from '../components/AuthTextField';
import KeyboardAwareScrollScreen from '../components/KeyboardAwareScrollScreen';
import { useAuth } from '../context/AuthContext';
import { dismissKeyboard } from '../utils/keyboard';

export default function SignUpScreen() {
  const navigation = useNavigation();
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSignUp = async () => {
    if (busy) return;

    dismissKeyboard();
    setBusy(true);
    try {
      const result = await signup({ name, email, password });

      if (!result.ok) {
        Alert.alert('Could not sign up', result.message, [{ text: 'OK' }]);
        return;
      }

      navigation.replace('Onboarding');
      Alert.alert(
        'Account created',
        `Welcome, ${result.user.name}. Let’s set up your healing journey.`,
        [{ text: 'OK' }]
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <GhostSafeArea style={styles.safe}>
      <KeyboardAwareScrollScreen
        centerContent
        contentContainerStyle={styles.scroll}
      >
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Join Ghost Mode</Text>
          </View>

          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>
            Start your private space for healing. Your account is saved securely on this device.
          </Text>

          <AuthTextField
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="Your first name"
            autoCapitalize="words"
            textContentType="name"
          />
          <AuthTextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            textContentType="emailAddress"
          />
          <AuthTextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="At least 6 characters"
            secureTextEntry
            showVisibilityToggle
            textContentType="newPassword"
            returnKeyType="done"
            onSubmitEditing={handleSignUp}
          />

          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.buttonPrimary,
              (pressed || busy) && styles.buttonPressed,
              busy && styles.buttonDisabled,
            ]}
            onPress={handleSignUp}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonPrimaryText}>Sign up</Text>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.linkWrap, pressed && styles.buttonPressed]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.linkText}>
              Already have an account? <Text style={styles.linkAccent}>Log in</Text>
            </Text>
          </Pressable>
      </KeyboardAwareScrollScreen>
    </GhostSafeArea>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 32,
    alignItems: 'center',
  },
  badge: {
    marginBottom: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(124, 58, 237, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.35)',
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
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 28,
    maxWidth: 320,
  },
  button: {
    width: '100%',
    maxWidth: 340,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonPrimary: {
    backgroundColor: '#7c3aed',
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
  buttonPrimaryText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  linkWrap: {
    marginTop: 20,
    paddingVertical: 8,
  },
  linkText: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 15,
    textAlign: 'center',
  },
  linkAccent: {
    color: '#c4b5fd',
    fontWeight: '700',
  },
  disclaimer: {
    marginTop: 24,
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 300,
  },
});
