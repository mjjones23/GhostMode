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
import { useFocusEffect } from '@react-navigation/native';
import {
  loadJournalEntries,
  saveJournalEntries,
  formatJournalEntryDateTime,
} from '../utils/storage';
import { dismissKeyboard } from '../utils/keyboard';
import KeyboardAwareScrollScreen from '../components/KeyboardAwareScrollScreen';
import { usePremiumGate } from '../hooks/usePremiumGate';
import {
  limitHistoryForFree,
  getHiddenHistoryCount,
  FREE_HISTORY_LIMIT,
} from '../utils/premium';
import PremiumUpsellBanner from '../components/PremiumUpsellBanner';
import EmptyState from '../components/EmptyState';
import ScreenLoader from '../components/ScreenLoader';

export default function JournalScreen() {
  const { isPremium, openPaywall } = usePremiumGate();
  const [draft, setDraft] = useState('');
  const [savedEntries, setSavedEntries] = useState([]);
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
        const entries = await loadJournalEntries();
        if (active && loadVersionRef.current === loadVersion) {
          setSavedEntries(entries);
          setLoading(false);
        }
      })();

      return () => {
        active = false;
      };
    }, [])
  );

  const saveEntry = async () => {
    const trimmed = draft.trim();
    if (!trimmed || saving) return;

    dismissKeyboard();
    setSaving(true);
    try {
      const newEntry = {
        id: `entry-${Date.now()}`,
        text: trimmed,
        createdAt: new Date().toISOString(),
      };

      const updated = [newEntry, ...savedEntries];
      setSavedEntries(updated);
      await saveJournalEntries(updated);
      setDraft('');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEntry = async (id) => {
    if (!id || deletingId) return;

    const previous = savedEntries;
    const updated = savedEntries.filter(
      (entry) => String(entry.id) !== String(id)
    );

    setDeletingId(id);
    setSavedEntries(updated);

    try {
      await saveJournalEntries(updated);
      loadVersionRef.current += 1;
    } catch {
      setSavedEntries(previous);
    } finally {
      setDeletingId(null);
    }
  };

  const hasEntries = savedEntries.length > 0;
  const visibleEntries = limitHistoryForFree(savedEntries, isPremium);
  const hiddenEntryCount = getHiddenHistoryCount(savedEntries, isPremium);

  return (
    <GhostSafeArea style={styles.safe} tabBar>
      <KeyboardAwareScrollScreen
        tabBar
        contentContainerStyle={styles.scroll}
      >
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Private · Unsent</Text>
          </View>

          <Text style={styles.title}>Daily Journal</Text>
          <Text style={styles.subtitle}>
            Write what you wish you could text them. Nothing leaves this phone.
          </Text>

          <TextInput
            style={styles.textBox}
            placeholder="Let it out here instead of texting them..."
            placeholderTextColor="rgba(255, 255, 255, 0.3)"
            value={draft}
            onChangeText={setDraft}
            multiline
            textAlignVertical="top"
            maxLength={2000}
          />

          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.buttonPrimary,
                (!draft.trim() || saving) && styles.buttonDisabled,
                pressed && styles.buttonPressed,
              ]}
              onPress={saveEntry}
              disabled={!draft.trim() || saving}
            >
              <Text style={styles.buttonPrimaryText}>
                {saving ? 'Saving...' : 'Save Entry'}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>Saved entries</Text>

          {!isPremium && hiddenEntryCount > 0 && (
            <PremiumUpsellBanner
              title={`${hiddenEntryCount} older ${
                hiddenEntryCount === 1 ? 'entry' : 'entries'
              } hidden on Free plan`}
              onPress={openPaywall}
            />
          )}

          {!isPremium && hasEntries && (
            <Text style={styles.freePlanHint}>
              Free plan shows your latest {FREE_HISTORY_LIMIT} entries.
            </Text>
          )}

          {loading ? (
            <ScreenLoader message="Loading journal..." inline />
          ) : hasEntries ? (
            visibleEntries.map((entry) => (
              <View key={entry.id} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryDate}>
                    {formatJournalEntryDateTime(entry.createdAt)}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.deleteButton,
                      deletingId === entry.id && styles.deleteButtonDisabled,
                    ]}
                    onPress={() => handleDeleteEntry(entry.id)}
                    activeOpacity={0.7}
                    accessibilityLabel="Delete journal entry"
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
                <Text style={styles.entryText}>{entry.text}</Text>
              </View>
            ))
          ) : (
            <EmptyState
              icon="book-outline"
              title="No journal entries yet"
              message="Write what you need to release. Your entries stay private on this device."
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
    paddingTop: 16,
    paddingBottom: 32,
    alignItems: 'center',
  },
  badge: {
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
    marginBottom: 24,
    maxWidth: 300,
  },
  textBox: {
    width: '100%',
    maxWidth: 340,
    minHeight: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    color: '#ffffff',
    fontSize: 17,
    lineHeight: 26,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  actions: {
    width: '100%',
    maxWidth: 340,
    gap: 12,
    marginBottom: 32,
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
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
  buttonDisabled: { opacity: 0.45 },
  buttonPrimaryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  sectionLabel: {
    width: '100%',
    maxWidth: 340,
    color: '#a78bfa',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  freePlanHint: {
    width: '100%',
    maxWidth: 340,
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    marginBottom: 12,
    textAlign: 'center',
  },
  loader: { marginVertical: 20 },
  entryCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 12,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  entryDate: {
    flex: 1,
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 12,
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
  entryText: {
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  emptyState: {
    width: '100%',
    maxWidth: 340,
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
});
