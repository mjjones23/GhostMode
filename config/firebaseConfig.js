/**
 * Firebase setup for Ghost Mode Authentication
 *
 * ─── LATER: add your Firebase web app config ───
 * 1. Go to https://console.firebase.google.com
 * 2. Create a project (or open your existing Ghost Mode project)
 * 3. Add an app → choose Web (</>) or iOS/Android when you add native builds
 * 4. Copy the firebaseConfig object from the Firebase console
 * 5. Put each value in a root `.env` file (recommended):
 *
 *      EXPO_PUBLIC_FIREBASE_API_KEY=AIza...
 *      EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
 *      EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
 *      EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
 *      EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
 *      EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
 *
 * 6. Install Firebase when ready:
 *      npx expo install firebase
 * 7. Set USE_LOCAL_AUTH = false in this file
 * 8. Wire up the real SDK calls in utils/authService.js
 *
 * Firebase API keys in mobile/web apps are public identifiers — they are NOT secret
 * on their own. Still use `.env` so keys are not committed to git by accident.
 * Protect your project with Firebase Auth rules and App Check before launch.
 */

/**
 * While true, Ghost Mode uses fake local login saved in AsyncStorage.
 * Keep this true until Firebase Auth is fully connected and tested.
 */
export const USE_LOCAL_AUTH = true;

/** Firebase project settings — empty until you add `.env` values above. */
export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
};

/** Returns true when Firebase config is filled in and local auth is turned off. */
export function isFirebaseConfigured() {
  if (USE_LOCAL_AUTH) return false;

  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId
  );
}

/** Which auth backend the app is using right now. */
export function getAuthMode() {
  return isFirebaseConfigured() ? 'firebase' : 'local';
}
