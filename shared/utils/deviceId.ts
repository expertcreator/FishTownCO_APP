import { mmkv } from "@/shared/stores/mmkvStorage";
import * as Application from "expo-application";
import { Platform } from "react-native";

/**
 * Get unique device identifier
 * Uses native device identifiers (IDFV for iOS, androidId for Android)
 *
 * @returns Promise<string> Device ID string that's unique per device
 */
export async function getDeviceId(): Promise<string> {
  try {
    // Check if we already have a stored device ID
    let deviceId = mmkv.getString("deviceId");

    // Invalidate if it contains 'undefined' or 'fallback'
    if (deviceId?.includes("undefined") || deviceId?.includes("fallback")) {
      mmkv.delete("deviceId");
      deviceId = undefined;
    }

    if (deviceId) {
      return deviceId;
    }

    // Generate device ID using native identifiers
    let nativeId: string | null = null;

    if (Platform.OS === "ios") {
      // iOS: Use identifierForVendor (IDFV) - unique per vendor
      nativeId = await Application.getIosIdForVendorAsync();
    } else if (Platform.OS === "android") {
      // Android: Use androidId - unique per device
      nativeId = Application.getAndroidId();
    }

    if (!nativeId) {
      throw new Error("Native device ID not available");
    }

    // Create unique device ID
    deviceId = `${Platform.OS}-${nativeId}`;

    // Store for future use
    mmkv.set("deviceId", deviceId);

    return deviceId;
  } catch (error) {
    // Handle any errors from native APIs or storage
    throw new Error(`Failed to generate device ID: ${error}`);
  }
}
