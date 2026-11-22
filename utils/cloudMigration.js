/**
 * Safe local → cloud migration helpers (Batch 2).
 *
 * CLOUD_MIGRATION_ENABLED must stay false in production.
 * Dry-run builds payloads without writing remotely.
 * Never includes passwords, password hashes, or API secrets.
 */

import {
  CLOUD_DATA_SCHEMA_VERSION,
  CLOUD_MIGRATION_ENABLED,
  CLOUD_SYNC_ENABLED,
} from '../config/cloudFlags';
import {
  loadCoachMemories,
  loadCoachMemoryEnabled,
  loadCoachContextShareEnabled,
  loadDailyPlans,
  loadJournalEntries,
  loadMainGoal,
  loadMoodLogs,
  loadNoContactStart,
  loadReasons,
  loadReminderSettings,
  STORAGE_KEYS,
} from './storage';

const MIGRATABLE_KEYS = [
  STORAGE_KEYS.JOURNAL,
  STORAGE_KEYS.MOODS,
  STORAGE_KEYS.NO_CONTACT_START,
  STORAGE_KEYS.MAIN_GOAL,
  STORAGE_KEYS.REASONS,
  STORAGE_KEYS.DAILY_PLANS,
  STORAGE_KEYS.COACH_MEMORIES,
  STORAGE_KEYS.COACH_MEMORY_ENABLED,
  STORAGE_KEYS.COACH_CONTEXT_SHARE,
  STORAGE_KEYS.REMINDER,
  STORAGE_KEYS.ACHIEVEMENTS,
];

const BLOCKED_KEYS = new Set([
  STORAGE_KEYS.USER_PROFILE,
  STORAGE_KEYS.AUTH_SESSION,
  STORAGE_KEYS.DEVELOPER_PREMIUM,
]);

export function getMigrationStatus() {
  return {
    schemaVersion: CLOUD_DATA_SCHEMA_VERSION,
    syncEnabled: CLOUD_SYNC_ENABLED,
    migrationEnabled: CLOUD_MIGRATION_ENABLED,
    migratableKeys: MIGRATABLE_KEYS,
    blockedKeys: [...BLOCKED_KEYS],
    productionSafe: !CLOUD_MIGRATION_ENABLED,
  };
}

/**
 * Builds an account-linked snapshot from local data.
 * Strips credentials and chat transcripts by default.
 */
export async function buildLocalCloudPayload({ includeCoachChat = false } = {}) {
  const [
    journal,
    moods,
    streakStart,
    goal,
    reasons,
    plans,
    memories,
    memoryEnabled,
    contextShare,
    reminder,
  ] = await Promise.all([
    loadJournalEntries(),
    loadMoodLogs(),
    loadNoContactStart(),
    loadMainGoal(),
    loadReasons(),
    loadDailyPlans(),
    loadCoachMemories(),
    loadCoachMemoryEnabled(),
    loadCoachContextShareEnabled(),
    loadReminderSettings(),
  ]);

  const payload = {
    schemaVersion: CLOUD_DATA_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      journal,
      moods,
      noContactStart: streakStart,
      mainGoal: goal,
      reasons,
      dailyPlans: plans,
      coachMemories: memories,
      coachMemoryEnabled: memoryEnabled,
      coachContextShare: contextShare,
      reminder: {
        enabled: Boolean(reminder?.enabled),
        time: reminder?.time || null,
        // Intentionally omit custom message bodies that might contain private text
        // until sync rules are reviewed.
      },
    },
  };

  if (includeCoachChat) {
    payload.data.coachChatIncluded = false;
    payload.warnings = [
      'Coach chat export is disabled by default for privacy.',
    ];
  }

  return payload;
}

export function validateCloudPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return { ok: false, error: 'Payload must be an object.' };
  }
  if (payload.schemaVersion !== CLOUD_DATA_SCHEMA_VERSION) {
    return {
      ok: false,
      error: `Unsupported schemaVersion ${payload.schemaVersion}.`,
    };
  }
  if (!payload.data || typeof payload.data !== 'object') {
    return { ok: false, error: 'Payload data is required.' };
  }
  if (payload.data.password || payload.data.passwordHash || payload.data.userProfile) {
    return { ok: false, error: 'Credentials must not be migrated.' };
  }
  return { ok: true };
}

/**
 * Dry-run migration report. Never writes to the cloud.
 */
export async function dryRunLocalToCloudMigration(accountId) {
  const payload = await buildLocalCloudPayload();
  const validation = validateCloudPayload(payload);
  const counts = {
    journal: payload.data.journal?.length || 0,
    moods: payload.data.moods?.length || 0,
    reasons: payload.data.reasons?.length || 0,
    memories: payload.data.coachMemories?.length || 0,
    planDays: payload.data.dailyPlans
      ? Object.keys(payload.data.dailyPlans).length
      : 0,
  };

  return {
    ok: validation.ok,
    error: validation.error || null,
    accountId: accountId || null,
    wouldWrite: false,
    migrationEnabled: CLOUD_MIGRATION_ENABLED,
    counts,
    payloadBytes: JSON.stringify(payload).length,
  };
}

/**
 * Performs migration only when CLOUD_MIGRATION_ENABLED is true.
 * Production default is a hard no-op.
 */
export async function migrateLocalDataToCloud({
  accountId,
  uploader,
} = {}) {
  if (!CLOUD_MIGRATION_ENABLED) {
    return {
      ok: false,
      skipped: true,
      reason: 'CLOUD_MIGRATION_ENABLED is false (production-safe default).',
    };
  }

  if (!CLOUD_SYNC_ENABLED) {
    return {
      ok: false,
      skipped: true,
      reason: 'CLOUD_SYNC_ENABLED is false.',
    };
  }

  if (!accountId || typeof uploader !== 'function') {
    return { ok: false, error: 'accountId and uploader are required.' };
  }

  const payload = await buildLocalCloudPayload();
  const validation = validateCloudPayload(payload);
  if (!validation.ok) {
    return { ok: false, error: validation.error };
  }

  const result = await uploader(accountId, payload);
  return { ok: true, result };
}

/**
 * Merge strategy for restoring cloud → local without wiping newer local edits.
 * Local wins on conflicting ids (safe default). Does not auto-apply.
 */
export function mergeCloudIntoLocal(localList, cloudList, idKey = 'id') {
  const local = Array.isArray(localList) ? localList : [];
  const remote = Array.isArray(cloudList) ? cloudList : [];
  const byId = new Map();

  remote.forEach((item) => {
    if (item && item[idKey] != null) byId.set(String(item[idKey]), item);
  });
  local.forEach((item) => {
    if (item && item[idKey] != null) byId.set(String(item[idKey]), item);
  });

  return [...byId.values()];
}
