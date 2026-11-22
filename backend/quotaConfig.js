/**
 * Server-side AI message quota (Ghost Mode Pro foundation).
 * Configure via env — never trust the client for Pro status without a secret.
 */

function envBool(name, fallback) {
  const raw = process.env[name];
  if (raw == null || raw === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(raw).toLowerCase());
}

function envInt(name, fallback) {
  const n = Number.parseInt(process.env[name], 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

const DEFAULT_LIMIT = 10;
const DEFAULT_WINDOW_MS = 5 * 60 * 60 * 1000;

const proIds = String(process.env.GHOST_PRO_ACCOUNT_IDS || '')
  .split(',')
  .map((id) => id.trim().toLowerCase())
  .filter(Boolean);

module.exports = {
  /** When false, quota checks are no-ops (useful for local free-period testing). */
  QUOTA_ENFORCEMENT: envBool('QUOTA_ENFORCEMENT', true),
  FREE_LIMIT: envInt('AI_FREE_MESSAGE_LIMIT', DEFAULT_LIMIT),
  WINDOW_MS: envInt('AI_FREE_WINDOW_MS', DEFAULT_WINDOW_MS),
  /** Comma-separated account ids treated as Pro (testing / manual grants). */
  PRO_ACCOUNT_IDS: new Set(proIds),
  /**
   * Optional shared secret. Client may send header X-Ghost-Pro-Bypass
   * matching this value for developer Pro testing. Empty = disabled.
   */
  PRO_BYPASS_SECRET: String(process.env.PRO_BYPASS_SECRET || '').trim(),
  DATA_DIR: process.env.QUOTA_DATA_DIR || null,
};
