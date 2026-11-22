/**
 * Account-linked cloud sync service (Batch 2 groundwork).
 * Writes are blocked while CLOUD_SYNC_ENABLED / CLOUD_MIGRATION_ENABLED are false.
 */

import { CLOUD_SYNC_ENABLED } from '../config/cloudFlags';
import {
  buildLocalCloudPayload,
  dryRunLocalToCloudMigration,
  migrateLocalDataToCloud,
  validateCloudPayload,
} from '../utils/cloudMigration';
import { getCoachApiUrl, isCoachApiConfigured } from '../config/api';

async function postAccountSnapshot(accountId, payload) {
  if (!isCoachApiConfigured()) {
    throw new Error('Coach API URL is not configured.');
  }
  const baseUrl = getCoachApiUrl();
  const response = await fetch(`${baseUrl}/account/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId, payload }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Cloud sync failed.');
  }
  return data;
}

export async function previewAccountSync(accountId) {
  return dryRunLocalToCloudMigration(accountId);
}

export async function syncAccountData(accountId) {
  if (!CLOUD_SYNC_ENABLED) {
    return {
      ok: false,
      skipped: true,
      reason: 'CLOUD_SYNC_ENABLED is false.',
    };
  }

  return migrateLocalDataToCloud({
    accountId,
    uploader: postAccountSnapshot,
  });
}

export async function exportLocalAccountBundle() {
  const payload = await buildLocalCloudPayload();
  return validateCloudPayload(payload).ok
    ? { ok: true, payload }
    : { ok: false, error: 'Invalid local payload.' };
}

export function isCloudSyncActive() {
  return CLOUD_SYNC_ENABLED;
}
