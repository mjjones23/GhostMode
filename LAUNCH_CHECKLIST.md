# Ghost Mode — Launch Checklist

This is your **before-you-ship** guide. Work through it section by section when you are ready to put Ghost Mode on the App Store.

**Beginner tip:** You do not need to finish everything at once. Think of this like packing for a trip — some items are “must pack,” others are “nice to have.”

---

## Features completed (already built in the app)

These work today in Expo Go (mostly with **local storage** and **demo modes** for paid features and AI):

### Core healing
- [x] Onboarding and first-time setup (start date, goal, reminder time)
- [x] Home dashboard with no-contact streak tracker
- [x] Daily healing message on Home
- [x] “I Almost Texted Them” → Crisis Lock flow (breathing, support messages)
- [x] “I Texted Them” → streak reset flow
- [x] My Reasons (save personal reasons on device)

### Journal, mood, check-in
- [x] Daily journal (write, save, list, delete)
- [x] Mood tracker tab
- [x] Daily Check-In (one mood per day + calendar history)
- [x] “Today’s Mood” card on Home

### AI Coach
- [x] Premium-gated AI Coach tab
- [x] Quick prompt buttons
- [x] Mock replies when backend is offline
- [x] Real OpenAI backend **prepared** (`server/server.js`, `POST /chat`)
- [x] Crisis safety message (988) for self-harm language
- [x] “Mock Mode” / “AI Connected” status on Coach screen

### Account & settings
- [x] Local login and sign up (demo auth — data on device)
- [x] Settings: streak start date, reminders, legal links
- [x] **Developer Premium Mode** (test Premium without paying)
- [x] Logout and “delete all local data”

### Premium & paywall (demo today)
- [x] Paywall screen with monthly/yearly plans
- [x] RevenueCat structure prepared (`services/purchasesService.js`)
- [x] Product IDs: `ghost_monthly`, `ghost_yearly`
- [x] Progress Insights (Premium)
- [x] Free plan limits on journal/mood history

### Legal & safety screens
- [x] Privacy Policy screen (placeholder text)
- [x] Terms of Service screen (placeholder text)
- [x] Safety Disclaimer screen

### Notifications
- [x] Daily reminder time picker
- [x] Local notification scheduling (best on a real phone)

---

## Bugs & flows to test

Run the app with:

```bash
cd "d:\IT PROJECTS\GhostMode"
npx expo start --clear
```

Use **Developer Premium Mode** in Settings when testing Premium features without subscriptions.

### Auth & first launch
- [ ] Fresh install → Login → Setup → lands on 5-tab Home screen
- [ ] Sign up → works → can reach main app
- [ ] Logout → returns to Login
- [ ] Delete all data → wipes storage and returns to Login

### Navigation (no red error screens)
- [ ] Every Home quick action opens the right screen
- [ ] Today’s Mood card → Daily Check-In
- [ ] Crisis Lock → “Open Journal” lands on Journal tab
- [ ] Settings legal links → Privacy, Terms, Safety Disclaimer
- [ ] Back buttons work on modal/stack screens

### Streak & crisis
- [ ] Streak day count matches chosen start date
- [ ] Streak reset clears streak and feels correct
- [ ] Emergency Mode opens and shows a random reason (if saved)

### Journal, mood, check-in
- [ ] Save journal entry → appears → delete works
- [ ] Save mood → history updates → delete works
- [ ] Daily Check-In → pick mood → calendar updates → Home card updates
- [ ] Empty states show when lists are empty

### AI Coach
- [ ] Each quick prompt sends and gets a reply
- [ ] With server **off** → “Mock Mode” + mock replies
- [ ] With server **on** + OpenAI key → “AI Connected” + real replies
- [ ] Crisis phrase (e.g. “I want to hurt myself”) → **988 safety message**, not normal coaching
- [ ] Rapid taps on Send do not crash the app

### Premium & paywall
- [ ] Coach tab without Premium → Paywall
- [ ] Progress Insights without Premium → Paywall
- [ ] Developer Premium ON → Coach, Insights, reminders unlock
- [ ] Free plan hides old journal/mood entries beyond limit
- [ ] Paywall “Restore Purchases” shows sensible message in demo mode

### Settings & reminders
- [ ] Change streak start date → streak updates
- [ ] Reminder time picker saves correctly
- [ ] Daily reminder screen loads (Premium)

### Edge cases
- [ ] Airplane mode → app still works (local data)
- [ ] Keyboard open on journal/coach → layout not broken
- [ ] iPhone notch / home bar — content not clipped (safe areas)

---

## App Store requirements (Apple)

Apple needs more than a working app. You also submit **metadata** (text and images) about the app.

### Apple Developer account
- [ ] Enroll in [Apple Developer Program](https://developer.apple.com/programs/) ($99/year)
- [ ] Confirm bundle ID matches the app: **`com.ghostmode.app`**

### App Store Connect app record
- [ ] Create app in [App Store Connect](https://appstoreconnect.apple.com)
- [ ] App name: **Ghost Mode**
- [ ] Primary category (likely **Health & Fitness** or **Lifestyle** — pick what fits your marketing)
- [ ] Age rating questionnaire (be honest about mental health / journaling content)
- [ ] **Privacy nutrition labels** — declare what data you collect (journal, mood, email if using Firebase, etc.)

### Required URLs & legal (Apple will ask)
- [ ] **Privacy Policy URL** (must be a public web page — not just in-app placeholder text)
- [ ] **Support URL** (contact page or email)
- [ ] Terms of Service (often linked from Privacy page or App Store description)

### App review notes
- [ ] Explain that Ghost Mode is **not crisis support** and directs users to 988
- [ ] If AI Coach uses OpenAI, mention it in review notes and Privacy Policy
- [ ] Provide a **demo login** or test instructions if login is required
- [ ] Hide or remove **Developer Premium Mode** from production builds before submit

### Build & submit (when ready — not Expo Go)
- [ ] Move from Expo Go to a **development build** or **EAS Build** for App Store
- [ ] Test on a **real iPhone** (not simulator only)
- [ ] Upload build via Xcode or EAS Submit
- [ ] Submit for review

---

## Subscription setup steps (RevenueCat + App Store)

Today purchases are **demo only**. For real money:

### 1. App Store Connect — create subscriptions
- [ ] Open App Store Connect → your app → **Subscriptions**
- [ ] Create a subscription group (e.g. “Ghost Mode Premium”)
- [ ] Add products with these **exact IDs** (must match the code):
  - `ghost_monthly`
  - `ghost_yearly`
- [ ] Set prices, localization, and review screenshots for subscriptions

### 2. RevenueCat
- [ ] Create project at [revenuecat.com](https://app.revenuecat.com)
- [ ] Add iOS app with bundle ID **`com.ghostmode.app`**
- [ ] Import/link App Store Connect products
- [ ] Create entitlement named **`premium`** (matches `config/revenuecat.js`)
- [ ] Copy **public iOS API key** → root `.env`:
  ```
  EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_your_key_here
  ```

### 3. Connect in the app (developer task)
- [ ] Run `npm install react-native-purchases`
- [ ] Uncomment RevenueCat plugin in `app.config.js` when ready
- [ ] Uncomment real `Purchases.*` calls in `services/purchasesService.js`
- [ ] Set `USE_DEMO_PURCHASES = false` in `config/revenuecat.js`
- [ ] Remove “Continue (demo)” paywall copy
- [ ] Test purchase, restore, and expiry on a **Sandbox Apple ID**

### 4. App Store rules for subscriptions
- [ ] Show what Premium includes before purchase (paywall already lists features)
- [ ] Link to Terms and Privacy on paywall or Settings
- [ ] Restore Purchases button works (required by Apple)

---

## OpenAI backend setup steps

The OpenAI key must **never** go in the mobile app. It lives only on your server.

### 1. Get an OpenAI key
- [ ] Create account at [platform.openai.com](https://platform.openai.com)
- [ ] Create an API key (keep it secret)

### 2. Configure the Ghost Mode server
- [ ] Install server dependencies:
  ```bash
  cd "d:\IT PROJECTS\GhostMode"
  npm run server:install
  ```
- [ ] Copy env template:
  ```bash
  copy server\.env.example server\.env
  ```
- [ ] Edit `server/.env` and paste your key:
  ```
  OPENAI_API_KEY=sk-your-real-key-here
  PORT=3001
  ```

### 3. Start the server
- [ ] Run:
  ```bash
  npm run server
  ```
- [ ] You should see: `Ghost Mode coach server running on http://localhost:3001`

### 4. Point the mobile app at the server
- [ ] In root `.env` (see `.env.example`), set:
  - **iOS Simulator:** `EXPO_PUBLIC_COACH_API_URL=http://localhost:3001`
  - **Physical iPhone (same Wi‑Fi):** `EXPO_PUBLIC_COACH_API_URL=http://YOUR_PC_IP:3001`
- [ ] Restart Expo: `npx expo start --clear`
- [ ] AI Coach should show **“AI Connected”** when server + key are working

### 5. Production (later)
- [ ] Deploy `server/` to a cloud host (Railway, Render, Fly.io, etc.)
- [ ] Use HTTPS URL in production `.env`
- [ ] Add rate limiting and abuse protection before public launch
- [ ] Mention AI data processing in Privacy Policy

---

## Firebase setup steps (optional — for real accounts)

Today the app uses **local demo login** (saved on the phone). Firebase is prepared but not required for v1.

### 1. Create Firebase project
- [ ] Go to [Firebase Console](https://console.firebase.google.com)
- [ ] Create project (e.g. “Ghost Mode”)
- [ ] Add an **iOS** app with bundle ID **`com.ghostmode.app`**

### 2. Enable Authentication
- [ ] Firebase → Authentication → Sign-in method
- [ ] Enable **Email/Password**

### 3. Add config to the app
- [ ] Copy Firebase config values into root `.env` (see `config/firebaseConfig.js`):
  ```
  EXPO_PUBLIC_FIREBASE_API_KEY=...
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
  EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
  EXPO_PUBLIC_FIREBASE_APP_ID=...
  ```

### 4. Wire up in code (when ready)
- [ ] Run `npx expo install firebase`
- [ ] Set `USE_LOCAL_AUTH = false` in `config/firebaseConfig.js`
- [ ] Implement real Firebase calls in `utils/authService.js`
- [ ] Test sign up, login, logout, password reset
- [ ] Enable Firebase App Check before production

### 5. Decide on data storage
- [ ] Today: journal/mood/streak are **on-device only**
- [ ] If you add cloud sync later, update Privacy Policy and App Store privacy labels

---

## Privacy policy steps

In-app Privacy/Terms screens exist but use **placeholder text**. Apple expects a **real policy on the web**.

### What to write (topics to cover)
- [ ] What data you collect (journal, moods, streak, email, device IDs)
- [ ] What stays **on the device** vs what goes to **servers** (OpenAI, Firebase, RevenueCat)
- [ ] How AI Coach messages are processed (sent to your backend → OpenAI)
- [ ] That you are **not** a HIPAA-covered therapist or crisis service
- [ ] How users delete data (Settings → delete all local data)
- [ ] Contact email for privacy questions
- [ ] Children’s privacy (if under 13, say you do not knowingly collect)

### Where to publish
- [ ] Host Privacy Policy on a public URL (your website, Notion public page, Termly, iubenda, etc.)
- [ ] Paste that URL into App Store Connect
- [ ] Replace placeholder copy in `content/legalDocuments.js` **or** link out to the web page from Settings

### Terms of Service
- [ ] Not medical advice / not crisis support
- [ ] Subscription billing terms (auto-renew, cancel in Apple ID settings)
- [ ] Acceptable use
- [ ] Limitation of liability (have a lawyer review before launch)

### Safety disclaimer
- [ ] Keep clear: **call 988** (U.S./Canada) or local emergency services in crisis
- [ ] AI Coach is supportive coaching, not therapy

---

## Screenshots needed (App Store Connect)

Apple requires screenshots for each device size you support. Capture them from a **real build** (simulator or device), not Expo Go if possible for final submit.

### Recommended screens to photograph
1. **Home** — streak ring + healing message (hero shot)
2. **Daily Check-In** — mood picker + calendar
3. **Journal** — writing screen or entry list
4. **AI Coach** — chat with supportive reply (avoid crisis test content in marketing shots)
5. **Mood tracker** — mood history
6. **Paywall** — Premium features + plans (required if you sell subscriptions)
7. **Crisis Lock / breathing** (optional — shows safety-focused design)

### Apple size requirements (check current docs — sizes change)
- [ ] **6.7"** iPhone (e.g. iPhone 15 Pro Max) — required
- [ ] **6.5"** iPhone — often required
- [ ] **5.5"** iPhone — if still listed in Connect
- [ ] iPad screenshots — if `supportsTablet: true` and you ship iPad

### Tips
- [ ] Use dark purple Ghost Mode UI — it’s your brand
- [ ] No personal real journal text in screenshots (use generic demo content)
- [ ] Add short marketing captions in App Store Connect (optional but helps conversion)

---

## Final pre-launch checklist

Do this **right before** you hit Submit for Review.

### Code & config
- [ ] `USE_DEMO_PURCHASES = false` (if selling subscriptions)
- [ ] Developer Premium Mode hidden/disabled in production
- [ ] No test API keys committed to git (`.env` is gitignored)
- [ ] OpenAI key only in `server/.env`, not in mobile app
- [ ] Production backend URL set (HTTPS), not `localhost`
- [ ] App version bumped in `app.config.js` if needed

### Legal & trust
- [ ] Real Privacy Policy live on the web
- [ ] Real Terms of Service live on the web
- [ ] Safety disclaimer reviewed
- [ ] App Store privacy questionnaire completed accurately

### Payments
- [ ] Sandbox subscription purchase tested end-to-end
- [ ] Restore Purchases tested
- [ ] Premium features unlock after purchase
- [ ] Paywall shows correct prices from App Store / RevenueCat

### AI & safety
- [ ] AI Coach tested with backend on and off (fallback works)
- [ ] Crisis phrases always return 988 message, never normal coaching
- [ ] Review notes explain AI limitations for Apple reviewers

### Quality
- [ ] Full test pass on **real iPhone**
- [ ] No red Metro errors on cold start
- [ ] Notifications tested on physical device
- [ ] App icon and splash look correct (`assets/icon.png`, `assets/splash-icon.png`)

### App Store listing
- [ ] App name, subtitle, description written
- [ ] Keywords chosen
- [ ] Screenshots uploaded for all required sizes
- [ ] Support URL and Privacy Policy URL added
- [ ] Age rating set
- [ ] Review contact info filled in

### After approval
- [ ] Monitor crash reports and user feedback
- [ ] Watch OpenAI usage/costs on backend
- [ ] Plan updates for bugs and feature requests

---

## Quick reference

| Item | Value |
|------|--------|
| App name | Ghost Mode |
| Bundle ID | `com.ghostmode.app` |
| Subscription products | `ghost_monthly`, `ghost_yearly` |
| RevenueCat entitlement | `premium` |
| Backend chat endpoint | `POST /chat` |
| Backend health check | `GET /health` |
| Default backend URL | `http://localhost:3001` |

---

*Last updated: launch prep — local auth, RevenueCat placeholders, OpenAI backend ready, mock fallbacks active.*
