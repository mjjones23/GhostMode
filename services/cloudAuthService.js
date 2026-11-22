/**
 * Secure cloud authentication adapter (Firebase-ready).
 * Inactive until CLOUD_AUTH_ENABLED + Firebase env are set.
 * Never stores API secrets — only public Firebase web config.
 */

import {
  firebaseConfig,
  getAuthMode,
  hasFirebaseEnvConfig,
  isFirebaseConfigured,
} from '../config/firebaseConfig';
import { CLOUD_AUTH_ENABLED } from '../config/cloudFlags';

let firebaseApp = null;
let firebaseAuth = null;
let initError = null;

export function getCloudAuthStatus() {
  return {
    flagEnabled: CLOUD_AUTH_ENABLED,
    envConfigured: hasFirebaseEnvConfig(),
    ready: isFirebaseConfigured(),
    mode: getAuthMode(),
    initError,
  };
}

/**
 * Lazy-loads firebase SDK only when cloud auth is meant to run.
 * Returns null when unavailable so local auth keeps working.
 */
export async function initCloudAuth() {
  if (!isFirebaseConfigured()) {
    return { ok: false, reason: 'cloud_auth_inactive' };
  }

  if (firebaseAuth) {
    return { ok: true, auth: firebaseAuth };
  }

  try {
    // Optional dependency — install with: npx expo install firebase
    // eslint-disable-next-line import/no-extraneous-dependencies, global-require
    const { initializeApp, getApps } = require('firebase/app');
    // eslint-disable-next-line import/no-extraneous-dependencies, global-require
    const {
      getAuth,
      initializeAuth,
      getReactNativePersistence,
    } = require('firebase/auth');
    // eslint-disable-next-line import/no-extraneous-dependencies, global-require
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;

    firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    try {
      firebaseAuth = initializeAuth(firebaseApp, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch {
      firebaseAuth = getAuth(firebaseApp);
    }

    initError = null;
    return { ok: true, auth: firebaseAuth };
  } catch (error) {
    initError = error?.message || 'firebase_sdk_unavailable';
    return { ok: false, reason: 'firebase_sdk_unavailable', error: initError };
  }
}

function mapFirebaseUser(user, nameHint = '') {
  if (!user) return null;
  return {
    uid: user.uid,
    name: nameHint || user.displayName || user.email?.split('@')[0] || 'Member',
    email: user.email || '',
    provider: 'firebase',
  };
}

export async function cloudSignUp({ name, email, password }) {
  const ready = await initCloudAuth();
  if (!ready.ok) {
    return {
      ok: false,
      message:
        'Cloud sign-up is not active yet. Local accounts still work on this device.',
      reason: ready.reason,
    };
  }

  try {
    // eslint-disable-next-line import/no-extraneous-dependencies, global-require
    const { createUserWithEmailAndPassword, updateProfile } = require('firebase/auth');
    const credential = await createUserWithEmailAndPassword(
      firebaseAuth,
      String(email || '').trim(),
      String(password || '')
    );
    if (name) {
      await updateProfile(credential.user, { displayName: String(name).trim() });
    }
    return {
      ok: true,
      user: mapFirebaseUser(credential.user, name),
      mode: 'firebase',
    };
  } catch (error) {
    return {
      ok: false,
      message: error?.message || 'Cloud sign-up failed.',
      code: error?.code,
    };
  }
}

export async function cloudLogin({ email, password }) {
  const ready = await initCloudAuth();
  if (!ready.ok) {
    return {
      ok: false,
      message: 'Cloud sign-in is not active yet.',
      reason: ready.reason,
    };
  }

  try {
    // eslint-disable-next-line import/no-extraneous-dependencies, global-require
    const { signInWithEmailAndPassword } = require('firebase/auth');
    const credential = await signInWithEmailAndPassword(
      firebaseAuth,
      String(email || '').trim(),
      String(password || '')
    );
    return {
      ok: true,
      user: mapFirebaseUser(credential.user),
      mode: 'firebase',
    };
  } catch (error) {
    return {
      ok: false,
      message: error?.message || 'Cloud sign-in failed.',
      code: error?.code,
    };
  }
}

export async function cloudLogout() {
  if (!firebaseAuth) return { ok: true };
  try {
    // eslint-disable-next-line import/no-extraneous-dependencies, global-require
    const { signOut } = require('firebase/auth');
    await signOut(firebaseAuth);
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error?.message || 'Cloud logout failed.' };
  }
}

export async function cloudGetCurrentUser() {
  const ready = await initCloudAuth();
  if (!ready.ok) return null;
  return mapFirebaseUser(firebaseAuth?.currentUser || null);
}
