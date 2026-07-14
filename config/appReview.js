/**
 * Apple App Review only.
 * This email unlocks Premium in TestFlight/App Store builds so reviewers
 * can test AI Coach and other Premium features without a real subscription.
 * Do not use this account for normal users.
 *
 * Put these credentials in App Store Connect → App Review Information
 * under “Sign-in required” demo account.
 */
export const APP_REVIEW_PREMIUM_EMAIL = 'ghostmode.apple.review@gmail.com';

/** Demo password for Apple App Review sign-in (local auth + future Firebase). */
export const APP_REVIEW_PASSWORD = 'GmRv-9K#x7pQ2wL!';

export const APP_REVIEW_DISPLAY_NAME = 'Apple Reviewer';

export function isAppReviewPremiumEmail(email) {
  const normalized = String(email || '').trim().toLowerCase();
  return normalized === APP_REVIEW_PREMIUM_EMAIL;
}

export function isAppReviewCredentials(email, password) {
  if (!isAppReviewPremiumEmail(email)) return false;
  return String(password || '') === APP_REVIEW_PASSWORD;
}
