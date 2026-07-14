import Constants from 'expo-constants';

/**
 * Ghost Mode coach backend URL (never OpenAI directly).
 *
 * Dev: EXPO_PUBLIC_COACH_API_URL=http://YOUR_WIFI_IP:3001
 * Prod/TestFlight: EXPO_PUBLIC_COACH_API_URL=https://your-public-backend.example.com
 *
 * OPENAI_API_KEY must NEVER live in the mobile app — only in backend/.env.
 */
const DEV_FALLBACK_URL = 'http://10.0.0.200:3001';

function readConfiguredUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_COACH_API_URL;
  const fromExtra = Constants.expoConfig?.extra?.coachApiUrl;
  return String(fromEnv || fromExtra || '').trim();
}

export function getCoachApiUrl() {
  const configured = readConfiguredUrl();

  if (configured) {
    return configured.replace(/\/$/, '');
  }

  // Local Expo / __DEV__ only — LAN backend on your PC
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    return DEV_FALLBACK_URL;
  }

  // Production/TestFlight without a public URL: empty → health fails clearly
  return '';
}

export function isCoachApiConfigured() {
  return Boolean(getCoachApiUrl());
}
