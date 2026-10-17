import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Returns the Google Maps / Places API key for the current platform.
 * iOS uses its own key. Android keeps the existing maps key.
 * @returns API key string, or empty when unset
 */
export function getGoogleMapsApiKey(): string {
  const extra = Constants.expoConfig?.extra as
    | { googleMapsApiKey?: string; googleMapsIosApiKey?: string }
    | undefined;
  if (Platform.OS === "ios") {
    const iosKey = (
      process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY ??
      extra?.googleMapsIosApiKey ??
      ""
    ).trim();
    if (iosKey) return iosKey;
  }

  const androidKey = (process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "").trim();
  if (androidKey) return androidKey;
  return (extra?.googleMapsApiKey ?? "").trim();
}
