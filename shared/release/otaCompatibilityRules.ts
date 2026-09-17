/**
 * Canonical OTA / store-build policy for Fishtownco.
 */

export const OTA_COMPATIBILITY_RULES = {
  runtimeVersionPolicy: "appVersion" as const,

  nativeChangesRequireStoreBuild: [
    "new native module install (expo-* or react-native-*)",
    "Expo SDK version bump",
    "new Android permission or iOS entitlement",
    "google-services or GoogleService-Info.plist file change",
    "app.config plugins list change",
    "new Expo config plugin added",
  ] as const,

  safeForOTA: [
    "JS/TS feature logic changes (no new native module calls)",
    "UI style, layout, or copy updates",
    "feature-flag resolution logic changes",
    "new API endpoint calls (additive, backward-compatible only)",
    "TanStack Query hook or cache policy updates",
    "Zustand store field additions (not removals or renames)",
    "new screen or route registered via expo-router (existing slug structure only)",
  ] as const,

  channels: {
    staging: "fishtownco-customer-staging",
    production: "fishtownco-customer-production",
    development: "development",
  } as const,

  publishNotes: {
    easUpdateNeedsAppVariant:
      "Use EXPO_PUBLIC_APP_VARIANT matching the native binary when publishing EAS Updates for Fishtownco.",
  },
} as const;
