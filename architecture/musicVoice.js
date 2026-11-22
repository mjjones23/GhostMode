/**
 * Music & Voice architecture (Batch 2).
 *
 * Expo SDK 58: use `expo-audio` for playback/recording.
 * Docs: https://docs.expo.dev/versions/v58.0.0/sdk/audio/
 *
 * Music Hub ships ORIGINAL synthetic ambient WAVs only.
 * Voice STT/TTS adapters exist on the server but stay inactive without keys.
 */

import {
  MUSIC_PLAYER_ENABLED,
  VOICE_COACH_ENABLED,
} from '../config/featureFlags';
import { MUSIC_CATEGORIES, MUSIC_TRACKS } from '../content/musicCatalog';

export const REQUIRED_NATIVE_MODULES = {
  audioPlayback: 'expo-audio',
  audioRecording: 'expo-audio',
};

export const AUDIO_ASSET_ROOT = {
  music: 'assets/audio/music',
  ambient: 'assets/audio/ambient',
  voicePrompts: 'assets/audio/voice-prompts',
};

export const MUSIC_CATALOG = MUSIC_TRACKS;

export const MUSIC_PLAYER_DESIGN = {
  screen: 'MusicHub',
  categories: MUSIC_CATEGORIES.map((c) => c.id),
  controls: ['play/pause', 'stop'],
  rules: [
    'Only original|licensed local sources',
    'Pause on SOS / Crisis Lock via pauseForSafety()',
    'Pro-gated Motivation/Focus when PREMIUM_ENABLED',
  ],
};

export const VOICE_PIPELINE_DESIGN = {
  screen: 'VoiceCoach',
  steps: [
    'Request mic permission',
    'Record with useAudioRecorder',
    'POST /voice/transcribe (server key)',
    'Existing /chat coach pipeline',
    'POST /voice/speak for TTS when configured',
  ],
  crisisHandling: [
    'detectCrisis on transcript',
    'Skip coaching TTS on crisis',
    'Show 988 safety copy',
  ],
};

export function getMediaFeatureStatus() {
  return {
    musicEnabled: MUSIC_PLAYER_ENABLED,
    voiceEnabled: VOICE_COACH_ENABLED,
    catalogCount: MUSIC_CATALOG.length,
    categories: MUSIC_CATEGORIES.length,
    modules: REQUIRED_NATIVE_MODULES,
    originalAudioOnly: MUSIC_CATALOG.every(
      (track) => track.license === 'original' || track.license === 'licensed'
    ),
  };
}
