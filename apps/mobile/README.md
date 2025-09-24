# Marshanta Mobile (Capacitor)

This app wraps the built PWA (`apps/web/dist`) using Capacitor to ship iOS/Android.

## Prerequisites

- Node.js LTS
- Xcode (for iOS)
- CocoaPods (`sudo gem install cocoapods`) if not installed
- Android Studio + SDK (for Android)

## Build the Web and Sync

```bash
# From repo root
npm run -w @marshanta/web build
npm run -w @marshanta/mobile cap:sync
```

## iOS: Run on Simulator or Device

```bash
# Open the iOS project in Xcode
npm run -w @marshanta/mobile cap:open:ios
```

In Xcode:
- Select your Team and enable automatic signing (Targets → App → Signing & Capabilities).
- Choose a Simulator or your connected iPhone.
- Product → Run.

If running on a physical iPhone:
- Ensure the phone and your Mac are on the same Wi‑Fi network.
- In the app UI, set the API Base to your Mac’s LAN IP and API port (e.g., `http://192.168.1.70:4000`).
  - In the “Welcome” card, use the `API Base` input and press `Set API Base`.

## Android: Run on Emulator or Device

```bash
# Open the Android project in Android Studio
npm run -w @marshanta/mobile cap:open:android
```

In Android Studio:
- Let Gradle sync.
- Choose an emulator or a connected device.
- Run the app.

If running on a physical Android device:
- Ensure the device and your development machine are on the same Wi‑Fi network.
- In the app UI, set the API Base to your machine’s LAN IP and API port (e.g., `http://192.168.1.70:4000`).

## Screenshots (placeholders)

- iOS: `apps/mobile/ios/screenshots/` (add PNGs here)
- Android: `apps/mobile/android/screenshots/` (add PNGs here)

## Common Issues

- White screen after build: make sure web assets are built (`apps/web/dist`) and `cap:sync` was run.
- API requests fail on device: verify API Base URL points to your machine IP and port, and that the API is running.
- CORS: in dev, the API allows localhost/127.0.0.1 and Capacitor origin; see `apps/api/src/index.js`.
