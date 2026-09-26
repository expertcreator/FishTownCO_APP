import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useInitialSkeleton } from "@/features/common/hooks/useInitialSkeleton";
import { WalletDocCard } from "@/features/wallet/components/WalletDocCard";
import { useWalletDocs } from "@/features/wallet/hooks/useWalletDocs";
import {
  AppHeader,
  AppText,
  FloatingActionButton,
  KeyboardAwareContainer,
  PrimaryButton,
  Screen,
  WalletListSkeleton,
} from "@/ui/components";
import { useColors, type ThemeColors } from "@/ui/theme";
import { useTranslation } from "@/ui/translations";

type WalletFilterKey = "all" | "action" | "registry" | "safety";

/**
 * Wallet tab matching prototype screen 14
 * (https://fishtownco.itoasis.co/).
 * Loads documents from Firestore `users/{uid}/wallet`.
 * @returns Wallet tab UI
 */
export default function WalletScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const { t } = useTranslation();
  const skeletonPending = useInitialSkeleton();
  const [filter, setFilter] = useState<WalletFilterKey>("all");
  const {
    data: docs = [],
    isLoading,
    refetch,
    isError,
  } = useWalletDocs();

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch])
  );

  const counts = useMemo(() => {
    const action = docs.filter(
      (d) => d.tone === "due" || d.tone === "overdue"
    ).length;
    const registry = docs.filter(
      (d) => d.category === "registry" || d.category === "compliance"
    ).length;
    const safety = docs.filter(
      (d) => d.category === "safety" || d.category === "telecom"
    ).length;
    return { all: docs.length, action, registry, safety };
  }, [docs]);

  const items = useMemo(() => {
    switch (filter) {
      case "action":
        return docs.filter((d) => d.tone === "due" || d.tone === "overdue");
      case "registry":
        return docs.filter(
          (d) => d.category === "registry" || d.category === "compliance"
        );
      case "safety":
        return docs.filter(
          (d) => d.category === "safety" || d.category === "telecom"
        );
      default:
        return docs;
    }
  }, [docs, filter]);

  if ((isLoading || skeletonPending) && docs.length === 0 && !isError) {
    return (
      <Screen scroll={false} edges={["top", "left", "right"]}>
        <AppHeader title={t("tabs.wallet")} />
        <WalletListSkeleton />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen edges={["top", "left", "right"]}>
        <AppHeader title={t("tabs.wallet")} />
        <AppText style={styles.empty}>{t("wallet.load-failed")}</AppText>
        <PrimaryButton
          label={t("common.try-again")}
          onPress={() => void refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen
      scroll={false}
      edges={["top", "left", "right"]}
      contentStyle={styles.screen}
    >
      <AppHeader title={t("tabs.wallet")} />

      <KeyboardAwareContainer
        useSafeAreaWrapper={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardDismissMode="on-drag"
      >
        <AppText style={styles.title}>
          {t("wallet.title").toUpperCase()}
        </AppText>
        <AppText style={styles.sub}>{t("wallet.subtitle")}</AppText>

        <View style={styles.filters}>
          {(
            [
              ["all", t("wallet.filter-all"), counts.all],
              ["action", t("wallet.filter-action"), counts.action],
              ["registry", t("wallet.filter-registry"), counts.registry],
              ["safety", t("wallet.filter-safety"), counts.safety],
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

        {items.length === 0 ? (
          <AppText style={styles.empty}>
            {filter === "all" ? t("wallet.empty") : t("wallet.empty-filter")}
          </AppText>
        ) : (
          items.map((doc) => <WalletDocCard key={doc.id} doc={doc} />)
        )}
      </KeyboardAwareContainer>

      <FloatingActionButton
        label={t("wallet.add-document")}
        onPress={() => router.push("/wallet/add")}
      />
    </Screen>
  );
}

/**
 * Builds Wallet screen styles for the active palette.
 * @param colors - Active theme colors
 * @returns Style sheet
 */
function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      paddingBottom: 0,
    },
    scroll: { flex: 1 },
    scrollContent: {
      paddingBottom: 100,
    },
    title: {
      color: colors.navy,
      fontSize: 30,
      fontWeight: "800",
      letterSpacing: 0.8,
    },
    sub: {
      color: colors.muted,
      marginTop: 6,
      marginBottom: 16,
      fontSize: 14,
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
    empty: {
      color: colors.muted,
      textAlign: "center",
      marginVertical: 24,
      fontSize: 14,
    },
  });
}
