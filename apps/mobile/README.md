# Mobile (Capacitor) – iOS and Android

This package wraps the web PWA (`apps/web/`) in a native WebView using Capacitor v7.

- App ID: `com.marshanta.app`
- Config: `apps/mobile/capacitor.config.ts` (`webDir: ../web/dist`)
- iOS workspace: `apps/mobile/ios/App/App.xcworkspace`
- Android project: `apps/mobile/android/`

## Prereqs
- Xcode (latest) + iOS simulator runtime
- CocoaPods (`brew install cocoapods`)
- Android Studio + SDKs (for Android)
- Node 20+

## Build the web bundle
Run from repo root:

```bash
npm --workspace @marshanta/web run build
```

Outputs to `apps/web/dist/`.

## Sync native projects
From repo root:

```bash
npm --workspace @marshanta/mobile run cap:sync
```

This copies `apps/web/dist/` into iOS `App/App/public` and Android `app/src/main/assets/public` and installs native deps.

## Run iOS (Xcode UI)
1. Open workspace:
   ```bash
   npm --workspace @marshanta/mobile run cap:open:ios
   ```
2. In Xcode, select a simulator (e.g., iPhone 15) and press Run.
3. First run signing (if prompted): Targets → App → Signing & Capabilities → select Team and use a unique Bundle Identifier.

### Run iOS (Terminal)
```bash
xcrun simctl list devices available
export SIM_UDID="$(xcrun simctl list devices available | awk -F '[()]' '/iPhone/{print $2; exit}')"
cd apps/mobile/ios/App
xcodebuild -workspace App.xcworkspace -scheme App -configuration Debug -sdk iphonesimulator -destination "platform=iOS Simulator,id=$SIM_UDID" -derivedDataPath build CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO build
xcrun simctl boot "$SIM_UDID" || true
xcrun simctl install "$SIM_UDID" "$(pwd)/build/Build/Products/Debug-iphonesimulator/App.app"
xcrun simctl launch "$SIM_UDID" com.marshanta.app
```

## Run Android (Android Studio UI)
1. Open project:
   ```bash
   npm --workspace @marshanta/mobile run cap:open:android
   ```
2. Select an AVD (emulator) and click Run.

### Run Android (Terminal)
```bash
cd apps/mobile/android
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb shell monkey -p com.marshanta.app 1
```

## API base configuration (localhost vs devices)
- API runs at `http://localhost:4000`.
- iOS Simulator usually reaches `http://localhost:4000` directly.
- Android Emulator cannot use `localhost` for the host Mac. Use `http://10.0.2.2:4000`.
- Physical devices must use your Mac's LAN IP, e.g. `http://192.168.1.23:4000` (ensure firewall allows connections).

### Setting apiBase in the app (during development)
Use Safari Web Inspector (iOS) or Chrome DevTools (Android WebView inspect) and run:
```js
localStorage.setItem('apiBase', 'http://localhost:4000');
location.reload();
```
- For Android emulator, use:
```js
localStorage.setItem('apiBase', 'http://10.0.2.2:4000');
location.reload();
```
- For physical devices, use your LAN IP.

## Permissions
- iOS: `Info.plist` includes `NSLocationWhenInUseUsageDescription`, `NSLocationAlwaysAndWhenInUseUsageDescription`, and ATS relaxed for dev (`NSAppTransportSecurity > NSAllowsArbitraryLoads: true`).
- Android: `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, and `usesCleartextTraffic=true` in `AndroidManifest.xml` for dev.

## Troubleshooting
- Port 4000 already in use:
  ```bash
  lsof -ti tcp:4000 | xargs kill -9 || true
  ```
- CORS from iOS WebView:
  - API allows `capacitor://localhost` and returns 204 for OPTIONS.
- Xcode sandbox denies reading Pods script:
  - Rebuild with `ENABLE_USER_SCRIPT_SANDBOXING=NO` or ensure CocoaPods input/output paths are enabled (default in this repo).
- Always open `App.xcworkspace` (not `App.xcodeproj`).

## Release (later)
- iOS: Archive in Xcode, set signing, upload to TestFlight.
- Android: Generate a release build, sign, upload to Play Console.
