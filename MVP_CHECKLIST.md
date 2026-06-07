# Ghost Mode — MVP Checklist

Use this list before sharing the app with testers or submitting to the App Store.

---

## Completed features (MVP)

### Core healing loop
- [x] Onboarding + setup (start date, goal, reminder time)
- [x] No-contact streak tracker on Home
- [x] Daily healing message on Home
- [x] “I Almost Texted Them” crisis lock flow
- [x] “I Texted Them” streak reset flow
- [x] My Reasons (save personal reasons locally)

### Journal & mood
- [x] Daily journal (save, list, delete — local storage)
- [x] Mood tracker tab (log moods with optional notes)
- [x] Daily Check-In (one mood per day + 14-day history)

### AI Coach (mock only)
- [x] Premium-gated AI Coach tab
- [x] Quick prompt buttons
- [x] Keyword-based mock replies
- [x] Crisis safety message (988) for self-harm language
- [x] Mock Mode status indicator
- [x] Backend prep (`server/` folder) — **not required for MVP testing**

### Account & settings
- [x] Local login / sign up (AsyncStorage — demo auth)
- [x] Settings: start date, reminders, premium toggle
- [x] Developer Premium Mode for testing paid features
- [x] Clear all data + logout

### Premium & monetization (demo)
- [x] Paywall screen (RevenueCat structure, demo purchases)
- [x] Progress Insights (premium)
- [x] Free plan history limits on journal/mood

### Legal & safety
- [x] Privacy Policy screen (placeholder copy)
- [x] Terms screen (placeholder copy)
- [x] Safety Disclaimer screen

### Notifications
- [x] Daily reminder time picker
- [x] Local notification scheduling (physical device)

---

## Remaining before App Store

### Must do
- [ ] Replace placeholder legal copy with real Privacy Policy / Terms
- [ ] Connect real App Store subscriptions (RevenueCat + Apple/Google)
- [ ] Remove or hide “Developer Premium Mode” in production builds
- [ ] Replace demo paywall copy (“Continue (demo)”)
- [ ] App Store screenshots, description, age rating
- [ ] Test on real iPhone + Android (not just simulator)
- [ ] Decide: connect real OpenAI backend or ship mock coach v1

### Should do
- [ ] Firebase or real auth (optional if keeping local-only v1)
- [ ] Cloud backup / sync (currently all data is on-device only)
- [ ] App icon & splash final polish
- [ ] Accessibility pass (VoiceOver labels, contrast)
- [ ] Error reporting (e.g. Sentry) for production crashes

### Nice to have (post-MVP)
- [ ] Push notification opt-in onboarding
- [ ] Widget / streak on home screen
- [ ] Export journal data
- [ ] Dark/light theme toggle

---

## Bugs & flows to test

Run through these on **Expo Go** with `npx expo start --clear`.

### Auth & setup
- [ ] Fresh install → Login → Setup → lands on Home tabs
- [ ] Sign up → Onboarding → Setup
- [ ] Logout → returns to Login
- [ ] Clear all data → wipes storage and returns to Login

### Home & navigation
- [ ] Every Home button opens a real screen (no red navigation errors)
- [ ] Today's Mood card → Daily Check-In
- [ ] Crisis Lock → Open Journal lands on Journal tab
- [ ] Tab bar safe area looks correct on iPhone (no clipped content)

### Journal, mood, check-in
- [ ] Save journal entry → appears in list → delete works
- [ ] Save mood → history updates → delete works
- [ ] Daily Check-In → pick mood → calendar updates → Home card updates
- [ ] Empty states show when lists are empty

### AI Coach (mock)
- [ ] Each quick prompt sends and gets a reply
- [ ] Mock Mode badge visible
- [ ] Crisis phrase triggers 988 safety message (not mock coach)
- [ ] Sending many messages never crashes

### Premium
- [ ] Coach tab without premium → Paywall
- [ ] Developer Premium ON → Coach + Insights + reminders unlock
- [ ] Free plan hides old journal/mood history correctly

### Settings & reminders
- [ ] Change start date → streak updates
- [ ] Reminder time picker opens and saves
- [ ] Daily reminder screen loads (premium)

### Edge cases
- [ ] Airplane mode → app still works (local data)
- [ ] Rotate phone / keyboard open on journal & coach — layout OK
- [ ] Rapid tap Send on coach — no duplicate crash

---

## Quick start commands

```bash
cd "d:\IT PROJECTS\GhostMode"
npx expo start --clear
```

Optional AI backend (not needed for mock coach):

```bash
npm run server:install
npm run server
```

---

*Last updated: MVP polish pass — mock coach only, local storage, demo auth.*
