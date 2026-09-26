import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { logout } from "@/features/auth/services/logout";
import type { StatusTone } from "@/features/common/data/demo";
import { SafetyItemCard } from "@/features/safety/components/SafetyItemCard";
import { useSafetyItems } from "@/features/safety/hooks/useSafetyItems";
import type { SafetyFilterKey } from "@/features/safety/types/safetyItem";
import { useVesselProfile } from "@/features/vessel/hooks/useVesselProfile";
import { getVesselLengthLabel } from "@/features/vessel/types/vessel";
import { WalletDocCard } from "@/features/wallet/components/WalletDocCard";
import { useWalletDocs } from "@/features/wallet/hooks/useWalletDocs";
import {
  AppHeader,
  AppText,
  Card,
  HomeDashboardSkeleton,
  PrimaryButton,
  Screen,
  useToast,
} from "@/ui/components";
import { useColors, type ThemeColors } from "@/ui/theme";
import { useTranslation } from "@/ui/translations";

/**
 * Home dashboard matching prototype screen 11
 * (https://fishtownco.itoasis.co/).
 * Uses live vessel, safety inventory, and wallet documents from Firestore.
 * @returns Home tab UI
 */
export default function HomeScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const { t } = useTranslation();
  const toast = useToast();
  const [filter, setFilter] = useState<SafetyFilterKey>("all");

  const {
    data: safetyItems = [],
    isLoading: safetyLoading,
    refetch: refetchSafety,
    isError: safetyError,
  } = useSafetyItems();
  const {
    data: vessel,
    isLoading: vesselLoading,
    refetch: refetchVessel,
  } = useVesselProfile();
  const {
    data: walletDocs = [],
    refetch: refetchWallet,
  } = useWalletDocs();

  useFocusEffect(
    useCallback(() => {
      void refetchSafety();
      void refetchVessel();
      void refetchWallet();
    }, [refetchSafety, refetchVessel, refetchWallet])
  );

  const counts = useMemo(() => {
    const ok = safetyItems.filter((i) => i.tone === "ok").length;
    const due = safetyItems.filter((i) => i.tone === "due").length;
    const overdue = safetyItems.filter((i) => i.tone === "overdue").length;
    return { ok, due, overdue, all: safetyItems.length };
  }, [safetyItems]);

  const items = useMemo(() => {
    if (filter === "all") return safetyItems;
    return safetyItems.filter((i) => i.tone === filter);
  }, [filter, safetyItems]);

  const attention = counts.due + counts.overdue;
  const vesselName = vessel?.name?.trim() || t("home.vessel-fallback");
  const vesselClass = vessel
    ? getVesselLengthLabel(vessel).toUpperCase()
    : t("home.vessel-class-fallback");

  /**
   * Signs out of Firebase Auth and returns to the login screen.
   * @returns Promise that resolves when navigation starts or a toast is shown
   */
  const onLogout = async () => {
    console.log("[HomeScreen] logout pressed");
    try {
      await logout();
      toast.success(t("auth.log-out-success"));
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("[HomeScreen] logout failed", error);
      toast.error(t("auth.log-out-failed"));
    }
  };

  if ((safetyLoading || vesselLoading) && safetyItems.length === 0 && !vessel) {
    return (
      <Screen edges={["top", "left", "right"]} contentStyle={styles.content}>
        <AppHeader title={t("home.title")} />
        <HomeDashboardSkeleton />
      </Screen>
    );
  }

  return (
    <Screen edges={["top", "left", "right"]} contentStyle={styles.content}>
      <AppHeader
        title={t("home.title")}
        right={
          <Pressable
            onPress={onLogout}
            hitSlop={12}
            style={styles.logoutButton}
            accessibilityRole="button"
            accessibilityLabel={t("auth.log-out")}
          >
            <Ionicons name="log-out-outline" size={22} color={colors.navy} />
          </Pressable>
        }
      />

      <Pressable
        onPress={() => router.push(vessel?.name ? "/(tabs)/vessel" : "/vessel/edit")}
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        <Card style={styles.hero}>
          <Image
            source={require("@/assets/from-design/onboarding/01-central-log.jpg")}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay}>
            <View style={styles.classPill}>
              <AppText style={styles.classText} numberOfLines={1}>
                {vesselClass}
              </AppText>
            </View>
            <AppText style={styles.vesselName} numberOfLines={1}>
              {vesselName.toUpperCase()}
            </AppText>
          </View>
        </Card>
      </Pressable>

      {!vessel?.name ? (
        <Card style={styles.setupCard}>
          <AppText style={styles.setupTitle}>{t("home.setup-vessel-title")}</AppText>
          <AppText style={styles.setupBody}>{t("home.setup-vessel-body")}</AppText>
          <PrimaryButton
            label={t("home.setup-vessel-cta")}
            icon="boat-outline"
            onPress={() => router.push("/vessel/edit")}
          />
        </Card>
      ) : null}

      {attention > 0 ? (
        <Pressable
          onPress={() => {
            setFilter(counts.overdue > 0 ? "overdue" : "due");
            router.push("/(tabs)/safety");
          }}
          accessibilityRole="button"
          accessibilityLabel={t("home.attention-a11y")}
          style={({ pressed }) => [pressed && styles.pressed]}
        >
          <Card style={styles.attention}>
            <View style={styles.attentionIcon}>
              <Ionicons name="warning" size={20} color={colors.white} />
            </View>
            <View style={styles.attentionText}>
              <AppText style={styles.attentionTitle}>
                {t("home.attention-title", { count: attention })}
              </AppText>
              <AppText style={styles.attentionBody}>
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
          </Card>
        </Pressable>
      ) : null}

      <View style={styles.stats}>
        <StatCard
          icon="checkmark-circle"
          label={t("home.ok")}
          value={counts.ok}
          tone="ok"
          onPress={() => setFilter("ok")}
        />
        <StatCard
          icon="time"
          label={t("home.due-soon")}
          value={counts.due}
          tone="due"
          onPress={() => setFilter("due")}
        />
        <StatCard
          icon="warning"
          label={t("home.overdue")}
          value={counts.overdue}
          tone="overdue"
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
              style={[styles.chip, on && styles.chipOn]}
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

      {!safetyError && items.length === 0 ? (
        <AppText style={styles.empty}>
          {filter === "all" ? t("home.safety-empty") : t("home.safety-empty-filter")}
        </AppText>
      ) : null}

      {items.map((item) => (
        <SafetyItemCard key={item.id} item={item} />
      ))}

      <AppText style={styles.section}>{t("home.documents")}</AppText>
      {walletDocs.length === 0 ? (
        <AppText style={styles.empty}>{t("home.documents-empty")}</AppText>
      ) : (
        walletDocs.map((doc) => <WalletDocCard key={doc.id} doc={doc} />)
      )}
    </Screen>
  );
}

type StatCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  tone: StatusTone;
  onPress: () => void;
};

/**
 * Compact compliance stat tile matching the Home prototype counters.
 * @param props - Stat props
 * @param props.icon - Leading Ionicons name
 * @param props.label - Stat label
 * @param props.value - Count value
 * @param props.tone - Status tone for colors
 * @param props.onPress - Filter press handler
 * @returns Stat card element
 */
function StatCard({ icon, label, value, tone, onPress }: StatCardProps) {
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

  return (
    <Pressable
      onPress={onPress}
      style={[styles.stat, { borderColor: accent }]}
      accessibilityRole="button"
    >
      <Ionicons name={icon} size={22} color={accent} />
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
    content: { paddingBottom: 36 },
    logoutButton: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
    },
    hero: { padding: 0, overflow: "hidden", marginBottom: 14, borderRadius: 16 },
    heroImage: { width: "100%", height: 180 },
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
      maxWidth: "48%",
      backgroundColor: colors.inverse,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    classText: { color: colors.onInverse, fontSize: 10, fontWeight: "800" },
    vesselName: {
      flexShrink: 1,
      color: colors.white,
      fontSize: 18,
      fontWeight: "800",
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
      backgroundColor: colors.statusOverdueBg,
      borderColor: colors.statusOverdueText,
      marginBottom: 14,
      borderRadius: 16,
    },
    attentionIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.statusOverdueText,
      alignItems: "center",
      justifyContent: "center",
    },
    attentionText: { flex: 1, minWidth: 0, gap: 2 },
    attentionTitle: {
      color: colors.statusOverdueText,
      fontWeight: "800",
      fontSize: 13,
      letterSpacing: 0.3,
    },
    attentionBody: {
      color: colors.statusOverdueText,
      fontSize: 12,
      opacity: 0.9,
    },
    attentionArrow: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.white,
      alignItems: "center",
      justifyContent: "center",
    },
    stats: { flexDirection: "row", gap: 8, marginBottom: 14 },
    stat: {
      flex: 1,
      borderRadius: 14,
      padding: 12,
      alignItems: "flex-start",
      gap: 4,
      backgroundColor: colors.card,
      borderWidth: 1.5,
    },
    statValue: { fontSize: 22, fontWeight: "800" },
    statLabel: {
      color: colors.navy,
      fontSize: 10,
      fontWeight: "800",
    },
    filters: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 14,
    },
    chip: {
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: colors.chipIdle,
    },
    chipOn: { backgroundColor: colors.inverse },
    chipText: { color: colors.navy, fontSize: 12, fontWeight: "700" },
    chipTextOn: { color: colors.onInverse },
    section: {
      color: colors.navy,
      fontWeight: "800",
      fontSize: 15,
      marginTop: 8,
      marginBottom: 10,
    },
    empty: {
      color: colors.muted,
      textAlign: "center",
      marginVertical: 16,
      fontSize: 14,
    },
    pressed: { opacity: 0.94 },
  });
}
