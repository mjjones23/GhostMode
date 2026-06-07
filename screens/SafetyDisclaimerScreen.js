import { Text, StyleSheet,  Pressable } from 'react-native';
import GhostSafeArea from '../components/GhostSafeArea';
import { useNavigation } from '@react-navigation/native';
import LegalDocumentLayout from '../components/LegalDocumentLayout';
import { getLegalDocument } from '../content/legalDocuments';

/**
 * Dedicated Safety Disclaimer screen.
 */
export default function SafetyDisclaimerScreen() {
  const navigation = useNavigation();
  const document = getLegalDocument('safety');

  if (!document) {
    return (
      <GhostSafeArea style={styles.fallback}>
        <Text style={styles.fallbackText}>Safety disclaimer is not available yet.</Text>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back to Settings</Text>
        </Pressable>
      </GhostSafeArea>
    );
  }

  return (
    <LegalDocumentLayout
      badge={document.badge}
      title={document.title}
      subtitle={document.subtitle}
      highlight={document.highlight}
      sections={document.sections}
      footer={document.footer}
      onBack={() => navigation.goBack()}
    />
  );
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0a12',
    padding: 24,
  },
  fallbackText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
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
  backButtonText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
