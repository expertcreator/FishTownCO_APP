import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import type { StatusTone } from "@/features/common/data/demo";
import { SafetyItemCard } from "@/features/safety/components/SafetyItemCard";
import { useSafetyItems } from "@/features/safety/hooks/useSafetyItems";
import type { SafetyFilterKey } from "@/features/safety/types/safetyItem";
import type { SafetyItem } from "@/features/safety/types/safetyItem";
import { useVesselProfile } from "@/features/vessel/hooks/useVesselProfile";
import { getVesselLengthLabel } from "@/features/vessel/types/vessel";
import { getVesselHeroSource } from "@/features/vessel/utils/formatVesselDisplay";
import { WalletDocCard } from "@/features/wallet/components/WalletDocCard";
import { useWalletDocs } from "@/features/wallet/hooks/useWalletDocs";
import type { WalletDoc } from "@/features/wallet/types/wallet";
import {
  AppHeader,
  AppText,
  CARD_RIPPLE,
  Card,
  getPressedItemStyle,
  HomeDashboardSkeleton,
  Screen,
} from "@/ui/components";
import { useColors, type ThemeColors } from "@/ui/theme";
import { useTranslation } from "@/ui/translations";

type HomeRecord =
  | { kind: "safety"; id: string; tone: StatusTone; item: SafetyItem }
  | { kind: "document"; id: string; tone: StatusTone; doc: WalletDoc };

/**
 * Home dashboard matching https://fishtownco.itoasis.co/ (prototype screen 11).
 * Combines live vessel, safety inventory, and wallet documents into one filtered list.
 * @returns Home tab UI
 */
export default function HomeScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const { t } = useTranslation();
  /** Prototype defaults the status filter to OK. */
  const [filter, setFilter] = useState<SafetyFilterKey>("ok");

  const {
    data: safetyData,
    isLoading: safetyLoading,
    isFetching: safetyFetching,
    refetch: refetchSafety,
    isError: safetyError,
  } = useSafetyItems();
  const {
    data: vessel,
    isLoading: vesselLoading,
    isFetching: vesselFetching,
    refetch: refetchVessel,
  } = useVesselProfile();
  const {
    data: walletData,
    isLoading: walletLoading,
    isFetching: walletFetching,
    refetch: refetchWallet,
    isError: walletError,
  } = useWalletDocs();
  const safetyItems = safetyData ?? [];
  const walletDocs = walletData ?? [];
  /** Wait for first safety + vessel + wallet fetch before painting empty/filter UI. */
  const isInitialLoad =
    (safetyData === undefined && !safetyError) ||
    vessel === undefined ||
    (walletData === undefined && !walletError);

  useFocusEffect(
    useCallback(() => {
      void refetchSafety();
      void refetchVessel();
      void refetchWallet();
    }, [refetchSafety, refetchVessel, refetchWallet])
  );

  const records = useMemo<HomeRecord[]>(() => {
    const safetyRecords: HomeRecord[] = safetyItems.map((item) => ({
      kind: "safety",
      id: `safety-${item.id}`,
      tone: item.tone,
      item,
    }));
    const docRecords: HomeRecord[] = walletDocs.map((doc) => ({
      kind: "document",
      id: `doc-${doc.id}`,
      tone: doc.tone,
      doc,
    }));
    return [...safetyRecords, ...docRecords];
  }, [safetyItems, walletDocs]);

  const counts = useMemo(() => {
    const ok = records.filter((r) => r.tone === "ok").length;
    const due = records.filter((r) => r.tone === "due").length;
    const overdue = records.filter((r) => r.tone === "overdue").length;
    return { ok, due, overdue, all: records.length };
  }, [records]);

  const filteredRecords = useMemo(() => {
    if (filter === "all") return records;
    return records.filter((r) => r.tone === filter);
  }, [filter, records]);

  const vesselName = vessel?.name?.trim() || "";
  const vesselClass = vessel?.name
    ? getVesselLengthLabel(vessel).toUpperCase()
    : "";

  if (
    isInitialLoad &&
    (safetyLoading ||
      vesselLoading ||
      walletLoading ||
      safetyFetching ||
      vesselFetching ||
      walletFetching ||
      !safetyError)
  ) {
    return (
      <Screen
        edges={["top", "left", "right"]}
        header={<AppHeader title={t("home.title")} />}
        contentStyle={styles.content}
      >
        <HomeDashboardSkeleton />
      </Screen>
    );
  }

  return (
    <Screen
      edges={["top", "left", "right"]}
      header={<AppHeader title={t("home.title")} />}
      contentStyle={styles.content}
    >
      <Pressable
        onPress={() =>
          router.push(vessel?.name ? "/(tabs)/vessel" : "/vessel/edit")
        }
        android_ripple={CARD_RIPPLE}
        style={({ pressed }) => [getPressedItemStyle(pressed)]}
      >
        <View style={styles.hero}>
          <Image
            source={require("@/assets/from-design/onboarding/01-central-log.jpg")}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroGradient} />
          <View style={styles.heroOverlay}>
            {vesselClass ? (
              <View style={styles.classPill}>
                <AppText style={styles.classText} numberOfLines={1}>
                  {vesselClass}
                </AppText>
              </View>
            ) : (
              <View />
            )}
            {vesselName ? (
              <AppText style={styles.vesselName} numberOfLines={1}>
                {vesselName.toUpperCase()}
              </AppText>
            ) : null}
          </View>
        </View>
      </Pressable>

      <Pressable
        onPress={() => setFilter("overdue")}
        accessibilityRole="button"
        accessibilityLabel={t("home.attention-a11y")}
        android_ripple={CARD_RIPPLE}
        style={({ pressed }) => [getPressedItemStyle(pressed)]}
      >
        <View style={styles.attention}>
          <View style={styles.attentionIcon}>
            <Ionicons name="warning" size={22} color={colors.white} />
          </View>
          <View style={styles.attentionText}>
            <AppText style={styles.attentionTitle} numberOfLines={1}>
              {t("home.attention-title", { count: counts.overdue })}
            </AppText>
            <AppText style={styles.attentionBody} numberOfLines={2}>
              {t("home.attention-body")}
            </AppText>
          </View>
          <View style={styles.attentionArrow}>
            <Ionicons
              name="arrow-forward"
              size={18}
              color={colors.statusOverdueText}
            />
          </View>
        </View>
      </Pressable>

      <View style={styles.stats}>
        <StatCard
          icon="checkmark-circle"
          label={t("home.ok")}
          value={counts.ok}
          tone="ok"
          selected={filter === "ok"}
          onPress={() => setFilter("ok")}
        />
        <StatCard
          icon="time-outline"
          label={t("home.due-soon")}
          value={counts.due}
          tone="due"
          selected={filter === "due"}
          onPress={() => setFilter("due")}
        />
        <StatCard
          icon="warning"
          label={t("home.overdue")}
          value={counts.overdue}
          tone="overdue"
          selected={filter === "overdue"}
          onPress={() => setFilter("overdue")}
        />
      </View>

      <View style={styles.filters}>
        {(
          [
            ["all", t("home.filter-all"), counts.all],
            ["ok", t("home.filter-ok"), counts.ok],
            ["due", t("home.filter-due"), counts.due],
            ["overdue", t("home.filter-overdue"), counts.overdue],
          ] as const
        ).map(([key, label, count]) => {
          const on = filter === key;
          return (
            <Pressable
              key={key}
              onPress={() => setFilter(key)}
              android_ripple={CARD_RIPPLE}
              style={({ pressed }) => [
                styles.chip,
                on && styles.chipOn,
                getPressedItemStyle(pressed),
              ]}
            >
              <AppText style={[styles.chipText, on && styles.chipTextOn]}>
                {label} ({count})
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {safetyError ? (
        <AppText style={styles.empty}>{t("home.safety-load-failed")}</AppText>
      ) : null}

      {!safetyError && filteredRecords.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons
            name="checkmark-done-outline"
            size={36}
            color={colors.muted}
          />
          <AppText style={styles.emptyTitle}>
            {t("home.empty-filter-title")}
          </AppText>
          <AppText style={styles.emptyBody}>
            {filter === "all"
              ? t("home.safety-empty")
              : t("home.empty-filter-body")}
          </AppText>
        </Card>
      ) : null}

      <View style={styles.list}>
        {filteredRecords.map((record) =>
          record.kind === "safety" ? (
            <SafetyItemCard key={record.id} item={record.item} showReplacement="overdue" />
          ) : (
            <WalletDocCard
              key={record.id}
              doc={record.doc}
              onPress={() => router.push("/(tabs)/wallet")}
            />
          )
        )}
      </View>
    </Screen>
  );
}

type StatCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  tone: StatusTone;
  selected: boolean;
  onPress: () => void;
};

/**
 * Compact compliance stat tile matching the Home prototype counters.
 * @param props - Stat props
 * @param props.icon - Leading Ionicons name
 * @param props.label - Stat label
 * @param props.value - Count value
 * @param props.tone - Status tone for colors
 * @param props.selected - Whether this filter is active
 * @param props.onPress - Filter press handler
 * @returns Stat card element
 */
function StatCard({
  icon,
  label,
  value,
  tone,
  selected,
  onPress,
}: StatCardProps) {
  const colors = useColors();
  const styles = getStyles(colors);

  const accent =
    tone === "ok"
      ? colors.teal
      : tone === "due"
        ? colors.orange
        : tone === "overdue"
          ? colors.statusOverdueText
          : colors.teal;

  const iconBg =
    tone === "ok"
      ? "rgba(31, 138, 120, 0.12)"
      : tone === "due"
        ? colors.softOrange
        : "rgba(209, 67, 67, 0.12)";

  return (
    <Pressable
      onPress={onPress}
      android_ripple={CARD_RIPPLE}
      style={({ pressed }) => [
        styles.stat,
        selected && {
          borderColor: accent,
          borderWidth: 1.5,
          shadowOpacity: 0.12,
          elevation: 3,
        },
        getPressedItemStyle(pressed),
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <View style={[styles.statIconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={accent} />
      </View>
      <AppText style={[styles.statValue, { color: accent }]}>{value}</AppText>
      <AppText style={styles.statLabel}>{label}</AppText>
    </Pressable>
  );
}

/**
 * Builds Home screen styles for the active palette.
 * @param colors - Active theme colors
 * @returns Style sheet
 */
function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: { paddingBottom: 36, gap: 0 },
    hero: {
      height: 176,
      borderRadius: 16,
      overflow: "hidden",
      marginBottom: 14,
      backgroundColor: colors.navy,
      borderWidth: 1,
      borderColor: "rgba(0,0,0,0.05)",
    },
    heroImage: {
      ...StyleSheet.absoluteFill,
      width: "100%",
      height: "100%",
    },
    heroGradient: {
      ...StyleSheet.absoluteFill,
      backgroundColor: "rgba(0,0,0,0.28)",
    },
    heroOverlay: {
      position: "absolute",
      left: 14,
      right: 14,
      bottom: 14,
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: 8,
    },
    classPill: {
      maxWidth: "52%",
      backgroundColor: "rgba(27, 42, 74, 0.85)",
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.15)",
    },
    classText: {
      color: colors.white,
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1,
    },
    vesselName: {
      flexShrink: 1,
      color: colors.white,
      fontSize: 17,
      fontWeight: "800",
      letterSpacing: 0.4,
      textShadowColor: "rgba(0,0,0,0.35)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
    },
    setupCard: {
      gap: 10,
      marginBottom: 14,
      alignItems: "stretch",
    },
    setupTitle: {
      color: colors.navy,
      fontSize: 16,
      fontWeight: "800",
    },
    setupBody: {
      color: colors.muted,
      fontSize: 13,
      marginBottom: 4,
    },
    attention: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: "#FCE8E8",
      borderLeftWidth: 5,
      borderLeftColor: "#D14343",
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 14,
      marginBottom: 14,
    },
    attentionIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: "#D14343",
      alignItems: "center",
      justifyContent: "center",
    },
    attentionText: { flex: 1, minWidth: 0, gap: 2 },
    attentionTitle: {
      color: "#D14343",
      fontWeight: "800",
      fontSize: 16,
      letterSpacing: 0.4,
      textTransform: "uppercase",
    },
    attentionBody: {
      color: "rgba(209, 67, 67, 0.9)",
      fontSize: 12,
    },
    attentionArrow: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.white,
      alignItems: "center",
      justifyContent: "center",
    },
    stats: { flexDirection: "row", gap: 10, marginBottom: 14 },
    stat: {
      flex: 1,
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 8,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOpacity: 0.03,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1,
    },
    statIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 6,
    },
    statValue: { fontSize: 30, fontWeight: "800", lineHeight: 34 },
    statLabel: {
      color: colors.navy,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.8,
      marginTop: 4,
      textTransform: "uppercase",
    },
    filters: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 14,
    },
    chip: {
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 8,
      backgroundColor: colors.chipIdle,
    },
    chipOn: { backgroundColor: colors.inverse },
    chipText: { color: colors.navy, fontSize: 12, fontWeight: "700" },
    chipTextOn: { color: colors.onInverse },
    list: { gap: 12, paddingBottom: 8 },
    emptyCard: {
      alignItems: "center",
      paddingVertical: 28,
      paddingHorizontal: 20,
      gap: 6,
      marginBottom: 8,
    },
    emptyTitle: {
      color: colors.navy,
      fontSize: 15,
      fontWeight: "800",
      textTransform: "uppercase",
      textAlign: "center",
      marginTop: 4,
    },
    emptyBody: {
      color: colors.muted,
      fontSize: 12,
      textAlign: "center",
    },
    empty: {
      color: colors.muted,
      textAlign: "center",
      marginVertical: 16,
      fontSize: 14,
    },
  });
}