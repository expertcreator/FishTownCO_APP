import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import {
  AddSafetyFab,
  SafetyEmptyState,
  SafetyItemCard,
} from "@/features/safety/components";
import { useSafetyItems } from "@/features/safety/hooks/useSafetyItems";
import type { SafetyFilterKey } from "@/features/safety/types/safetyItem";
import { useVesselProfile } from "@/features/vessel/hooks/useVesselProfile";
import {
  AppHeader,
  AppText,
  CARD_RIPPLE,
  getPressedItemStyle,
  KeyboardAwareContainer,
  SafetyListSkeleton,
  Screen,
} from "@/ui/components";
import { useColors, type ThemeColors } from "@/ui/theme";
import { useTranslation } from "@/ui/translations";

/**
 * Safety Inventory tab matching https://fishtownco.itoasis.co/ (screen 12).
 * Loads live items from Firestore and computes Overdue / Due soon / OK.
 * @returns Safety tab UI
 */
export default function SafetyScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const { t } = useTranslation();
  const [filter, setFilter] = useState<SafetyFilterKey>("all");
  const { data, isLoading, isFetching, refetch, isError } = useSafetyItems();
  const itemsData = data ?? [];
  /** `undefined` until first fetch settles — never treat that as an empty list. */
  const isInitialLoad = data === undefined;
  const { data: vessel } = useVesselProfile();
  const vesselName = vessel?.name?.trim() || t("app.name");

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch])
  );

  const counts = useMemo(() => {
    const ok = itemsData.filter((i) => i.tone === "ok").length;
    const due = itemsData.filter((i) => i.tone === "due").length;
    const overdue = itemsData.filter((i) => i.tone === "overdue").length;
    return { ok, due, overdue, all: itemsData.length };
  }, [itemsData]);

  const items = useMemo(() => {
    if (filter === "all") return itemsData;
    return itemsData.filter((i) => i.tone === filter);
  }, [itemsData, filter]);

  const trackedCopy =
    counts.all === 1
      ? t("safety.tracked-on-one", { count: counts.all, vessel: vesselName })
      : t("safety.tracked-on", { count: counts.all, vessel: vesselName });

  if (isInitialLoad && (isLoading || isFetching || !isError)) {
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
      >
        <AppText style={styles.title}>{t("tabs.safety").toUpperCase()}</AppText>
        <AppText style={styles.sub}>{trackedCopy}</AppText>

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

        {isError ? (
          <AppText style={styles.empty}>{t("safety.load-failed")}</AppText>
        ) : null}

        {!isError && !isInitialLoad && items.length === 0 ? (
          <SafetyEmptyState
            variant={counts.all === 0 ? "inventory" : "filter"}
          />
        ) : null}

        <View style={styles.list}>
          {items.map((item) => (
            <SafetyItemCard
              key={item.id}
              item={item}
              showReplacement="action"
            />
          ))}
        </View>

        {isFetching && itemsData.length > 0 ? (
          <AppText style={styles.refreshing}>{t("common.loading")}</AppText>
        ) : null}
      </KeyboardAwareContainer>

      <AddSafetyFab />
    </Screen>
  );
}

/**
 * Builds Safety screen styles matching the prototype inventory layout.
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
      fontSize: 28,
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
    list: { gap: 14 },
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
