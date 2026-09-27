import { reverseGeocodeLabel } from "@/features/common/location/reverseGeocodeLabel";
import { useLocationPickerStore } from "@/features/safety/store/locationPickerStore";
import {
  AppText,
  BackHeader,
  MapPickerSkeleton,
  PrimaryButton,
} from "@/ui/components";
import { useColors, type ThemeColors } from "@/ui/theme";
import { useTranslation } from "@/ui/translations";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import MapView, { type Region, PROVIDER_GOOGLE } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DEFAULT_DELTA = 0.024;
/** Same fallback window as the customer GoogleMapScreen. */
const MAP_LOAD_FALLBACK_MS = 12_000;

/**
 * Free map location picker matching the customer-app GoogleMapScreen pattern:
 * full-bleed Google MapView, center pin, Expo Location reverse-geocode
 * (BigDataCloud fallback — no Places API).
 * @returns Map picker screen
 */
export default function LocationMapPickerScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = getStyles(colors);
  const setResult = useLocationPickerStore((s) => s.setResult);
  const params = useLocalSearchParams<{
    latitude?: string;
    longitude?: string;
  }>();

  const mapRef = useRef<MapView | null>(null);
  const geocodeSeq = useRef(0);
  const [region, setRegion] = useState<Region | null>(null);
  const [label, setLabel] = useState("");
  const [geocoding, setGeocoding] = useState(false);
  const [locating, setLocating] = useState(false);
  const [isMapTilesLoaded, setIsMapTilesLoaded] = useState(false);
  const [ready, setReady] = useState(false);

  /**
   * Marks map tiles as loaded (customer-app `onMapLoaded` handler).
   * @returns void
   */
  const markMapTilesLoaded = useCallback(() => {
    setIsMapTilesLoaded(true);
  }, []);

  useEffect(() => {
    if (isMapTilesLoaded || !ready) return;
    const timer = setTimeout(() => {
      console.warn(
        "[LocationMapPickerScreen] map load fallback — enabling map controls"
      );
      setIsMapTilesLoaded(true);
    }, MAP_LOAD_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [isMapTilesLoaded, ready]);

  /**
   * Reverse-geocodes the map center with Expo Location / BigDataCloud fallback.
   * @param latitude - Map center latitude
   * @param longitude - Map center longitude
   * @returns Promise that resolves when the label updates
   */
  const geocodeCenter = useCallback(async (latitude: number, longitude: number) => {
    const seq = ++geocodeSeq.current;
    setGeocoding(true);
    try {
      const next = await reverseGeocodeLabel(latitude, longitude);
      if (seq === geocodeSeq.current) {
        setLabel(next);
      }
    } catch (error) {
      console.error("[LocationMapPickerScreen] reverse geocode failed", error);
      if (seq === geocodeSeq.current) {
        setLabel(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
      }
    } finally {
      if (seq === geocodeSeq.current) {
        setGeocoding(false);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const paramLat = Number(params.latitude);
      const paramLng = Number(params.longitude);
      if (Number.isFinite(paramLat) && Number.isFinite(paramLng)) {
        const next: Region = {
          latitude: paramLat,
          longitude: paramLng,
          latitudeDelta: DEFAULT_DELTA,
          longitudeDelta: DEFAULT_DELTA,
        };
        if (!cancelled) {
          setRegion(next);
          setReady(true);
          void geocodeCenter(paramLat, paramLng);
        }
        return;
      }

      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status === Location.PermissionStatus.GRANTED) {
          const position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const next: Region = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            latitudeDelta: DEFAULT_DELTA,
            longitudeDelta: DEFAULT_DELTA,
          };
          if (!cancelled) {
            setRegion(next);
            setReady(true);
            void geocodeCenter(next.latitude, next.longitude);
          }
          return;
        }
      } catch (error) {
        console.warn("[LocationMapPickerScreen] GPS bootstrap failed", error);
      }

      const fallback: Region = {
        latitude: 51.5074,
        longitude: -0.1278,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      if (!cancelled) {
        setRegion(fallback);
        setReady(true);
        void geocodeCenter(fallback.latitude, fallback.longitude);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [geocodeCenter, params.latitude, params.longitude]);

  /**
   * Recenters the map on the device GPS position.
   * @returns Promise that resolves when the map moves or permission fails
   */
  const onUseMyLocation = async () => {
    if (locating) return;
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const next: Region = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        latitudeDelta: DEFAULT_DELTA,
        longitudeDelta: DEFAULT_DELTA,
      };
      setRegion(next);
      mapRef.current?.animateToRegion(next, 350);
      void geocodeCenter(next.latitude, next.longitude);
    } catch (error) {
      console.error("[LocationMapPickerScreen] locate failed", error);
    } finally {
      setLocating(false);
    }
  };

  /**
   * Confirms the pin position and returns to the safety form.
   * @returns void
   */
  const onConfirm = () => {
    if (!region) return;
    const trimmed = label.trim();
    if (!trimmed) return;
    setResult({
      label: trimmed,
      latitude: region.latitude,
      longitude: region.longitude,
    });
    router.back();
  };

  if (!ready || !region) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.headerPad}>
          <BackHeader title={t("safety.pick-location-title")} />
        </View>
        <MapPickerSkeleton />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Full-bleed map first — same structure as customer GoogleMapScreen */}
      <View style={styles.map} collapsable={false}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFill}
          initialRegion={region}
          loadingEnabled
          loadingIndicatorColor={colors.teal}
          loadingBackgroundColor={colors.cardSoft}
          onMapLoaded={markMapTilesLoaded}
          onMapReady={() => {
            console.log("[LocationMapPickerScreen] onMapReady");
            markMapTilesLoaded();
          }}
          onRegionChangeComplete={(next) => {
            setRegion(next);
            void geocodeCenter(next.latitude, next.longitude);
          }}
          showsUserLocation
          showsMyLocationButton={false}
          scrollEnabled={isMapTilesLoaded}
          zoomEnabled={isMapTilesLoaded}
          zoomTapEnabled={isMapTilesLoaded}
          rotateEnabled={false}
          pitchEnabled={false}
        />

        <View pointerEvents="none" style={styles.pinOverlay}>
          <Ionicons name="location" size={44} color={colors.orange} />
        </View>

        <Pressable
          style={[styles.locateFab, { bottom: 16 + 140 }]}
          onPress={onUseMyLocation}
          accessibilityRole="button"
          accessibilityLabel={t("safety.use-current-location")}
        >
          {locating ? (
            <ActivityIndicator color={colors.navy} />
          ) : (
            <Ionicons name="locate" size={22} color={colors.navy} />
          )}
        </Pressable>
      </View>

      <View style={[styles.topBar, { paddingTop: insets.top + 4 }]}>
        <BackHeader title={t("safety.pick-location-title")} />
      </View>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <AppText style={styles.hint}>{t("safety.pick-location-hint")}</AppText>
        <View style={styles.addressCard}>
          {geocoding ? (
            <ActivityIndicator color={colors.teal} />
          ) : (
            <AppText style={styles.address} numberOfLines={3}>
              {label || t("safety.pick-location-loading")}
            </AppText>
          )}
        </View>
        <PrimaryButton
          label={t("safety.confirm-location")}
          icon="checkmark"
          disabled={!label.trim() || geocoding}
          onPress={onConfirm}
        />
      </View>

      <Modal visible={!isMapTilesLoaded} transparent={false} animationType="fade">
        <View style={styles.mapLoadingOverlay}>
          <ActivityIndicator size="large" color={colors.teal} />
          <AppText style={styles.mapLoadingText}>
            {t("safety.pick-location-loading")}
          </AppText>
        </View>
      </Modal>
    </View>
  );
}

/**
 * Builds map-picker styles matching the customer GoogleMapScreen layout.
 * @param colors - Active theme colors
 * @returns Style sheet
 */
function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.card,
    },
    map: {
      flex: 1,
      width: "100%",
      height: "100%",
    },
    headerPad: {
      paddingHorizontal: 20,
    },
    topBar: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 20,
      zIndex: 20,
    },
    pinOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 28,
    },
    locateFab: {
      position: "absolute",
      right: 16,
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
      zIndex: 20,
    },
    footer: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: 20,
      paddingTop: 12,
      gap: 10,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      zIndex: 20,
    },
    hint: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "500",
    },
    addressCard: {
      minHeight: 56,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      backgroundColor: colors.card,
      paddingHorizontal: 14,
      paddingVertical: 12,
      justifyContent: "center",
    },
    address: {
      color: colors.navy,
      fontSize: 15,
      fontWeight: "600",
    },
    mapLoadingOverlay: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.cardSoft,
      gap: 12,
    },
    mapLoadingText: {
      color: colors.muted,
      fontSize: 14,
      fontWeight: "600",
    },
  });
}
