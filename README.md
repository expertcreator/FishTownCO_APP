# Fishtownco (Vessel Companion)

Expo SDK 57 app for vessel compliance / safety inventory.

## Stack

- Expo Router, React Native, TypeScript
- TanStack Query, Zustand, MMKV, Zod
- Firebase (client configs TBD)
- In-repo modules: `shared`, `assets`, `constants`

## Bundle

`com.itoasis.Fishtownco` (Android + iOS)

## Design

https://fishtownco.itoasis.co/

## Scripts

```bash
bun install
bun run dev
bun run typecheck
```

### Windows Android commands

```powershell
bun run win:android:dev
bun run win:android:staging
bun run win:android:prod

# Build APK into project root (like customer-app eas --local → abcd-ef01.apk)
bun run win:android:apk
bun run win:android:apk:release

# Cloud EAS development build
bun run win:eas:build:android:dev

# Local-style on Windows (falls back to expo run:android)
bun run win:eas:build:local:android:dev
```

## EAS builds (same pattern as Foori scripts)

First link an Expo project (once):

```bash
cd D:\githubProjects\FishTownCO_APP
bunx eas login
bunx eas init
```

Then set `EXPO_PUBLIC_EAS_PROJECT_ID` in `.env.local` (or EAS dashboard env).

### EAS cloud builds (same pattern as customer app)

Builds run on Expo servers. When finished, download the APK/AAB from the Expo dashboard link.

```powershell
# Development client APK
bun run eas:build:android:dev
# or on Windows:
bun run win:eas:build:android:dev

# Staging APK (installable)
bun run eas:build:android:staging
# or:
bun run win:eas:build:android:staging

# Production AAB (Play Store)
bun run eas:build:android:prod

# Production APK
bun run eas:build:android:prod-apk
```

| Command | What it builds |
|---|---|
| `bun run eas:build:android:dev` | Android development client (APK) |
| `bun run eas:build:android:staging` | Android staging (preview profile, APK) |
| `bun run eas:build:android:prod` | Android production (AAB) |
| `bun run eas:build:android:prod-apk` | Android production (APK) |
| `bun run eas:build:ios:staging` | iOS staging |
| `bun run eas:build:ios:prod` | iOS production |
| `bun run eas:build:all:staging` | Android + iOS staging |
| `bun run eas:build:all:prod` | Android + iOS production |
| `bun run eas:build:local:android:staging` | Local Android staging build (macOS/Linux) |

Submit placeholders in `eas.json` need Apple / Play credentials before `eas:submit:*`.
