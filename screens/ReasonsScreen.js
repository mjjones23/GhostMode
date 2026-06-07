import { useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  TouchableOpacity,
  
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import GhostSafeArea from '../components/GhostSafeArea';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  loadReasons,
  saveReasons,
  formatJournalEntryDateTime,
} from '../utils/storage';
import ScreenBackButton from '../components/ScreenBackButton';
import EmptyState from '../components/EmptyState';
import ScreenLoader from '../components/ScreenLoader';
import { dismissKeyboard } from '../utils/keyboard';
import KeyboardAwareScrollScreen from '../components/KeyboardAwareScrollScreen';

export default function ReasonsScreen() {
  const navigation = useNavigation();
  const [draft, setDraft] = useState('');
  const [reasons, setReasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const loadVersionRef = useRef(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const loadVersion = loadVersionRef.current + 1;
      loadVersionRef.current = loadVersion;

      (async () => {
        const saved = await loadReasons();
        if (active && loadVersionRef.current === loadVersion) {
          setReasons(saved);
          setLoading(false);
        }
      })();

      return () => {
        active = false;
      };
    }, [])
  );

  const addReason = async () => {
    const trimmed = draft.trim();
    if (!trimmed || saving) return;

    dismissKeyboard();
    setSaving(true);
    try {
      const newReason = {
        id: `reason-${Date.now()}`,
        text: trimmed,
        createdAt: new Date().toISOString(),
      };

      const updated = [newReason, ...reasons];
      setReasons(updated);
      await saveReasons(updated);
      setDraft('');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReason = async (id) => {
    if (!id || deletingId) return;

    const previous = reasons;
    const updated = reasons.filter(
      (reason) => String(reason.id) !== String(id)
    );

    setDeletingId(id);
    setReasons(updated);

    try {
      await saveReasons(updated);
      loadVersionRef.current += 1;
    } catch {
      setReasons(previous);
    } finally {
      setDeletingId(null);
    }
  };

  const hasReasons = reasons.length > 0;

  return (
    <GhostSafeArea style={styles.safe}>
      <KeyboardAwareScrollScreen contentContainerStyle={styles.scroll}>
          <ScreenBackButton />

          <View style={styles.badge}>
            <Text style={styles.badgeText}>Personal · Private</Text>
          </View>

          <Text style={styles.title}>My Reasons</Text>
          <Text style={styles.subtitle}>
            Write why texting them is not worth it. Emergency Mode will remind you.
          </Text>

          <TextInput
            style={styles.textBox}
            placeholder="Example: They only reached out when they needed something."
            placeholderTextColor="rgba(255, 255, 255, 0.3)"
            value={draft}
            onChangeText={setDraft}
            multiline
            textAlignVertical="top"
            maxLength={500}
          />

          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              (!draft.trim() || saving) && styles.addButtonDisabled,
              pressed && styles.buttonPressed,
            ]}
            onPress={addReason}
            disabled={!draft.trim() || saving}
          >
            <Ionicons name="add-circle-outline" size={20} color="#ffffff" />
            <Text style={styles.addButtonText}>
              {saving ? 'Saving...' : 'Add Reason'}
            </Text>
          </Pressable>

          <Text style={styles.sectionLabel}>Your reasons</Text>

          {loading ? (
            <ScreenLoader message="Loading reasons..." inline />
          ) : hasReasons ? (
            reasons.map((reason, index) => (
              <View key={reason.id} style={styles.reasonCard}>
                <View style={styles.reasonHeader}>
                  <Text style={styles.reasonNumber}>{index + 1}</Text>
                  <View style={styles.reasonMeta}>
                    <Text style={styles.reasonDate}>
                      {formatJournalEntryDateTime(reason.createdAt)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.deleteButton,
                      deletingId === reason.id && styles.deleteButtonDisabled,
                    ]}
                    onPress={() => handleDeleteReason(reason.id)}
                    activeOpacity={0.7}
                    accessibilityLabel="Delete reason"
                    accessibilityRole="button"
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    disabled={Boolean(deletingId)}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color="rgba(252, 165, 165, 0.9)"
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.reasonText}>{reason.text}</Text>
              </View>
            ))
          ) : (
            <EmptyState
              icon="shield-outline"
              title="No reasons saved yet"
              message="Add reasons your future self needs to remember when the urge to text hits."
            />
          )}
      </KeyboardAwareScrollScreen>
    </GhostSafeArea>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 16,
    paddingVertical: 4,
    ...Platform.select({
      web: { cursor: 'pointer' },
      default: {},
    }),
  },
  backText: {
    color: '#c4b5fd',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 2,
  },
  badge: {
    alignSelf: 'center',
    marginBottom: 18,
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
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 320,
    alignSelf: 'center',
  },
  textBox: {
    width: '100%',
    minHeight: 110,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 18,
    padding: 18,
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(124, 58, 237, 0.35)',
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.5)',
    marginBottom: 28,
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
  addButtonDisabled: { opacity: 0.45 },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionLabel: {
    color: '#a78bfa',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  loader: { marginVertical: 20 },
  reasonCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 12,
  },
  reasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  reasonNumber: {
    color: '#a78bfa',
    fontSize: 14,
    fontWeight: '800',
    width: 28,
  },
  reasonMeta: {
    flex: 1,
    marginRight: 8,
  },
  reasonDate: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    fontWeight: '600',
  },
  reasonText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 16,
    lineHeight: 24,
    paddingLeft: 28,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(252, 165, 165, 0.2)',
    zIndex: 2,
    ...Platform.select({
      web: { cursor: 'pointer' },
      default: {},
    }),
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  emptyState: {
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.2)',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  emptyIcon: {
    marginBottom: 12,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    fontWeight: '500',
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
