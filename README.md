# Mitrata

Mitrata is a calm, retro-inspired social discovery prototype built with Expo and Expo Router for Android and iOS.

## What is included
- Landing page with login and sign-up
- Route guards for signed-in vs signed-out users
- Home feed
- Search with filters for query, location, gender, age range, and premium-only profiles
- Messages screen with seeded threads
- Create post screen with local persistence
- Profile screen and sign-out flow
- Soft, calming theme inspired by quiet anime palettes

## Current architecture
This is a **local-first working prototype**:
- auth is stored locally with AsyncStorage
- posts are stored locally with AsyncStorage
- messages are seeded locally
- no remote backend is required to test the app UX right away

## Install and run
1. Install Node.js LTS.
2. Create a fresh Expo app environment.
3. In this project folder, run:

```bash
npm install
npx expo start
```

To run on Android:

```bash
npx expo run:android
```

To run on iOS:

```bash
npx expo run:ios
```

## Build installable binaries
After logging into Expo/EAS and configuring your app identifiers:

```bash
npm install -g eas-cli
eas login
eas build --platform all
```

## Next recommended phase
To make Mitrata truly multi-user and production-ready, the next build should add:
- Supabase or Firebase backend
- real auth with email verification and password reset
- profile photos upload
- real-time messaging
- moderation, blocking, reporting
- server-side search and saved filters
- payments for premium filters
- analytics, crash reporting, and abuse protection

## Notes
The app is designed to be a practical MVP foundation, not a final locked-down production release. Security and scale become much stronger after adding a proper backend, database rules, and store-release hardening.
