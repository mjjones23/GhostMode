/**
 * Cloud auth / sync / migration flags (Batch 2).
 * Keep all production-facing switches OFF until Firebase + rules are reviewed.
 */

/** When true, authService may use Firebase if configured. */
export const CLOUD_AUTH_ENABLED = false;

/** When true, account-linked cloud sync may run after sign-in. */
export const CLOUD_SYNC_ENABLED = false;

/**
 * When true, local→cloud migration helpers may write remotely.
 * Must stay false in production until explicitly activated.
 */
export const CLOUD_MIGRATION_ENABLED = false;

/** Schema version for account-linked payloads. */
export const CLOUD_DATA_SCHEMA_VERSION = 1;
