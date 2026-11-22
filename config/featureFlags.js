/**
 * Ghost Mode 2.0 feature flags (client).
 * Flip these carefully — do not deploy production changes from this branch alone.
 */

export { PREMIUM_ENABLED, AI_QUOTA_ENABLED } from './premiumFlags';
export {
  CLOUD_AUTH_ENABLED,
  CLOUD_SYNC_ENABLED,
  CLOUD_MIGRATION_ENABLED,
} from './cloudFlags';

/**
 * When true, daily plans may request optional AI ranking from the backend.
 * Catalog/rule fallback always remains available.
 */
export const AI_DAILY_PLAN_ENABLED = false;

/**
 * Music Hub UI + original ambient playback.
 * Uses project-owned synthetic ambient WAVs only (see assets/audio/ambient).
 */
export const MUSIC_PLAYER_ENABLED = true;

/**
 * Voice Coach UI. Paid STT/TTS providers stay inactive without server keys.
 * Client can still record and fall back to typed coach replies.
 */
export const VOICE_COACH_ENABLED = true;
