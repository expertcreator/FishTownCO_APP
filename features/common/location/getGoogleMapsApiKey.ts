import Constants from "expo-constants";

/**
 * Returns the Google Maps / Places API key from Expo public env or app config.
 * Used only for Places Autocomplete + Place Details (free monthly credit).
 * @returns API key string, or empty when unset
 */
export function getGoogleMapsApiKey(): string {
  const fromEnv = (process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "").trim();
  if (fromEnv) return fromEnv;

  const extra = Constants.expoConfig?.extra as
    | { googleMapsApiKey?: string }
    | undefined;
  return (extra?.googleMapsApiKey ?? "").trim();
}
