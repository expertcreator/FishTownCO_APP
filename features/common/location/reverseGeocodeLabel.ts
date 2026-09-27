import * as Location from "expo-location";

type BigDataCloudReverseGeoJson = {
  city?: string;
  locality?: string;
  countryName?: string;
  principalSubdivision?: string;
  postcode?: string;
  street?: string;
  localityInfo?: {
    administrative?: { name?: string; adminLevel?: number }[];
  };
};

const BIGDATACLOUD_REVERSE_GEO_BASE =
  (process.env.EXPO_PUBLIC_BIGDATACLOUD_REVERSE_GEO_BASE ?? "").trim() ||
  "https://api-bdc.io/data/reverse-geocode-client";

/**
 * Formats a BigDataCloud reverse-geocode payload into a single address line
 * (customer-app pattern).
 * @param data - BigDataCloud JSON body
 * @returns Address line, or empty when nothing useful is present
 */
function formatAddressFromBigDataCloud(data: BigDataCloudReverseGeoJson): string {
  const parts: string[] = [];
  const street = data.street?.trim();
  if (street) parts.push(street);

  let district: string | undefined;
  const admin = data.localityInfo?.administrative;
  if (admin?.length) {
    for (const a of admin) {
      const n = a.name?.trim();
      if (!n) continue;
      if (n === data.city?.trim() || n === data.locality?.trim()) continue;
      if (
        /district|tehsil|borough|municipality|subdivision/i.test(n) ||
        a.adminLevel === 6 ||
        a.adminLevel === 7
      ) {
        district = n;
        break;
      }
    }
  }
  if (
    !district &&
    data.locality?.trim() &&
    data.city?.trim() &&
    data.locality.trim() !== data.city.trim()
  ) {
    district = data.locality.trim();
  }

  const city = data.city?.trim();
  if (district && district !== city) parts.push(district);
  if (city) parts.push(city);

  const region = data.principalSubdivision?.trim();
  if (region && region !== city && region !== district) parts.push(region);

  const postal = data.postcode?.trim();
  if (postal) parts.push(postal);

  const country = data.countryName?.trim();
  if (country) parts.push(country);

  return parts.join(", ");
}

/**
 * Free BigDataCloud client reverse-geocode (no Google Geocoding API).
 * Used when Android native Geocoder is unavailable ("Geocoder is not running").
 * @param latitude - Latitude
 * @param longitude - Longitude
 * @returns Address label, or null when the request fails
 */
async function reverseGeocodeWithBigDataCloud(
  latitude: number,
  longitude: number
): Promise<string | null> {
  try {
    const url = `${BIGDATACLOUD_REVERSE_GEO_BASE}?${new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      localityLanguage: "en",
    }).toString()}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = (await response.json()) as BigDataCloudReverseGeoJson;
    const label = formatAddressFromBigDataCloud(data).trim();
    return label.length > 0 ? label : null;
  } catch (error) {
    console.warn("[reverseGeocodeLabel] BigDataCloud failed", error);
    return null;
  }
}

/**
 * Builds a display address from coordinates.
 * Tries Expo Location first (customer-app pattern), then free BigDataCloud
 * when the native Geocoder is missing on Android.
 * @param latitude - Latitude
 * @param longitude - Longitude
 * @returns Human-readable label, or lat/lng fallback
 */
export async function reverseGeocodeLabel(
  latitude: number,
  longitude: number
): Promise<string> {
  try {
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
    if (unique.length > 0) {
      return unique.join(", ");
    }
  } catch (error) {
    console.warn(
      "[reverseGeocodeLabel] Expo reverse geocode failed — trying BigDataCloud",
      error
    );
  }

  const fallback = await reverseGeocodeWithBigDataCloud(latitude, longitude);
  if (fallback) return fallback;

  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}
