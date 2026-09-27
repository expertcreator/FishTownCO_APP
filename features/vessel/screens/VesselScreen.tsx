import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { useCrewMembers } from "@/features/crew/hooks/useCrewMembers";
import { useSafetyItems } from "@/features/safety/hooks/useSafetyItems";
import { useVesselProfile } from "@/features/vessel/hooks/useVesselProfile";
import { getVesselLengthLabel } from "@/features/vessel/types/vessel";
import {
  formatEngineHours,
  formatNextServiceIn,
  getVesselHeroSource,
} from "@/features/vessel/utils/formatVesselDisplay";
import {
  AppHeader,
  AppText,
  CARD_RIPPLE,
  Card,
  EmptyState,
  getPressedItemStyle,
  PrimaryButton,
  Screen,
  VesselScreenSkeleton,
  useToast,
} from "@/ui/components";
import { useColors, type ThemeColors } from "@/ui/theme";
import { useTranslation } from "@/ui/translations";

/**
 * My Vessel tab matching prototype screen 13
 * (https://fishtownco.itoasis.co/).
 * Loads vessel profile from Firestore `users/{uid}/vessel/profile`.
 * @returns Vessel hub UI
 */
export default function VesselScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const { t } = useTranslation();
  const toast = useToast();
  const { data: safetyItems = [] } = useSafetyItems();
  const { data: crewMembers = [], refetch: refetchCrew } = useCrewMembers();
  const {
    data: vessel,
    isLoading,
    isFetching,
    refetch,
    isError,
  } = useVesselProfile();
  const equipmentCount = safetyItems.length;
  const crewCount = crewMembers.length;
  const hasVessel = Boolean(vessel?.name);
  /** `undefined` until first fetch settles — never flash EmptyState early. */
  const isInitialLoad = vessel === undefined;

  useFocusEffect(
    useCallback(() => {
      void refetch();
      void refetchCrew();
    }, [refetch, refetchCrew])
  );

  if (isInitialLoad && (isLoading || isFetching || !isError)) {
    return (
      <Screen edges={["top", "left", "right"]}>
        <AppHeader title={t("tabs.vessel")} />
        <VesselScreenSkeleton />
      </Screen>
    );
  }

  if (isInitialLoad && isError) {
    return (
      <Screen edges={["top", "left", "right"]}>
        <AppHeader title={t("tabs.vessel")} />
        <AppText style={styles.empty}>{t("vessel.load-failed")}</AppText>
        <PrimaryButton
          label={t("common.try-again")}
          onPress={() => void refetch()}
        />
      </Screen>
    );
  }

  if (!hasVessel) {
    return (
      <Screen edges={["top", "left", "right"]} contentStyle={styles.content}>
        <AppHeader title={t("tabs.vessel")} />
        <EmptyState
          icon="boat-outline"
          title={t("vessel.empty-title")}
          body={t("vessel.empty-body")}
          actionLabel={t("vessel.edit-profile")}
          actionIcon="create-outline"
          onActionPress={() => router.push("/vessel/edit")}
        />
      </Screen>
    );
  }

  const lengthLabel = getVesselLengthLabel(vessel);
  const usage = vessel.usage || t("vessel.usage-fallback");
  const maintenanceSub =
    vessel.engineHours || vessel.nextServiceIn
      ? t("vessel.maintenance-sub", {
          hours: formatEngineHours(vessel.engineHours),
          next: formatNextServiceIn(vessel.nextServiceIn),
        })
      : t("vessel.maintenance-sub-empty");

  return (
    <Screen edges={["top", "left", "right"]} contentStyle={styles.content}>
      <AppHeader title={t("tabs.vessel")} />

      <Card style={styles.heroCard}>
        <Image
          source={getVesselHeroSource(vessel)}
          style={styles.heroImage}
          resizeMode="cover"
        />
        <View style={styles.heroBody}>
          <View style={styles.nameRow}>
            <AppText style={styles.vesselName} numberOfLines={1}>
              {vessel.name.toUpperCase()}
            </AppText>
            <Ionicons name="checkmark-circle" size={24} color={colors.teal} />
          </View>

          <View style={styles.chips}>
            <View style={[styles.chip, styles.chipMuted]}>
              <AppText style={styles.chipText}>{lengthLabel}</AppText>
            </View>
            <View style={[styles.chip, styles.chipTeal]}>
              <AppText style={[styles.chipText, styles.chipTextTeal]}>
                {usage}
              </AppText>
            </View>
          </View>

          <View style={styles.lengthRow}>
            <AppText style={styles.lengthLabel}>
              {t("vessel.length-overall")}
            </AppText>
            <AppText style={styles.lengthValue}>
              {vessel.length || "—"}
            </AppText>
          </View>
        </View>
      </Card>

      <View style={styles.menu}>
        <MenuRow
          icon="boat"
          iconBg={colors.softTeal}
          iconColor={colors.navy}
          title={t("vessel.details")}
          subtitle={t("vessel.details-sub")}
          onPress={() => toast.info(t("vessel.details-coming-soon"))}
        />
        <MenuRow
          icon="globe-outline"
          iconBg={colors.statusOkBg}
          iconColor={colors.teal}
          title={t("vessel.equipment")}
          subtitle={t("vessel.equipment-sub", { count: equipmentCount })}
          showDot={equipmentCount > 0}
          onPress={() => router.push("/(tabs)/safety")}
        />
        <MenuRow
          icon="construct"
          iconBg={colors.softOrange}
          iconColor={colors.orange}
          title={t("vessel.maintenance")}
          subtitle={maintenanceSub}
          onPress={() => toast.info(t("vessel.maintenance-coming-soon"))}
        />
        <MenuRow
          icon="people"
          iconBg={colors.softTeal}
          iconColor={colors.navy}
          title={t("vessel.crew-title")}
          subtitle={
            crewCount > 0
              ? t("vessel.crew-sub-count", { count: crewCount })
              : t("vessel.crew-sub")
          }
          showDot={crewCount > 0}
          onPress={() => router.push("/crew")}
        />
        <MenuRow
          icon="receipt-outline"
          iconBg={colors.softTeal}
          iconColor={colors.navy}
          title={t("vessel.billing-title")}
          subtitle={t("vessel.billing-sub")}
          onPress={() => router.push("/billing")}
        />
      </View>

      <PrimaryButton
        label={t("vessel.edit-profile")}
        icon="create-outline"
        onPress={() => router.push("/vessel/edit")}
        style={styles.editBtn}
      />
    </Screen>
  );
}

type MenuRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  showDot?: boolean;
  onPress: () => void;
};

/**
 * My Vessel hub menu row matching the prototype list cards.
 * @param props - Menu row props
 * @param props.icon - Leading Ionicons name
 * @param props.iconBg - Icon background color
 * @param props.iconColor - Icon tint
 * @param props.title - Uppercase row title
 * @param props.subtitle - Supporting line
 * @param props.showDot - Optional active status dot
 * @param props.onPress - Press handler
 * @returns Menu row element
 */
function MenuRow({
  icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  showDot = false,
  onPress,
}: MenuRowProps) {
  const colors = useColors();
  const styles = getStyles(colors);

  return (
    <Pressable
      onPress={onPress}
      android_ripple={CARD_RIPPLE}
      style={({ pressed }) => [getPressedItemStyle(pressed)]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Card style={styles.menuCard}>
        <View style={styles.menuLeft}>
          <View style={[styles.menuIcon, { backgroundColor: iconBg }]}>
            <Ionicons name={icon} size={24} color={iconColor} />
          </View>
          <View style={styles.menuText}>
            <View style={styles.menuTitleRow}>
              <AppText style={styles.menuTitle}>{title}</AppText>
              {showDot ? <View style={styles.dot} /> : null}
            </View>
            <AppText style={styles.menuSub} numberOfLines={1}>
              {subtitle}
            </AppText>
          </View>
        </View>
        <View style={styles.chevronWrap}>
          <Ionicons name="chevron-forward" size={22} color={colors.muted} />
        </View>
      </Card>
    </Pressable>
  );
}

/**
 * Builds My Vessel screen styles for the active palette.
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
    heroCard: {
      padding: 0,
      overflow: "hidden",
      marginBottom: 14,
      borderRadius: 16,
    },
    heroImage: {
      width: "100%",
      height: 200,
    },
    heroBody: {
      padding: 16,
      gap: 12,
    },
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    vesselName: {
      flex: 1,
      color: colors.navy,
      fontSize: 28,
      fontWeight: "800",
      letterSpacing: 0.6,
    },
    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    chip: {
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    chipMuted: {
      backgroundColor: colors.softTeal,
    },
    chipTeal: {
      backgroundColor: colors.statusOkBg,
    },
    chipText: {
      color: colors.navy,
      fontSize: 11,
      fontWeight: "700",
    },
    chipTextTeal: {
      color: colors.teal,
    },
    lengthRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.cardSoft,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    lengthLabel: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.6,
    },
    lengthValue: {
      color: colors.navy,
      fontSize: 14,
      fontWeight: "800",
    },
    menu: {
      gap: 10,
      marginBottom: 16,
    },
    menuCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      borderRadius: 16,
    },
    menuLeft: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      minWidth: 0,
    },
    menuIcon: {
      width: 48,
      height: 48,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    menuText: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    menuTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    menuTitle: {
      color: colors.navy,
      fontSize: 16,
      fontWeight: "800",
      letterSpacing: 0.4,
    },
    menuSub: {
      color: colors.muted,
      fontSize: 12,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.teal,
    },
    chevronWrap: {
      width: 32,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
    },
    editBtn: {
      borderRadius: 16,
      minHeight: 56,
    },
  });
}
