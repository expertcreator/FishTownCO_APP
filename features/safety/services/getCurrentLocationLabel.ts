import * as Location from "expo-location";
import { reverseGeocodeLabel } from "@/features/common/location/reverseGeocodeLabel";

export type DeviceLocationResult = {
  label: string;
  latitude: number;
  longitude: number;
};

/**
 * Requests location permission, reads GPS, and builds a display label via
 * Expo `reverseGeocodeAsync` (free — no Google Geocoding / Places API).
 * @returns Location label plus coordinates
 * @throws {Error} When permission is denied or location cannot be read
 */
export async function getCurrentLocationLabel(): Promise<DeviceLocationResult> {
  console.log("[getCurrentLocationLabel] start");

  const permission = await Location.requestForegroundPermissionsAsync();
  console.log("[getCurrentLocationLabel] permission", permission.status);

  if (permission.status !== Location.PermissionStatus.GRANTED) {
    throw new Error("LOCATION_PERMISSION_DENIED");
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  const { latitude, longitude } = position.coords;
  console.log("[getCurrentLocationLabel] coords", { latitude, longitude });

  const label = await reverseGeocodeLabel(latitude, longitude);
  console.log("[getCurrentLocationLabel] success", { label });
  return { label, latitude, longitude };
}
