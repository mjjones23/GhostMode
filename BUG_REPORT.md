# Ghost Mode — Bug Report (QA)

**Date:** May 25, 2026  
**Method:** Code audit against `LAUNCH_CHECKLIST.md` test flows (navigation registration, storage, premium gating, AI coach, reminders, legal screens). Static analysis — not a full manual device pass.  
**Build check:** iOS bundle export succeeded in prior session (no import/red-screen blockers found).

**Severity key**

| Level | Meaning |
|-------|---------|
| **Critical** | Likely crash, broken core flow, or data loss |
| **High** | Major wrong behavior users will notice |
| **Medium** | Confusing UX, edge-case bugs, or launch risk |
| **Low** | Polish, copy, or minor inconsistency |
| **Launch blocker** | Not a runtime crash, but blocks App Store / legal launch |

---

## Critical

*None found in code review that would reliably crash Expo Go on launch or on normal tab navigation.*

---

## High

### 1. Streak day count is off by one after the first day

| Field | Detail |
|-------|--------|
| **Issue** | No-contact streak shows **one day less** than expected whenever the start date is before today. Example: start date yesterday should be **Day 2**, but the app shows **Day 1**. Start date 12 days ago should be **Day 13**, but shows **Day 12**. |
| **Location** | `utils/storage.js` — `getStreakDay()` uses `Math.max(1, diff)` instead of counting the start day as Day 1 (`diff + 1`). Used by `context/StreakContext.js`, Home streak ring, Progress Insights. |
| **Severity** | High |
| **Recommended fix** | Change streak math to inclusive day counting, e.g. `return Math.max(1, diff + 1)`, and add a quick unit-style check for “today”, “yesterday”, and “7 days ago” presets from Settings. |

### 2. “Delete all local data” does not reset in-memory Premium state

| Field | Detail |
|-------|--------|
| **Issue** | After **Delete all local data**, AsyncStorage is cleared (including Developer Premium flag), but `PremiumContext` is **not** refreshed. User can still have Premium features unlocked until the app is fully restarted. |
| **Location** | `screens/SettingsScreen.js` — `deleteAccount()` calls `clearAllAppData()` and `refreshStreak()` but not `refreshPremium()` / `setDeveloperPremium(false)`. `context/PremiumContext.js`. |
| **Severity** | High |
| **Recommended fix** | After `clearAllAppData()`, call `refreshPremium()` from `usePremium()` (or reset premium state explicitly) before navigating to Login. |

### 3. Password stored in plain text on device

| Field | Detail |
|-------|--------|
| **Issue** | Demo auth saves the raw password in AsyncStorage (`utils/storage.js` → `registerLocalUser`). Login screen even discloses this. Acceptable for dev, **unsafe for production**. |
| **Location** | `utils/storage.js`, `screens/LoginScreen.js`, `utils/authService.js` |
| **Severity** | High (security / launch) |
| **Recommended fix** | Before launch: move to Firebase Auth or hash passwords; never store plaintext passwords. Remove testing disclaimer from production builds. |

---

## Medium

### 4. Changing start date in Settings does not refresh Home streak immediately

| Field | Detail |
|-------|--------|
| **Issue** | Tapping **Start date** in Settings saves the new date but does **not** call `refreshStreak()`. Home only updates after visiting the Home tab (which refocuses and refreshes). User may think the change failed. |
| **Location** | `screens/SettingsScreen.js` — `changeStartDate()` |
| **Severity** | Medium |
| **Recommended fix** | Call `refreshStreak()` after `saveNoContactStart(iso)` (same pattern as `deleteAccount`). |

### 5. Two separate mood systems (Daily Check-In vs Mood tab)

| Field | Detail |
|-------|--------|
| **Issue** | **Daily Check-In** uses 6 moods (`content/dailyCheckInContent.js`: Hurting, Anxious, Missing them, etc.). **Mood tab** uses 5 different moods (`utils/storage.js` → `MOOD_OPTIONS`: Sad, Angry, Lonely, etc.). Data is stored separately. Progress Insights only reads **Mood tab** logs, not Daily Check-In. Users may think check-ins count toward insights — they do not. |
| **Location** | `screens/DailyCheckInScreen.js`, `screens/MoodTrackerScreen.js`, `utils/progressInsights.js`, Home “Today’s Mood” card |
| **Severity** | Medium |
| **Recommended fix** | Either unify mood lists and storage, or clearly label UI (“Daily check-in” vs “Mood log”) and include check-in data in Progress Insights. |

### 6. AI Coach backend status only checked once on mount

| Field | Detail |
|-------|--------|
| **Issue** | `checkCoachBackendStatus()` runs once when AI Coach opens. If the user starts the backend **after** opening the tab, the badge stays **“Mock Mode”** until they leave and return. |
| **Location** | `screens/AICoachScreen.js` — `useEffect` on mount |
| **Severity** | Medium |
| **Recommended fix** | Re-check on screen focus (`useFocusEffect`) or add a manual “Retry connection” action. |

### 7. AI Coach replies appear instantly (no typing delay)

| Field | Detail |
|-------|--------|
| **Issue** | `isTyping` is set true, but `fetchCoachReply()` resolves asynchronously with **no minimum delay**. When the backend responds fast, the typing indicator may flash or skip — feels broken compared to chat UX. Mock mode previously used ~900ms delay (removed in backend integration). |
| **Location** | `screens/AICoachScreen.js` — `deliverReply()` |
| **Severity** | Medium |
| **Recommended fix** | Keep typing indicator visible for at least ~600–900ms before showing the reply. |

### 8. Premium screens flash paywall when access is lost mid-session

| Field | Detail |
|-------|--------|
| **Issue** | `ProgressInsightsScreen` and `DailyReminderScreen` run `useEffect` that calls `openPaywall()` + `navigation.goBack()` when `!isPremium`. If Developer Premium is turned off while one of these screens is open, user gets a jarring paywall + back navigation. |
| **Location** | `screens/ProgressInsightsScreen.js`, `screens/DailyReminderScreen.js` |
| **Severity** | Medium |
| **Recommended fix** | Replace effect with a guard render + single paywall prompt, or listen to premium changes with a clearer message. |

### 9. Local notifications unreliable in Expo Go / simulator

| Field | Detail |
|-------|--------|
| **Issue** | Expo Go shows warnings that push/local notification support is limited (SDK 53+). `ensureNotificationPermissions()` returns `granted: false` on simulator and web with alerts — expected, but easy to misread as an app bug during QA. |
| **Location** | `utils/reminderNotifications.js`, Expo Go runtime |
| **Severity** | Medium (QA / expectations) |
| **Recommended fix** | Document in-app that reminders must be tested on a **physical device** with a dev/production build; do not treat Expo Go simulator failures as app regressions. |

### 10. OpenAI backend unreachable from physical phone with default URL

| Field | Detail |
|-------|--------|
| **Issue** | Default `EXPO_PUBLIC_COACH_API_URL` is `http://localhost:3001`. On a **physical phone**, localhost points to the phone itself, not your PC — AI stays in Mock Mode unless the user sets their PC’s LAN IP in `.env`. |
| **Location** | `config/api.js`, `.env.example` |
| **Severity** | Medium (configuration, not code bug) |
| **Recommended fix** | Surface a clearer Mock Mode hint when `/health` fails on device; ensure `.env.example` explains LAN IP setup prominently. |

### 11. Sign-up success alert may show on wrong screen

| Field | Detail |
|-------|--------|
| **Issue** | After sign-up, `navigation.replace('Onboarding')` runs **before** `Alert.alert('Account created', ...)`. The welcome alert may appear over Onboarding instead of Sign Up. |
| **Location** | `screens/SignUpScreen.js` — `handleSignUp()` |
| **Severity** | Medium |
| **Recommended fix** | Show the alert first, then navigate on “OK”, or navigate to Setup directly after sign-up. |

### 12. Only one local account allowed per device

| Field | Detail |
|-------|--------|
| **Issue** | Second sign-up attempt returns *“An account already exists on this device. Please log in instead.”* even after logout (profile remains until data delete). Expected for demo auth, but confusing in QA. |
| **Location** | `utils/storage.js` — `registerLocalUser()` |
| **Severity** | Medium |
| **Recommended fix** | Clearer error copy pointing to Log in or Delete all data; replace with real auth before launch. |

---

## Low

### 13. Legal / Privacy screens use deprecated SafeAreaView

| Field | Detail |
|-------|--------|
| **Issue** | `LegalDocumentLayout` uses `SafeAreaView` from `react-native` instead of `GhostSafeArea` / `react-native-safe-area-context`. On notched iPhones, padding may differ from the rest of the app (content too high/low vs modals). |
| **Location** | `components/LegalDocumentLayout.js` |
| **Severity** | Low |
| **Recommended fix** | Wrap with `GhostSafeArea` for consistency with other screens. |

### 14. Hard-coded starter messages in AI Coach (sample content)

| Field | Detail |
|-------|--------|
| **Issue** | AI Coach always opens with two pre-written coach messages (`INITIAL_MESSAGES` in `AICoachScreen.js`). Not user data — intentional seed content, but reads as “fake chat history.” |
| **Location** | `screens/AICoachScreen.js` |
| **Severity** | Low |
| **Recommended fix** | Optional: single welcome message, or label as “Getting started.” |

### 15. Paywall and Settings expose demo / developer language

| Field | Detail |
|-------|--------|
| **Issue** | Paywall button says **“Continue (demo)”**; Settings shows **Developer Premium Mode** and “Placeholder text” under legal links. Fine for QA, wrong for production. |
| **Location** | `screens/PaywallScreen.js`, `screens/SettingsScreen.js` |
| **Severity** | Low (copy / launch polish) |
| **Recommended fix** | Hide developer controls and demo labels in production builds (`__DEV__` or env flag). |

### 16. Progress Insights stat cards may wrap awkwardly on small screens

| Field | Detail |
|-------|--------|
| **Issue** | Three stat cards at `width: '31%'` in a row may wrap or feel cramped on narrow devices. |
| **Location** | `screens/ProgressInsightsScreen.js` — `statsGrid` / `statCard` styles |
| **Severity** | Low |
| **Recommended fix** | Test on iPhone SE; consider 2-column layout or horizontal scroll. |

### 17. Unused navigation import in Reasons screen

| Field | Detail |
|-------|--------|
| **Issue** | `useNavigation()` is imported and assigned but never used (`ScreenBackButton` uses its own hook). Harmless, minor code smell. |
| **Location** | `screens/ReasonsScreen.js` |
| **Severity** | Low |
| **Recommended fix** | Remove unused import/variable. |

### 18. Emergency timer interval runs for component lifetime

| Field | Detail |
|-------|--------|
| **Issue** | `EmergencyScreen` starts a 1-second `setInterval` in `useEffect([])` without pausing when modal loses focus. Usually unmounts on close — low impact. |
| **Location** | `screens/EmergencyScreen.js` |
| **Severity** | Low |
| **Recommended fix** | Tie timer to `useFocusEffect` or clear interval on blur. |

---

## Launch blockers (content / store — not Expo crashes)

These will not red-screen Expo Go but **will fail App Store review or user trust** if shipped as-is.

| # | Issue | Location | Recommended fix |
|---|--------|----------|-------------------|
| L1 | Privacy Policy, Terms, and Safety Disclaimer are **placeholder text** | `content/legalDocuments.js`, Settings hint | Replace with real legal copy + public URLs before submit |
| L2 | **Developer Premium Mode** visible to all users | `screens/SettingsScreen.js` | Hide in production builds |
| L3 | **Demo purchases** do not unlock Premium | `services/purchasesService.js`, Paywall | Connect RevenueCat + App Store, or remove paywall until live |
| L4 | **Demo auth** only; passwords on device | `utils/authService.js` | Ship Firebase Auth or equivalent |
| L5 | No public **Privacy Policy URL** for App Store Connect | App Store metadata | Host policy on web; link in Connect |

---

## Checklist flows — code review status

| LAUNCH_CHECKLIST flow | Code review result |
|------------------------|-------------------|
| All 19 screens registered in navigator | **Pass** — `navigation/RootNavigator.js` + Home stack |
| Home quick actions → Emergency, Coach, Journal, Mood, Paywall, Settings | **Pass** — `navigateToAppScreen()` covers root/tab routes |
| Today’s Mood → Daily Check-In | **Pass** — Home stack route `DailyCheckIn` |
| Crisis Lock → Journal tab | **Pass** — `CommonActions.navigate` to `MainTabs` / `Journal` |
| Settings legal links | **Pass** — `LegalDocument`, `SafetyDisclaimer` |
| Coach tab gated without Premium | **Pass** — tab listener + `usePremiumGate` |
| Crisis phrase → 988 message | **Pass** — `utils/crisisSafety.js` + `services/coachService.js` |
| Mock fallback when backend offline | **Pass** — `fetchCoachReply()` |
| Journal / mood save & delete | **Pass** — optimistic UI + `loadVersionRef` race guard |
| Streak matches start date | **Fail** — off-by-one bug (#1) |
| Delete all data resets app | **Partial** — storage cleared; Premium state may linger (#2) |
| Notifications on device | **Needs device QA** — Expo Go / simulator limits (#9) |

---

## Suggested fix order (when you are ready to code)

1. **#1** Streak off-by-one (core trust metric)  
2. **#2** Premium state after delete  
3. **#4** Refresh streak after Settings date change  
4. **#5** Mood / check-in data confusion  
5. **Launch blockers L1–L5** before App Store submit  

---

*No code was changed during this QA pass — report only.*
