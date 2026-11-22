/**
 * Single shared music player for Music Hub (expo-audio).
 * Only plays catalog tracks with license original|licensed and a local source.
 */

import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { getTrackById } from '../content/musicCatalog';

let player = null;
let currentTrackId = null;
let audioModeReady = false;

async function ensureAudioMode() {
  if (audioModeReady) return;
  await setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: false,
  });
  audioModeReady = true;
}

function assertAuthorized(track) {
  if (!track) return { ok: false, error: 'Track not found.' };
  if (track.license !== 'original' && track.license !== 'licensed') {
    return { ok: false, error: 'Track is not authorized for playback.' };
  }
  if (track.source == null) {
    return { ok: false, error: 'Audio asset is missing.' };
  }
  return { ok: true };
}

export function getMusicPlayerState() {
  return {
    trackId: currentTrackId,
    playing: Boolean(player?.playing),
    hasPlayer: Boolean(player),
  };
}

export async function playTrack(trackId, { loop = true } = {}) {
  const track = getTrackById(trackId);
  const allowed = assertAuthorized(track);
  if (!allowed.ok) return allowed;

  await ensureAudioMode();

  if (player && currentTrackId === trackId) {
    player.play();
    return { ok: true, trackId, resumed: true };
  }

  await stopPlayback();
  player = createAudioPlayer(track.source, { updateInterval: 500 });
  player.loop = loop && track.loop !== false;
  currentTrackId = trackId;
  player.play();
  return { ok: true, trackId, resumed: false };
}

export async function pausePlayback() {
  if (!player) return { ok: true, paused: false };
  player.pause();
  return { ok: true, paused: true };
}

export async function resumePlayback() {
  if (!player) return { ok: false, error: 'Nothing to resume.' };
  player.play();
  return { ok: true };
}

export async function stopPlayback() {
  if (player) {
    try {
      player.pause();
      player.remove();
    } catch {
      // ignore cleanup errors
    }
  }
  player = null;
  currentTrackId = null;
  return { ok: true };
}

/** Crisis / SOS should call this. */
export async function pauseForSafety() {
  return pausePlayback();
}
