import {
  loadLoggedInUser,
  loginLocalUser,
  logoutLocalUser,
  registerLocalUser,
} from './storage';
import { getAuthMode, isFirebaseConfigured } from '../config/firebaseConfig';
import {
  cloudGetCurrentUser,
  cloudLogin,
  cloudLogout,
  cloudSignUp,
  getCloudAuthStatus,
} from '../services/cloudAuthService';

/**
 * Ghost Mode auth service (Batch 2).
 * Defaults to local AsyncStorage accounts.
 * Cloud (Firebase) activates only when CLOUD_AUTH_ENABLED + env config are set.
 */

function mapLocalUser(user) {
  if (!user) return null;
  return {
    uid: `local:${user.email}`,
    name: user.name,
    email: user.email,
    provider: 'local',
  };
}

/** Create a new account. */
export async function signUpUser({ name, email, password }) {
  if (isFirebaseConfigured()) {
    const cloud = await cloudSignUp({ name, email, password });
    if (cloud.ok) return cloud;
    // Fall back to local so development never bricks signup.
  }

  const result = await registerLocalUser({ name, email, password });
  if (!result.ok) return result;

  return {
    ok: true,
    user: mapLocalUser(result.user),
    mode: 'local',
  };
}

/** Sign in with email and password. */
export async function loginUser({ email, password }) {
  if (isFirebaseConfigured()) {
    const cloud = await cloudLogin({ email, password });
    if (cloud.ok) return cloud;
  }

  const result = await loginLocalUser({ email, password });
  if (!result.ok) return result;

  return {
    ok: true,
    user: mapLocalUser(result.user),
    mode: 'local',
  };
}

/** Sign the current user out. */
export async function logoutUser() {
  if (isFirebaseConfigured()) {
    await cloudLogout();
  }
  await logoutLocalUser();
  return { ok: true, mode: getAuthMode() };
}

/** Return the signed-in user, or null if logged out. */
export async function getCurrentUser() {
  if (isFirebaseConfigured()) {
    const cloudUser = await cloudGetCurrentUser();
    if (cloudUser) return cloudUser;
  }

  const user = await loadLoggedInUser();
  return mapLocalUser(user);
}

export function getAuthStatus() {
  return {
    mode: getAuthMode(),
    cloud: getCloudAuthStatus(),
  };
}
