import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import GhostSafeArea from '../components/GhostSafeArea';
import ScreenBackButton from '../components/ScreenBackButton';
import {
  MUSIC_CATEGORIES,
  getTracksByCategory,
} from '../content/musicCatalog';
import {
  getMusicPlayerState,
  pausePlayback,
  playTrack,
  stopPlayback,
} from '../services/musicPlayerService';
import { usePremium } from '../context/PremiumContext';
import { hasEntitlement } from '../config/proEntitlements';
import { MUSIC_PLAYER_ENABLED } from '../config/featureFlags';
import { usePremiumGate } from '../hooks/usePremiumGate';

export default function MusicHubScreen() {
  const navigation = useNavigation();
  const { isPremium } = usePremium();
  const { openPaywall } = usePremiumGate();
  const [selectedCategory, setSelectedCategory] = useState(MUSIC_CATEGORIES[0].id);
  const [activeTrackId, setActiveTrackId] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const tracks = useMemo(
    () => getTracksByCategory(selectedCategory),
    [selectedCategory]
  );

  const syncState = useCallback(() => {
    const state = getMusicPlayerState();
    setActiveTrackId(state.trackId);
    setPlaying(state.playing);
  }, []);

  useFocusEffect(
    useCallback(() => {
      syncState();
      return undefined;
    }, [syncState])
  );

  const handlePlay = async (track) => {
    if (!MUSIC_PLAYER_ENABLED) {
      setError('Music Hub is temporarily unavailable.');
      return;
    }
    if (track.requirePro && !hasEntitlement('MUSIC_PRO_TRACKS', isPremium)) {
      openPaywall();
      return;
    }

    setBusy(true);
    setError(null);
    try {
      if (activeTrackId === track.id && playing) {
        await pausePlayback();
      } else {
        const result = await playTrack(track.id);
        if (!result.ok) {
          setError(result.error || 'Could not play this track.');
        }
      }
      syncState();
    } catch (err) {
      setError(err?.message || 'Playback failed on this device.');
    } finally {
      setBusy(false);
      syncState();
    }
  };

  const handleStop = async () => {
    setBusy(true);
    await stopPlayback();
    setBusy(false);
    syncState();
  };

  return (
    <GhostSafeArea style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScreenBackButton />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Music Hub</Text>
        </View>
        <Text style={styles.title}>Sound for healing</Text>
        <Text style={styles.subtitle}>
          Original Ghost Mode ambient loops — Relaxation, Sleep, Rain, Ocean,
          Motivation, and Focus. No third-party music is bundled.
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          {MUSIC_CATEGORIES.map((category) => {
            const selected = category.id === selectedCategory;
            return (
              <Pressable
                key={category.id}
                style={[styles.categoryChip, selected && styles.categoryChipSelected]}
                onPress={() => setSelectedCategory(category.id)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Ionicons
                  name={category.icon}
                  size={16}
                  color={selected ? '#fff' : category.color}
                />
                <Text
                  style={[
                    styles.categoryLabel,
                    selected && styles.categoryLabelSelected,
                  ]}
                >
                  {category.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.list}>
          {tracks.map((track) => {
            const isActive = activeTrackId === track.id;
            const isPlaying = isActive && playing;
            return (
              <View key={track.id} style={styles.trackCard}>
                <View style={styles.trackText}>
                  <Text style={styles.trackTitle}>{track.title}</Text>
                  <Text style={styles.trackMeta}>
                    {track.artist} · {track.license}
                    {track.requirePro ? ' · Pro' : ' · Free'}
                  </Text>
                </View>
                <Pressable
                  style={({ pressed }) => [
                    styles.playButton,
                    pressed && styles.pressed,
                    busy && styles.disabled,
                  ]}
                  onPress={() => handlePlay(track)}
                  disabled={busy}
                  accessibilityRole="button"
                  accessibilityLabel={isPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
                >
                  {busy && isActive ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Ionicons
                      name={isPlaying ? 'pause' : 'play'}
                      size={20}
                      color="#fff"
                    />
                  )}
                </Pressable>
              </View>
            );
          })}
        </View>

        {activeTrackId ? (
          <Pressable
            style={({ pressed }) => [styles.stopButton, pressed && styles.pressed]}
            onPress={handleStop}
            accessibilityRole="button"
            accessibilityLabel="Stop playback"
          >
            <Text style={styles.stopText}>Stop</Text>
          </Pressable>
        ) : null}

        <Pressable
          style={styles.linkRow}
          onPress={() => navigation.navigate('Paywall')}
          accessibilityRole="button"
        >
          <Text style={styles.linkText}>Ghost Mode Pro unlocks Motivation & Focus tracks</Text>
        </Pressable>
      </ScrollView>
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
  badge: {
    alignSelf: 'center',
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  badgeText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  categoryRow: {
    gap: 8,
    paddingBottom: 8,
    marginBottom: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  categoryChipSelected: {
    backgroundColor: 'rgba(124,58,237,0.45)',
    borderColor: 'rgba(167,139,250,0.7)',
  },
  categoryLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '700',
    fontSize: 13,
  },
  categoryLabelSelected: { color: '#fff' },
  error: {
    color: '#fca5a5',
    marginBottom: 12,
    textAlign: 'center',
  },
  list: { gap: 10 },
  trackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  trackText: { flex: 1, paddingRight: 12 },
  trackTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  trackMeta: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' },
      default: {},
    }),
  },
  stopButton: {
    marginTop: 18,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  stopText: {
    color: '#e9d5ff',
    fontWeight: '700',
  },
  linkRow: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#c4b5fd',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
});
