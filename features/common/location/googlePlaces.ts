export type PlacesPrediction = {
  description: string;
  placeId: string;
};

export type PlaceSelection = {
  description: string;
  formattedAddress: string;
  latitude: number | null;
  longitude: number | null;
};

type AutocompleteResponse = {
  status: string;
  predictions?: Array<{ description: string; place_id: string }>;
  error_message?: string;
};

type PlaceDetailsResponse = {
  status: string;
  result?: {
    formatted_address?: string;
    name?: string;
    geometry?: {
      location?: { lat?: number; lng?: number };
    };
  };
  error_message?: string;
};

/**
 * Fetches Google Places Autocomplete predictions (Places API only — free credit).
 * @param input - User search text (min 3 chars)
 * @param apiKey - Google Maps Platform API key
 * @param bias - Optional lat/lng bias for nearby results
 * @returns Prediction list (empty when query too short or request fails)
 */
export async function fetchPlaceAutocomplete(
  input: string,
  apiKey: string,
  bias?: { latitude: number; longitude: number; radiusMeters?: number }
): Promise<PlacesPrediction[]> {
  const query = input.trim();
  if (query.length < 3 || !apiKey.trim()) {
    return [];
  }

  const params = new URLSearchParams({
    input: query,
    key: apiKey,
  });
  if (
    bias &&
    Number.isFinite(bias.latitude) &&
    Number.isFinite(bias.longitude)
  ) {
    params.set("location", `${bias.latitude},${bias.longitude}`);
    params.set("radius", String(bias.radiusMeters ?? 50_000));
  }

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`
  );
  const data = (await response.json()) as AutocompleteResponse;
  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {

    return [];
  }

  return (data.predictions ?? []).map((p) => ({
    description: p.description,
    placeId: p.place_id,
  }));
}

/**
 * Loads Place Details geometry + formatted address (basic fields only).
 * @param placeId - Google place id from autocomplete
 * @param apiKey - Google Maps Platform API key
 * @param fallbackDescription - Autocomplete description used if details fail
 * @returns Selection with address and optional coordinates
 */
export async function fetchPlaceDetails(
  placeId: string,
  apiKey: string,
  fallbackDescription: string
): Promise<PlaceSelection> {
  const params = new URLSearchParams({
    place_id: placeId,
    fields: "formatted_address,name,geometry",
    key: apiKey,
  });

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`
    );
    const data = (await response.json()) as PlaceDetailsResponse;
    if (data.status !== "OK" || !data.result) {

      return {
        description: fallbackDescription,
        formattedAddress: fallbackDescription,
        latitude: null,
        longitude: null,
      };
    }

    const lat = data.result.geometry?.location?.lat;
    const lng = data.result.geometry?.location?.lng;
    const formattedAddress =
      data.result.formatted_address?.trim() ||
      data.result.name?.trim() ||
      fallbackDescription;

    return {
      description: fallbackDescription,
      formattedAddress,
      latitude: typeof lat === "number" ? lat : null,
      longitude: typeof lng === "number" ? lng : null,
    };
  } catch {

    return {
      description: fallbackDescription,
      formattedAddress: fallbackDescription,
      latitude: null,
      longitude: null,
    };
  }
}
