/**
 * URL of your Ghost Mode backend (NOT OpenAI directly).
 *
 * The OpenAI API key lives only in server/.env on your computer.
 * The mobile app sends chat messages to this backend URL instead.
 *
 * Set in a root .env file (see .env.example):
 * EXPO_PUBLIC_COACH_API_URL=http://YOUR_COMPUTER_IP:3001
 *
 * - iOS Simulator: http://localhost:3001
 * - Android Emulator: http://10.0.2.2:3001
 * - Physical phone: http://192.168.x.x:3001 (your PC's Wi-Fi IP)
 */
const DEFAULT_URL = 'http://localhost:3001';

export function getCoachApiUrl() {
  const url = process.env.EXPO_PUBLIC_COACH_API_URL || DEFAULT_URL;
  return url.replace(/\/$/, '');
}
