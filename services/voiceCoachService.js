/**
 * Voice AI Coach network + privacy helpers (Batch 2).
 * Recording stays in the screen via expo-audio hooks.
 * STT/TTS credentials never leave the backend.
 */

import { AudioModule, requestRecordingPermissionsAsync } from 'expo-audio';
import { getCoachApiUrl, isCoachApiConfigured } from '../config/api';
import { VOICE_COACH_ENABLED } from '../config/featureFlags';
import { detectCrisis } from '../utils/crisisSafety';

export const VOICE_MAX_SECONDS = 45;

export const VOICE_PRIVACY_NOTICE =
  'Voice clips are sent only when you tap Send to Coach. They are processed on Ghost Mode servers for transcription and coaching. Do not record others without consent. Crisis language shows safety resources instead of coaching.';

export async function getMicrophonePermission() {
  const current = await AudioModule.getRecordingPermissionsAsync();
  if (current.granted) {
    return { granted: true, status: current.status, canAskAgain: current.canAskAgain };
  }
  const requested = await requestRecordingPermissionsAsync();
  return {
    granted: Boolean(requested.granted),
    status: requested.status,
    canAskAgain: requested.canAskAgain,
  };
}

export async function transcribeVoiceClip({ uri, accountId }) {
  if (!VOICE_COACH_ENABLED) {
    return { ok: false, error: 'Voice Coach is not enabled.' };
  }
  if (!uri) return { ok: false, error: 'Missing recording.' };
  if (!isCoachApiConfigured()) {
    return {
      ok: false,
      unavailable: true,
      error: 'Voice transcription needs the Ghost Mode backend URL.',
    };
  }

  const baseUrl = getCoachApiUrl();
  const form = new FormData();
  form.append('audio', {
    uri,
    name: 'voice.m4a',
    type: 'audio/m4a',
  });
  if (accountId) form.append('accountId', String(accountId));

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(`${baseUrl}/voice/transcribe`, {
      method: 'POST',
      body: form,
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        ok: false,
        unavailable: response.status === 503,
        error: data.message || data.error || 'Transcription failed.',
      };
    }
    const transcript = String(data.transcript || '').trim();
    return {
      ok: true,
      transcript,
      crisis: detectCrisis(transcript),
      provider: data.provider || 'server',
    };
  } catch (error) {
    return {
      ok: false,
      unavailable: true,
      error:
        error?.name === 'AbortError'
          ? 'Transcription timed out.'
          : 'Could not reach voice transcription.',
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function requestCoachSpeechAudio(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed) return { ok: false, error: 'Nothing to speak.' };
  if (!isCoachApiConfigured()) {
    return { ok: false, unavailable: true, error: 'TTS backend unavailable.' };
  }

  const baseUrl = getCoachApiUrl();
  try {
    const response = await fetch(`${baseUrl}/voice/speak`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: trimmed.slice(0, 500) }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.audioUrl) {
      return {
        ok: false,
        unavailable: response.status === 503,
        error: data.message || 'Text-to-speech is not configured on the server.',
      };
    }
    return { ok: true, audioUrl: data.audioUrl, provider: data.provider || 'server' };
  } catch {
    return { ok: false, unavailable: true, error: 'TTS request failed.' };
  }
}

export function getVoiceCoachClientStatus() {
  return {
    enabled: VOICE_COACH_ENABLED,
    maxSeconds: VOICE_MAX_SECONDS,
    backendConfigured: isCoachApiConfigured(),
  };
}
