import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect, useIsFocused } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useVesselProfile } from "@/features/vessel/hooks/useVesselProfile";
import {
  formatEngineHours,
  getVesselHeroSource,
} from "@/features/vessel/utils/formatVesselDisplay";
import {
  AppText,
  BackHeader,
  Card,
  getPressedItemStyle,
  ItemDetailSkeleton,
  PrimaryButton,
  Screen,
  SectionHeader,
} from "@/ui/components";
import { useColors, type ThemeColors } from "@/ui/theme";
import { useTranslation } from "@/ui/translations";

/** Photo height below the status bar. */
const HERO_HEIGHT = 300;

/**
 * Returns the trimmed value, or a dash when the field was left empty.
 * @param value - Stored vessel field
 * @returns Display string
 */
function orDash(value: string | undefined | null): string {
  return value?.trim() || "—";
}

/**
 * Read-only Vessel Details, opened from the "Vessel Details" row on My Vessel.
 * Shows the same fields as Edit Vessel Profile:
 * - Photo with name, type, and use on top of it
 * - Stat bar with length and engine hours
 * - Registration card with home port, MMSI, and registration no
 * Back and edit buttons float on the photo (like the map picker top bar).
 * Loads vessel profile from Firestore `users/{uid}/vessel/profile`.
 * @returns Vessel details UI
 */
export default function VesselDetailsScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { data: vessel, isError, refetch } = useVesselProfile();

  // Reload when coming back from Edit so saved changes show right away.
  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch])
  );

  // `undefined` until the first fetch settles.
  if (vessel === undefined && !isError) {
    return (
      <Screen header={<BackHeader title={t("vessel.details")} />}>
        <ItemDetailSkeleton />
      </Screen>
    );
  }

  if (!vessel) {
    return (
      <Screen header={<BackHeader title={t("vessel.details")} />}>
        <AppText style={styles.empty}>{t("vessel.load-failed")}</AppText>
        <PrimaryButton
          label={t("common.try-again")}
          onPress={() => void refetch()}
        />
      </Screen>
    );
  }

  const type = vessel.type.trim();
  const usage = vessel.usage.trim();

  return (
    // No "top" edge: the photo runs up under the status bar.
    <Screen edges={["left", "right", "bottom"]} contentStyle={styles.content}>
      {/* White status bar text on the photo, only while this screen is shown */}
      {isFocused ? <StatusBar style="light" /> : null}

      {/* Photo hero */}
      <View style={[styles.hero, { height: HERO_HEIGHT + insets.top }]}>
        <Image
          source={getVesselHeroSource(vessel)}
          style={styles.heroImage}
          resizeMode="cover"
        />
        {/* Top fade keeps the status bar and buttons readable */}
        <LinearGradient
          colors={["rgba(11,42,69,0.55)", "transparent"]}
          style={[styles.heroTopFade, { height: insets.top + 80 }]}
        />
        {/* Bottom fade keeps the name and chips readable (same as Login banner) */}
        <LinearGradient
          colors={["transparent", "rgba(11,42,69,0.4)", "rgba(11,42,69,0.92)"]}
          locations={[0, 0.45, 1]}
          style={styles.heroBottomFade}
        />

        {/* Floating back and edit buttons, kept below the notch */}
        <View style={[styles.heroButtons, { top: insets.top + 8 }]}>
          <HeroButton
            icon="arrow-back"
            label={t("common.back")}
            onPress={() => router.back()}
          />
          <HeroButton
            icon="create-outline"
            label={t("vessel.edit")}
            onPress={() => router.push("/vessel/edit")}
          />
        </View>

        {/* Name, then type and use chips (a chip is hidden when empty) */}
        <View style={styles.heroFooter}>
          <AppText style={styles.heroName} numberOfLines={2}>
            {orDash(vessel.name).toUpperCase()}
          </AppText>
          {type || usage ? (
            <View style={styles.chips}>
              {type ? (
                <View style={[styles.chip, styles.chipLight]}>
                  <AppText style={styles.chipText}>{type}</AppText>
                </View>
              ) : null}
              {usage ? (
                <View style={[styles.chip, styles.chipOrange]}>
                  <AppText style={styles.chipText}>{usage}</AppText>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>

      {/* Stat bar: length | engine hours */}
      <View style={styles.statBar}>
        <StatItem
          icon="resize-outline"
          iconColor={colors.softTeal}
          value={orDash(vessel.length)}
          label={t("vessel.details-length")}
        />
        <View style={styles.statDivider} />
        <StatItem
          icon="speedometer-outline"
          iconColor={colors.orange}
          value={formatEngineHours(vessel.engineHours)}
          label={t("vessel.details-engine-hours")}
        />
      </View>

      {/* Registration: home port, MMSI, registration no */}
      <SectionHeader title={t("vessel.details-registration")} />
      <Card style={styles.groupCard}>
        <DetailRow
          icon="location-outline"
          label={t("vessel.details-home-port")}
          value={orDash(vessel.homePort)}
          first
        />
        <DetailRow
          icon="radio-outline"
          label={t("vessel.details-mmsi")}
          value={orDash(vessel.mmsi)}
        />
        <DetailRow
          icon="document-text-outline"
          label={t("vessel.details-registration-no")}
          value={orDash(vessel.registrationNo)}
        />
      </Card>
    </Screen>
  );
}

type HeroButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  /** Screen-reader label. */
  label: string;
  onPress: () => void;
};

/**
 * Round button that floats on the photo (back / edit).
 * @param props - Button props
 * @param props.icon - Ionicons name
 * @param props.label - Accessibility label
 * @param props.onPress - Press handler
 * @returns Hero button element
 */
function HeroButton({ icon, label, onPress }: HeroButtonProps) {
  const colors = useColors();
  const styles = getStyles(colors);

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.heroButton, getPressedItemStyle(pressed)]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={22} color={colors.navy} />
    </Pressable>
  );
}

type StatItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  value: string;
  label: string;
};

/**
 * One half of the stat bar: icon, big value, small label.
 * @param props - Stat props
 * @param props.icon - Ionicons name
 * @param props.iconColor - Icon color
 * @param props.value - Big value, e.g. "42 ft / 12.8 m"
 * @param props.label - Small label under the value
 * @returns Stat item element
 */
function StatItem({ icon, iconColor, value, label }: StatItemProps) {
  const colors = useColors();
  const styles = getStyles(colors);

  return (
    <View style={styles.statItem}>
      <Ionicons name={icon} size={18} color={iconColor} />
      {/* Long values wrap to 2 lines at normal size, then end with "…" */}
      <AppText style={styles.statValue} numberOfLines={2}>
        {value}
      </AppText>
      <AppText style={styles.statLabel}>{label}</AppText>
    </View>
  );
}

type DetailRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  /** First row in a card has no divider line above it. */
  first?: boolean;
};

/**
 * One label / value line inside the Registration card.
 * @param props - Row props
 * @param props.icon - Leading Ionicons name
 * @param props.label - Field name on the left
 * @param props.value - Field value on the right
 * @param props.first - Hides the top divider
 * @returns Detail row element
 */
function DetailRow({ icon, label, value, first = false }: DetailRowProps) {
  const colors = useColors();
  const styles = getStyles(colors);

  return (
    <View style={[styles.row, !first && styles.rowDivider]}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={colors.navy} />
      </View>
      <AppText style={styles.rowLabel}>{label}</AppText>
      <AppText style={styles.rowValue} numberOfLines={1}>
        {value}
      </AppText>
    </View>
  );
}

/**
 * Builds Vessel Details styles for the active palette.
 * @param colors - Active theme colors
 * @returns Style sheet
 */
function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: { paddingTop: 0, paddingBottom: 36 },
    empty: {
      color: colors.muted,
      textAlign: "center",
      marginVertical: 24,
    },
    // Negative margin cancels the Screen side padding so the photo is edge to edge.
    hero: {
      marginHorizontal: -20,
      backgroundColor: colors.inverse,
      overflow: "hidden",
    },
    heroImage: {
      ...StyleSheet.absoluteFill,
      width: "100%",
      height: "100%",
    },
    heroTopFade: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
    },
    heroBottomFade: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: "60%",
    },
    heroButtons: {
      position: "absolute",
      left: 16,
      right: 16,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    heroButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
    },
    heroFooter: {
      position: "absolute",
      left: 20,
      right: 20,
      bottom: 18,
      gap: 10,
    },
    heroName: {
      color: colors.white,
      fontSize: 26,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    chip: {
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 5,
    },
    // See-through white so it reads on any photo, in light and dark mode.
    chipLight: {
      backgroundColor: "rgba(255,255,255,0.22)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.45)",
    },
    chipOrange: {
      backgroundColor: colors.orange,
    },
    chipText: {
      color: colors.white,
      fontSize: 13,
      fontWeight: "700",
    },
    statBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.inverse,
      borderRadius: 16,
      paddingVertical: 14,
      marginTop: 16,
      marginBottom: 18,
    },
    statItem: {
      flex: 1,
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 10,
    },
    statDivider: {
      width: StyleSheet.hairlineWidth,
      alignSelf: "stretch",
      backgroundColor: colors.muted,
    },
    statValue: {
      color: colors.onInverse,
      fontSize: 18,
      fontWeight: "800",
      textAlign: "center",
    },
    statLabel: {
      color: colors.onInverse,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.6,
      textTransform: "uppercase",
    },
    groupCard: {
      paddingVertical: 4,
      borderRadius: 16,
      marginTop: 8,
      marginBottom: 18,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 10,
    },
    rowDivider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    rowIcon: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: colors.softTeal,
      alignItems: "center",
      justifyContent: "center",
    },
    rowLabel: {
      color: colors.muted,
      fontSize: 14,
    },
    // Takes the remaining width; long values get "…" instead of wrapping.
    rowValue: {
      flex: 1,
      textAlign: "right",
      color: colors.navy,
      fontSize: 15,
      fontWeight: "700",
    },
  });
}
