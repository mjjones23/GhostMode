/**
 * Ghost Mode 2.0 feature flags (client).
 * Flip these carefully — do not deploy production changes from this branch alone.
 */

export { PREMIUM_ENABLED, AI_QUOTA_ENABLED } from './premiumFlags';

/**
 * When true, daily plans may request optional AI ranking from the backend.
 * Catalog/rule fallback always remains available.
 */
export const AI_DAILY_PLAN_ENABLED = false;

/** Music player UI/catalog wiring — assets must be licensed/original before enabling. */
export const MUSIC_PLAYER_ENABLED = false;

/** Voice capture → transcription → coach → playback. Paid STT/TTS stay off until reviewed. */
export const VOICE_COACH_ENABLED = false;
