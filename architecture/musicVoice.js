/**
 * Music & Voice architecture (Batch 1 groundwork).
 *
 * Expo SDK 58: use `expo-audio` (not deprecated expo-av) for playback/recording.
 * Docs: https://docs.expo.dev/versions/v58.0.0/sdk/audio/
 *
 * DO NOT enable MUSIC_PLAYER_ENABLED or VOICE_COACH_ENABLED until:
 * - Audio assets are original or properly licensed
 * - Paid STT/TTS providers and cost caps are reviewed
 * - App Store privacy nutrition labels / mic permission copy are updated
 */

import {
  MUSIC_PLAYER_ENABLED,
  VOICE_COACH_ENABLED,
} from '../config/featureFlags';

/** Expected native modules when media features ship. */
export const REQUIRED_NATIVE_MODULES = {
  audioPlayback: 'expo-audio',
  audioRecording: 'expo-audio',
  /** Optional later — file moves out of cache for retained voice notes. */
  fileSystem: 'expo-file-system',
};

/**
 * Licensed / original asset layout (place files only after license review).
 * Keep placeholders empty so the app never ships unlicensed tracks.
 */
export const AUDIO_ASSET_ROOT = {
  music: 'assets/audio/music',
  ambient: 'assets/audio/ambient',
  voicePrompts: 'assets/audio/voice-prompts',
};

export const AUDIO_CATALOG_SCHEMA = {
  id: 'string',
  title: 'string',
  artist: 'string',
  license: 'original | licensed | pending',
  licenseRef: 'string|null',
  durationMs: 'number',
  requirePro: 'boolean',
  /** Metro require() source — only after asset exists. */
  source: 'number|null',
};

/** Empty until licensed/original files are added. */
export const MUSIC_CATALOG = [];

export const MUSIC_PLAYER_DESIGN = {
  screens: ['Home ambient control', 'Optional Focus / Calm sheet'],
  controls: ['play/pause', 'scrub', 'volume', 'favorite (local)'],
  rules: [
    'Single shared player instance to avoid overlapping tracks',
    'Pause on SOS / Crisis Lock',
    'Respect silent switch via expo-audio setAudioModeAsync',
    'No streaming URLs until CDN + licensing are ready',
  ],
};

export const VOICE_PIPELINE_DESIGN = {
  steps: [
    'Request mic permission (NSMicrophoneUsageDescription / RECORD_AUDIO)',
    'Record short clip with expo-audio useAudioRecorder',
    'Upload audio to backend STT (provider TBD — not enabled)',
    'Run existing /chat crisis + coach pipeline on transcript',
    'Optional TTS playback of reply (provider TBD — not enabled)',
  ],
  crisisHandling: [
    'Run detectCrisis on transcript before model calls',
    'Skip STT/TTS billing path when crisis keywords match client-side',
    'Always surface 988 / IASP resources on crisis',
  ],
  costControls: [
    'Max recording length (e.g. 45s)',
    'Server-side daily voice minute cap for free/Pro',
    'Reuse AI message quota for voice→text coach turns',
    'Feature flag VOICE_COACH_ENABLED stays false until review',
  ],
  privacy: [
    'Do not retain raw audio by default',
    'User consent before sending voice off-device',
    'Clear local cache recordings on Settings delete',
  ],
};

export function getMediaFeatureStatus() {
  return {
    musicEnabled: MUSIC_PLAYER_ENABLED,
    voiceEnabled: VOICE_COACH_ENABLED,
    catalogCount: MUSIC_CATALOG.length,
    modules: REQUIRED_NATIVE_MODULES,
    readyForImplementation:
      !MUSIC_PLAYER_ENABLED &&
      !VOICE_COACH_ENABLED &&
      MUSIC_CATALOG.length === 0,
  };
}
