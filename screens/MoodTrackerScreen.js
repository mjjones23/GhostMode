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
  loadMoodLogs,
  saveMoodLogs,
  formatJournalEntryDateTime,
} from '../utils/storage';
import {
  CHECKIN_MOODS,
  getMoodDisplayLabel,
  normalizeMoodId,
} from '../content/dailyCheckInContent';
import { usePremiumGate } from '../hooks/usePremiumGate';
import {
  limitHistoryForFree,
  getHiddenHistoryCount,
  FREE_HISTORY_LIMIT,
} from '../utils/premium';
import PremiumUpsellBanner from '../components/PremiumUpsellBanner';
import EmptyState from '../components/EmptyState';
import ScreenLoader from '../components/ScreenLoader';
import { dismissKeyboard } from '../utils/keyboard';
import KeyboardAwareScrollScreen from '../components/KeyboardAwareScrollScreen';

const MOOD_EMOJI = Object.fromEntries(
  CHECKIN_MOODS.map((mood) => [mood.id, mood.emoji])
);

function getMoodLabel(moodId) {
  return getMoodDisplayLabel(normalizeMoodId(moodId));
}

export default function MoodTrackerScreen() {
  const { isPremium, openPaywall } = usePremiumGate();
  const [selectedMood, setSelectedMood] = useState(null);
  const [note, setNote] = useState('');
  const [savedMoods, setSavedMoods] = useState([]);
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
        const logs = await loadMoodLogs();
        if (active && loadVersionRef.current === loadVersion) {
          setSavedMoods(logs);
          setLoading(false);
        }
      })();

      return () => {
        active = false;
      };
    }, [])
  );

  const saveMood = async () => {
    if (!selectedMood || saving) return;

    dismissKeyboard();
    setSaving(true);
    try {
      const newLog = {
        id: `mood-${Date.now()}`,
        mood: normalizeMoodId(selectedMood),
        note: note.trim(),
        createdAt: new Date().toISOString(),
      };

      const updated = [newLog, ...savedMoods];
      setSavedMoods(updated);
      await saveMoodLogs(updated);
      setSelectedMood(null);
      setNote('');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMood = async (id) => {
    if (!id || deletingId) return;

    const previous = savedMoods;
    const updated = savedMoods.filter(
      (log) => String(log.id) !== String(id)
    );

    setDeletingId(id);
    setSavedMoods(updated);

    try {
      await saveMoodLogs(updated);
      loadVersionRef.current += 1;
    } catch {
      setSavedMoods(previous);
    } finally {
      setDeletingId(null);
    }
  };

  const hasMoods = savedMoods.length > 0;
  const visibleMoods = limitHistoryForFree(savedMoods, isPremium);
  const hiddenMoodCount = getHiddenHistoryCount(savedMoods, isPremium);

  return (
    <GhostSafeArea style={styles.safe} tabBar>
      <KeyboardAwareScrollScreen
        tabBar
        contentContainerStyle={styles.scroll}
      >
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Mood check-in</Text>
          </View>

          <Text style={styles.title}>How are you feeling?</Text>
          <Text style={styles.subtitle}>
            Tap a mood, add a note if you want, then save. It stays on this device.
          </Text>

          <View style={styles.moodGrid}>
            {CHECKIN_MOODS.map((mood) => {
              const isSelected = selectedMood === mood.id;
              return (
                <Pressable
                  key={mood.id}
                  style={({ pressed }) => [
                    styles.moodButton,
                    isSelected && styles.moodButtonSelected,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => setSelectedMood(mood.id)}
                >
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                  <Text
                    style={[
                      styles.moodLabel,
                      isSelected && styles.moodLabelSelected,
                    ]}
                  >
                    {mood.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.noteLabel}>Optional note</Text>
          <TextInput
            style={styles.noteBox}
            placeholder="What triggered this feeling?"
            placeholderTextColor="rgba(255, 255, 255, 0.3)"
            value={note}
            onChangeText={setNote}
            multiline
            textAlignVertical="top"
            maxLength={500}
          />

          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.buttonPrimary,
                (!selectedMood || saving) && styles.buttonDisabled,
                pressed && styles.buttonPressed,
              ]}
              onPress={saveMood}
              disabled={!selectedMood || saving}
            >
              <Text style={styles.buttonPrimaryText}>
                {saving ? 'Saving...' : 'Save Mood'}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>Mood history</Text>

          {!isPremium && hiddenMoodCount > 0 && (
            <PremiumUpsellBanner
              title={`${hiddenMoodCount} older mood ${
                hiddenMoodCount === 1 ? 'log' : 'logs'
              } hidden on Free plan`}
              onPress={openPaywall}
            />
          )}

          {!isPremium && hasMoods && (
            <Text style={styles.freePlanHint}>
              Free plan shows your latest {FREE_HISTORY_LIMIT} mood logs.
            </Text>
          )}

          {loading ? (
            <ScreenLoader message="Loading moods..." inline />
          ) : hasMoods ? (
            visibleMoods.map((entry) => (
              <View key={entry.id} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyMood}>
                    {MOOD_EMOJI[normalizeMoodId(entry.mood)] || '💭'}{' '}
                    {getMoodLabel(entry.mood)}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.deleteButton,
                      deletingId === entry.id && styles.deleteButtonDisabled,
                    ]}
                    onPress={() => handleDeleteMood(entry.id)}
                    activeOpacity={0.7}
                    accessibilityLabel="Delete mood log"
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
                <Text style={styles.historyDate}>
                  {formatJournalEntryDateTime(entry.createdAt)}
                </Text>
                {entry.note ? (
                  <Text style={styles.historyNote}>{entry.note}</Text>
                ) : (
                  <Text style={styles.historyNoteEmpty}>No note added</Text>
                )}
              </View>
            ))
          ) : (
            <EmptyState
              icon="heart-outline"
              title="No mood logs yet"
              message="Check in with yourself today. Your mood history stays on this device."
            />
          )}
      </KeyboardAwareScrollScreen>
    </GhostSafeArea>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 40,
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
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 10,
    maxWidth: 300,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 300,
  },
  moodGrid: {
    width: '100%',
    maxWidth: 340,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 24,
  },
  moodButton: {
    width: '30%',
    minWidth: 96,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  moodButtonSelected: {
    backgroundColor: 'rgba(124, 58, 237, 0.3)',
    borderColor: 'rgba(167, 139, 250, 0.6)',
    ...Platform.select({
      ios: {
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
  moodEmoji: { fontSize: 28, marginBottom: 6 },
  moodLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '600',
  },
  moodLabelSelected: { color: '#ffffff' },
  noteLabel: {
    width: '100%',
    maxWidth: 340,
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  noteBox: {
    width: '100%',
    maxWidth: 340,
    minHeight: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 24,
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
  historyCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  historyMood: {
    flex: 1,
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 12,
  },
  historyDate: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
  },
  historyNote: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 15,
    lineHeight: 22,
  },
  historyNoteEmpty: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
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
