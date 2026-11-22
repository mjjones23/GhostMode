/**
 * Ghost Mode Music Hub catalog.
 * All bundled tracks are ORIGINAL synthetic ambient WAVs generated for this app.
 * Do not add third-party/unlicensed music here.
 */

export const MUSIC_CATEGORIES = [
  {
    id: 'relaxation',
    label: 'Relaxation',
    description: 'Soft pads to settle your nervous system.',
    icon: 'leaf-outline',
    color: '#c4b5fd',
  },
  {
    id: 'sleep',
    label: 'Sleep',
    description: 'Low drones for winding down.',
    icon: 'moon-outline',
    color: '#93c5fd',
  },
  {
    id: 'rain',
    label: 'Rain',
    description: 'Gentle rain texture.',
    icon: 'rainy-outline',
    color: '#67e8f9',
  },
  {
    id: 'ocean',
    label: 'Ocean',
    description: 'Soft swell and shoreline hush.',
    icon: 'water-outline',
    color: '#6ee7b7',
  },
  {
    id: 'motivation',
    label: 'Motivation',
    description: 'Light lift without lyrics.',
    icon: 'flash-outline',
    color: '#fcd34d',
  },
  {
    id: 'focus',
    label: 'Focus',
    description: 'Steady pulse for journaling or planning.',
    icon: 'bulb-outline',
    color: '#fda4af',
  },
];

export const MUSIC_TRACKS = [
  {
    id: 'relaxation-soft-pad',
    categoryId: 'relaxation',
    title: 'Soft Pad',
    artist: 'Ghost Mode Originals',
    license: 'original',
    licenseRef: 'scripts/generate-original-ambient.js',
    durationMs: 6000,
    requirePro: false,
    loop: true,
    source: require('../assets/audio/ambient/relaxation-soft-pad.wav'),
  },
  {
    id: 'sleep-deep-drone',
    categoryId: 'sleep',
    title: 'Deep Drone',
    artist: 'Ghost Mode Originals',
    license: 'original',
    licenseRef: 'scripts/generate-original-ambient.js',
    durationMs: 6000,
    requirePro: false,
    loop: true,
    source: require('../assets/audio/ambient/sleep-deep-drone.wav'),
  },
  {
    id: 'rain-soft-patter',
    categoryId: 'rain',
    title: 'Soft Patter',
    artist: 'Ghost Mode Originals',
    license: 'original',
    licenseRef: 'scripts/generate-original-ambient.js',
    durationMs: 6000,
    requirePro: false,
    loop: true,
    source: require('../assets/audio/ambient/rain-soft-patter.wav'),
  },
  {
    id: 'ocean-gentle-swell',
    categoryId: 'ocean',
    title: 'Gentle Swell',
    artist: 'Ghost Mode Originals',
    license: 'original',
    licenseRef: 'scripts/generate-original-ambient.js',
    durationMs: 6000,
    requirePro: false,
    loop: true,
    source: require('../assets/audio/ambient/ocean-gentle-swell.wav'),
  },
  {
    id: 'motivation-lift',
    categoryId: 'motivation',
    title: 'Lift',
    artist: 'Ghost Mode Originals',
    license: 'original',
    licenseRef: 'scripts/generate-original-ambient.js',
    durationMs: 6000,
    requirePro: true,
    loop: true,
    source: require('../assets/audio/ambient/motivation-lift.wav'),
  },
  {
    id: 'focus-steady-pulse',
    categoryId: 'focus',
    title: 'Steady Pulse',
    artist: 'Ghost Mode Originals',
    license: 'original',
    licenseRef: 'scripts/generate-original-ambient.js',
    durationMs: 6000,
    requirePro: true,
    loop: true,
    source: require('../assets/audio/ambient/focus-steady-pulse.wav'),
  },
];

export function getTracksByCategory(categoryId) {
  return MUSIC_TRACKS.filter((track) => track.categoryId === categoryId);
}

export function getTrackById(trackId) {
  return MUSIC_TRACKS.find((track) => track.id === trackId) || null;
}

export function getCategoryById(categoryId) {
  return MUSIC_CATEGORIES.find((category) => category.id === categoryId) || null;
}
