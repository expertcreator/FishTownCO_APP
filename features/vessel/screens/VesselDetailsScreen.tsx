import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
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
 * Shows the same fields as Edit Vessel Profile, grouped into Basics, Specs,
 * and Registration. The pencil in the header opens Edit Vessel Profile.
 * Loads vessel profile from Firestore `users/{uid}/vessel/profile`.
 * @returns Vessel details UI
 */
export default function VesselDetailsScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const { t } = useTranslation();
  const { data: vessel, isError, refetch } = useVesselProfile();

  // Reload when coming back from Edit so saved changes show right away.
  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch])
  );

  const header = (
    <BackHeader
      title={t("vessel.details")}
      right={
        <Pressable
          onPress={() => router.push("/vessel/edit")}
          hitSlop={10}
          style={({ pressed }) => [
            styles.editBtn,
            getPressedItemStyle(pressed),
          ]}
          accessibilityRole="button"
          accessibilityLabel={t("vessel.edit")}
        >
          <Ionicons name="create-outline" size={22} color={colors.navy} />
        </Pressable>
      }
    />
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

  return (
    <Screen header={header} contentStyle={styles.content}>
      {/* Vessel photo (falls back to the default image) */}
      <Card style={styles.photoCard}>
        <Image
          source={getVesselHeroSource(vessel)}
          style={styles.photo}
          resizeMode="cover"
        />
      </Card>

      {/* Basics: name, type, use */}
      <SectionHeader title={t("vessel.details-basics")} />
      <Card style={styles.groupCard}>
        <DetailRow
          icon="boat-outline"
          label={t("vessel.details-name")}
          value={orDash(vessel.name)}
          first
        />
        <DetailRow
          icon="pricetag-outline"
          label={t("vessel.details-type")}
          value={orDash(vessel.type)}
        />
        <DetailRow
          icon="briefcase-outline"
          label={t("vessel.details-use")}
          value={orDash(vessel.usage)}
        />
      </Card>

      {/* Specs: length, engine hours (orange icons) */}
      <SectionHeader title={t("vessel.details-specs")} />
      <Card style={styles.groupCard}>
        <DetailRow
          icon="resize-outline"
          label={t("vessel.details-length")}
          value={orDash(vessel.length)}
          accent
          first
        />
        <DetailRow
          icon="speedometer-outline"
          label={t("vessel.details-engine-hours")}
          value={formatEngineHours(vessel.engineHours)}
          accent
        />
      </Card>

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

type DetailRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  /** Orange icon tile (used for Specs); teal otherwise. */
  accent?: boolean;
  /** First row in a card has no divider line above it. */
  first?: boolean;
};

/**
 * One label / value line inside a Vessel Details group card.
 * @param props - Row props
 * @param props.icon - Leading Ionicons name
 * @param props.label - Field name on the left
 * @param props.value - Field value on the right
 * @param props.accent - Orange icon tile instead of teal
 * @param props.first - Hides the top divider
 * @returns Detail row element
 */
function DetailRow({ icon, label, value, accent = false, first = false }: DetailRowProps) {
  const colors = useColors();
  const styles = getStyles(colors);

  return (
    <View style={[styles.row, !first && styles.rowDivider]}>
      <View
        style={[
          styles.rowIcon,
          { backgroundColor: accent ? colors.softOrange : colors.softTeal },
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={accent ? colors.orange : colors.navy}
        />
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
    content: { paddingBottom: 36 },
    empty: {
      color: colors.muted,
      textAlign: "center",
      marginVertical: 24,
    },
    editBtn: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
    },
    photoCard: {
      padding: 0,
      overflow: "hidden",
      marginBottom: 18,
      borderRadius: 16,
    },
    photo: {
      width: "100%",
      height: 200,
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
