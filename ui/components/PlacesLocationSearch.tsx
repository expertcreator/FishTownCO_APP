import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { getGoogleMapsApiKey } from "@/features/common/location/getGoogleMapsApiKey";
import {
  fetchPlaceAutocomplete,
  fetchPlaceDetails,
  type PlaceSelection,
  type PlacesPrediction,
} from "@/features/common/location/googlePlaces";
import { useColors, type ThemeColors } from "@/ui/theme";
import AppText from "./Text";

type PlacesLocationSearchProps = {
  /** Current field value. */
  value: string;
  /** Field label shown above the input. */
  label: string;
  /** Placeholder when empty. */
  placeholder: string;
  /** Called when the user types free text. */
  onChangeText: (text: string) => void;
  /** Called when a Google Place prediction is selected. */
  onPlaceSelected: (place: PlaceSelection) => void;
  /** Optional lat/lng bias for nearby autocomplete. */
  locationBias?: { latitude: number; longitude: number } | null;
  /** Shown when the Google Maps API key is missing. */
  missingKeyHint?: string;
};

/**
 * Location search field using Google Places Autocomplete (customer-app pattern).
 * Typing still allows free-text labels; selecting a prediction fills address + coords.
 * Reverse geocode for GPS uses Expo Location separately (no Google Geocoding API).
 * @param props - Search field props
 * @returns Places search field with suggestion list
 */
export function PlacesLocationSearch({
  value,
  label,
  placeholder,
  onChangeText,
  onPlaceSelected,
  locationBias,
  missingKeyHint,
}: PlacesLocationSearchProps) {
  const colors = useColors();
  const styles = getStyles(colors);
  const apiKey = getGoogleMapsApiKey();
  const [results, setResults] = useState<PlacesPrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  /**
   * Debounces autocomplete requests while the user types.
   * @param query - Current input text
   * @returns void
   */
  const handleSearch = (query: string) => {
    onChangeText(query);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 3 || !apiKey) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(() => {
      void (async () => {
        const requestId = ++requestIdRef.current;
        try {
          const predictions = await fetchPlaceAutocomplete(
            query,
            apiKey,
            locationBias
              ? {
                  latitude: locationBias.latitude,
                  longitude: locationBias.longitude,
                }
              : undefined
          );
          if (requestId === requestIdRef.current) {
            setResults(predictions);
          }
        } catch {

          if (requestId === requestIdRef.current) {
            setResults([]);
          }
        } finally {
          if (requestId === requestIdRef.current) {
            setLoading(false);
          }
        }
      })();
    }, 350);
  };

  /**
   * Resolves place details and notifies the parent.
   * @param prediction - Selected autocomplete row
   * @returns Promise that resolves when selection is applied
   */
  const handleSelect = async (prediction: PlacesPrediction) => {
    setResults([]);
    setLoading(true);
    try {
      const place = await fetchPlaceDetails(
        prediction.placeId,
        apiKey,
        prediction.description
      );
      onPlaceSelected(place);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <AppText style={styles.label}>{label}</AppText>
      <View style={styles.inputRow}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          value={value}
          onChangeText={handleSearch}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          style={styles.input}
          autoCorrect={false}
          autoCapitalize="sentences"
          returnKeyType="search"
        />
        {loading ? (
          <ActivityIndicator size="small" color={colors.teal} />
        ) : null}
      </View>
      {!apiKey && missingKeyHint ? (
        <AppText style={styles.hint}>{missingKeyHint}</AppText>
      ) : null}
      {results.length > 0 ? (
        <View style={styles.results}>
          <FlatList
            data={results}
            keyExtractor={(item) => item.placeId}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={false}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [
                  styles.resultRow,
                  pressed && styles.resultPressed,
                ]}
                onPress={() => void handleSelect(item)}
              >
                <Ionicons
                  name="location-outline"
                  size={16}
                  color={colors.teal}
                />
                <AppText style={styles.resultText}>{item.description}</AppText>
              </Pressable>
            )}
          />
        </View>
      ) : null}
    </View>
  );
}

/**
 * Builds places-location-search styles for the active palette.
 * @param colors - Active theme colors
 * @returns Style sheet
 */
function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: { gap: 8 },
    label: {
      color: colors.navy,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.6,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      minHeight: 48,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      paddingHorizontal: 12,
    },
    input: {
      flex: 1,
      color: colors.navy,
      fontSize: 15,
      paddingVertical: 10,
    },
    hint: {
      color: colors.muted,
      fontSize: 12,
    },
    results: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      overflow: "hidden",
    },
    resultRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    resultPressed: { opacity: 0.85 },
    resultText: {
      flex: 1,
      color: colors.navy,
      fontSize: 14,
      fontWeight: "600",
    },
  });
}
