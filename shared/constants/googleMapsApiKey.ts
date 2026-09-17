import Constants from "expo-constants";

/**
 * Google Maps API key from Expo config `extra` (set in `app.config.impl.ts`), with Metro
 * fallbacks for local dev. Prefer this over reading `process.env` directly so EAS config
 * phase and runtime stay aligned.
 */
export function getGoogleMapsApiKey(): string {
  const extra = Constants.expoConfig?.extra as
    | { googleMapsApiKey?: string }
    | undefined;
  const fromExtra = extra?.googleMapsApiKey?.trim();
  if (fromExtra) {
    return fromExtra;
  }
  return (
    (process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "").trim() ||
    (process.env.GOOGLE_MAPS_API_KEY ?? "").trim() ||
    ""
  );
}
