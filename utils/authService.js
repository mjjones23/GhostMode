import {
  loadLoggedInUser,
  loginLocalUser,
  logoutLocalUser,
  registerLocalUser,
} from './storage';

/**
 * Ghost Mode auth service.
 *
 * Uses fake local login (AsyncStorage) for now.
 * Firebase will be added later — see config/firebaseConfig.js.
 */

const USE_LOCAL_AUTH = true;

function mapLocalUser(user) {
  if (!user) return null;
  return {
    uid: `local:${user.email}`,
    name: user.name,
    email: user.email,
    provider: 'local',
  };
}

/** Create a new account (local demo auth). */
export async function signUpUser({ name, email, password }) {
  if (!USE_LOCAL_AUTH) {
    return {
      ok: false,
      message: 'Sign-in is temporarily unavailable. Please try again later.',
    };
  }

  const result = await registerLocalUser({ name, email, password });
  if (!result.ok) return result;

  return {
    ok: true,
    user: mapLocalUser(result.user),
    mode: 'local',
  };
}

/** Sign in with email and password (local demo auth). */
export async function loginUser({ email, password }) {
  if (!USE_LOCAL_AUTH) {
    return {
      ok: false,
      message: 'Sign-in is temporarily unavailable. Please try again later.',
    };
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
  await logoutLocalUser();
  return { ok: true, mode: 'local' };
}

/** Return the signed-in user, or null if logged out. */
export async function getCurrentUser() {
  const user = await loadLoggedInUser();
  return mapLocalUser(user);
}
