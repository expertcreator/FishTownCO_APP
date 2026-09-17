import { Linking, Platform } from "react-native";

type OpenGoogleMapsParams = {
  latitude: number;
  longitude: number;
  address?: string | null;
};

export async function openGoogleMaps({
  latitude,
  longitude,
}: OpenGoogleMapsParams): Promise<void> {
  const coordinateQuery = `${latitude},${longitude}`;
  const mapsUrl = `https://www.google.com/maps?q=${encodeURIComponent(coordinateQuery)}`;

  try {
    if (Platform.OS === "android") {
      await Linking.openURL(`geo:0,0?q=${encodeURIComponent(coordinateQuery)}`);
      return;
    }

    await Linking.openURL(mapsUrl);
  } catch {
    await Linking.openURL(mapsUrl).catch(() => {});
  }
}
