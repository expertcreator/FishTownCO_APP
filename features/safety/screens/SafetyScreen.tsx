import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { SafetyItemCard } from "@/features/safety/components/SafetyItemCard";
import { useSafetyItems } from "@/features/safety/hooks/useSafetyItems";
import type { SafetyFilterKey } from "@/features/safety/types/safetyItem";
import { useVesselProfile } from "@/features/vessel/hooks/useVesselProfile";
import {
  AppHeader,
  AppText,
  FloatingActionButton,
  KeyboardAwareContainer,
  SafetyListSkeleton,
  Screen,
} from "@/ui/components";
import { useColors, type ThemeColors } from "@/ui/theme";
import { useTranslation } from "@/ui/translations";

/**
 * Safety Inventory tab matching prototype screen 12
 * (https://fishtownco.itoasis.co/).
 * Loads items from Firestore and computes Overdue / Due soon / OK.
 * @returns Safety tab UI
 */
export default function SafetyScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const { t } = useTranslation();
  const [filter, setFilter] = useState<SafetyFilterKey>("all");
  const { data = [], isLoading, isFetching, refetch, isError } = useSafetyItems();
  const { data: vessel } = useVesselProfile();
  const vesselName = vessel?.name?.trim() || t("home.vessel-fallback");

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch])
  );

  const counts = useMemo(() => {
    const ok = data.filter((i) => i.tone === "ok").length;
    const due = data.filter((i) => i.tone === "due").length;
    const overdue = data.filter((i) => i.tone === "overdue").length;
    return { ok, due, overdue, all: data.length };
  }, [data]);

  const items = useMemo(() => {
    if (filter === "all") return data;
    return data.filter((i) => i.tone === filter);
  }, [data, filter]);

  if (isLoading && data.length === 0) {
    return (
      <Screen
        scroll={false}
        edges={["top", "left", "right"]}
        contentStyle={styles.screenContent}
      >
        <AppHeader title={t("tabs.safety")} />
        <View style={styles.body}>
          <SafetyListSkeleton />
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      scroll={false}
      edges={["top", "left", "right"]}
      contentStyle={styles.screenContent}
    >
      <AppHeader title={t("tabs.safety")} />

      <KeyboardAwareContainer
        useSafeAreaWrapper={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardDismissMode="on-drag"
      >
        <AppText style={styles.title}>{t("tabs.safety").toUpperCase()}</AppText>
        <AppText style={styles.sub}>
          {t("safety.tracked-on", {
            count: counts.all,
            vessel: vesselName,
          })}
        </AppText>

        <View style={styles.filters}>
          {(
            [
              ["all", t("home.filter-all"), counts.all],
              ["overdue", t("home.filter-overdue"), counts.overdue],
              ["due", t("home.filter-due"), counts.due],
              ["ok", t("home.filter-ok"), counts.ok],
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

        {isError ? (
          <AppText style={styles.empty}>{t("safety.load-failed")}</AppText>
        ) : null}

        {!isError && items.length === 0 ? (
          <AppText style={styles.empty}>
            {filter === "all" ? t("safety.empty") : t("safety.empty-filter")}
          </AppText>
        ) : null}

        {items.map((item) => (
          <SafetyItemCard key={item.id} item={item} />
        ))}

        {isFetching && data.length > 0 ? (
          <AppText style={styles.refreshing}>{t("common.loading")}</AppText>
        ) : null}
      </KeyboardAwareContainer>

      <FloatingActionButton
        label={t("safety.add-title")}
        onPress={() => router.push("/safety/add")}
      />
    </Screen>
  );
}

/**
 * Builds Safety screen styles for the active palette.
 * @param colors - Active theme colors
 * @returns Style sheet
 */
function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screenContent: {
      flex: 1,
      paddingBottom: 0,
    },
    body: { flex: 1 },
    scroll: { flex: 1 },
    scrollContent: {
      paddingBottom: 96,
    },
    title: {
      color: colors.navy,
      fontSize: 30,
      fontWeight: "800",
      letterSpacing: 0.8,
    },
    sub: { color: colors.muted, marginTop: 6, marginBottom: 16, fontSize: 14 },
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
    empty: {
      color: colors.muted,
      textAlign: "center",
      marginVertical: 24,
      fontSize: 14,
    },
    refreshing: {
      color: colors.muted,
      textAlign: "center",
      fontSize: 12,
      marginBottom: 8,
    },
  });
}
