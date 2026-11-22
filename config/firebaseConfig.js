/**
 * Firebase setup for Ghost Mode Authentication (Batch 2).
 *
 * Cloud auth stays OFF until CLOUD_AUTH_ENABLED is true AND env config is filled.
 * Firebase web API keys are public identifiers — still keep them in `.env`.
 * Protect the project with Auth rules and App Check before production launch.
 *
 * Setup:
 * 1. Create a Firebase project
 * 2. Add EXPO_PUBLIC_FIREBASE_* values to root `.env`
 * 3. npm install firebase
 * 4. Set CLOUD_AUTH_ENABLED = true in config/cloudFlags.js (dev only at first)
 * 5. Keep CLOUD_MIGRATION_ENABLED false until migration is reviewed
 */

import { CLOUD_AUTH_ENABLED } from './cloudFlags';

/**
 * Legacy local-only switch. Prefer CLOUD_AUTH_ENABLED + isFirebaseConfigured().
 * When true, forces local AsyncStorage auth regardless of Firebase env.
 */
export const USE_LOCAL_AUTH = !CLOUD_AUTH_ENABLED;

/** Firebase project settings — empty until you add `.env` values. */
export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
};

export function hasFirebaseEnvConfig() {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId
  );
}

/** Ready for live Firebase Auth calls (flag + env). */
export function isFirebaseConfigured() {
  return CLOUD_AUTH_ENABLED && hasFirebaseEnvConfig();
}

/** Which auth backend the app should use. */
export function getAuthMode() {
  return isFirebaseConfigured() ? 'firebase' : 'local';
}
