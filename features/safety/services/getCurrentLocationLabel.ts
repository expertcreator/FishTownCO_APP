import * as Location from "expo-location";

export type DeviceLocationResult = {
  label: string;
  latitude: number;
  longitude: number;
};

/**
 * Requests location permission, reads GPS, and builds a display label
 * (same idea as Foori location → reverse-geocode for an address line).
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

  const places = await Location.reverseGeocodeAsync({ latitude, longitude });
  const place = places[0];
  const parts = [
    place?.name,
    place?.street,
    place?.city,
    place?.region,
    place?.postalCode,
    place?.country,
  ]
    .map((p) => p?.trim())
    .filter((p): p is string => Boolean(p));

  const unique = [...new Set(parts)];
  const label =
    unique.length > 0
      ? unique.join(", ")
      : `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

  console.log("[getCurrentLocationLabel] success", { label });
  return { label, latitude, longitude };
}
