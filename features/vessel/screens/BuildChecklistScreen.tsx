import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { mapAuthError } from "@/features/auth/utils/mapAuthError";
import { BUILD_CHECKLIST_ITEMS } from "@/features/vessel/data/demoChecklist";
import { useVesselProfile } from "@/features/vessel/hooks/useVesselProfile";
import { saveVesselChecklist } from "@/features/vessel/services/saveVesselChecklist";
import {
  AppText,
  BackHeader,
  CARD_RIPPLE,
  Card,
  FormScreenSkeleton,
  getPressedItemStyle,
  KeyboardAwareContainer,
  PrimaryButton,
  Screen,
  StickyFormFooter,
  useToast,
} from "@/ui/components";
import { useColors, type ThemeColors } from "@/ui/theme";
import { useTranslation } from "@/ui/translations";

/**
 * Build Checklist screen matching prototype screen 9
 * (https://fishtownco.itoasis.co/).
 * Persists selected item ids on the vessel profile, then opens Subscription.
 * @returns Checklist builder UI
 */
export default function BuildChecklistScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const { t } = useTranslation();
  const toast = useToast();
  const {
    data: vessel,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useVesselProfile();
  const allIds = useMemo(
    () => BUILD_CHECKLIST_ITEMS.map((item) => item.id),
    []
  );
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(allIds.map((id) => [id, true]))
  );
  const [hydrated, setHydrated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  /** `undefined` until first fetch settles — avoid checklist flicker before hydrate. */
  const isInitialLoad = vessel === undefined;

  useEffect(() => {
    if (vessel === undefined || hydrated) return;
    if (vessel && vessel.checklistIds.length > 0) {
      setChecked(
        Object.fromEntries(
          allIds.map((id) => [id, vessel.checklistIds.includes(id)])
        )
      );
    }
    setHydrated(true);
  }, [vessel, hydrated, allIds]);

  const selectedIds = useMemo(
    () => allIds.filter((id) => checked[id]),
    [allIds, checked]
  );
  const selectedCount = selectedIds.length;
  const vesselLabel = vessel?.name?.trim()
    ? t("setup.checklist-vessel-sub", {
        name: vessel.name,
        length: vessel.length || "—",
        type: vessel.type || "—",
      })
    : t("setup.checklist-subtitle");

  /**
   * Saves selected checklist ids to Firestore, then opens Subscription.
   * @returns Promise that resolves when navigation starts or a toast is shown
   */
  const onBuildVessel = async () => {
    if (isSubmitting) return;
    if (selectedCount === 0) {
      toast.error(t("setup.checklist-required"));
      return;
    }
    setIsSubmitting(true);
    try {
      await saveVesselChecklist(selectedIds);
      toast.success(t("setup.checklist-saved"));
      router.push("/subscription");
    } catch (error) {
      console.error("[BuildChecklistScreen] save failed", error);
      if (error instanceof Error && error.message === "NOT_SIGNED_IN") {
        toast.error(t("vessel.sign-in-required"));
      } else {
        toast.error(mapAuthError(error, t));
      }
      setIsSubmitting(false);
    }
  };

  if (isInitialLoad && (isLoading || isFetching || !isError)) {
    return (
      <Screen
        scroll={false}
        edges={["top", "left", "right"]}
        contentStyle={styles.screen}
      >
        <BackHeader title={t("setup.checklist-title")} />
        <FormScreenSkeleton />
      </Screen>
    );
  }

  if (isInitialLoad && isError) {
    return (
      <Screen
        scroll={false}
        edges={["top", "left", "right"]}
        contentStyle={styles.screen}
      >
        <BackHeader title={t("setup.checklist-title")} />
        <AppText style={styles.error}>{t("vessel.load-failed")}</AppText>
        <PrimaryButton
          label={t("common.try-again")}
          onPress={() => {
            setHydrated(false);
            void refetch();
          }}
        />
      </Screen>
    );
  }

  if (!hydrated) {
    return (
      <Screen
        scroll={false}
        edges={["top", "left", "right"]}
        contentStyle={styles.screen}
      >
        <BackHeader title={t("setup.checklist-title")} />
        <FormScreenSkeleton />
      </Screen>
    );
  }

  return (
    <Screen
      scroll={false}
      edges={["top", "left", "right"]}
      contentStyle={styles.screen}
    >
      <BackHeader title={t("setup.checklist-title")} subtitle={vesselLabel} />

      <KeyboardAwareContainer
        useSafeAreaWrapper={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {BUILD_CHECKLIST_ITEMS.map((item) => {
          const on = Boolean(checked[item.id]);
          return (
            <Pressable
              key={item.id}
              onPress={() =>
                setChecked((prev) => ({ ...prev, [item.id]: !on }))
              }
              android_ripple={CARD_RIPPLE}
              style={({ pressed }) => [getPressedItemStyle(pressed)]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
            >
              <Card style={styles.row}>
                <Ionicons
                  name={on ? "checkbox" : "square-outline"}
                  size={24}
                  color={on ? colors.teal : colors.muted}
                />
                <View style={styles.rowText}>
                  <AppText style={styles.itemTitle}>{item.title}</AppText>
                  <AppText style={styles.standard}>
                    {t("setup.checklist-standard", { standard: item.standard })}
                  </AppText>
                </View>
              </Card>
            </Pressable>
          );
        })}
      </KeyboardAwareContainer>

      <StickyFormFooter>
        <PrimaryButton
          label={t("setup.build-vessel", { count: selectedCount })}
          icon="arrow-forward"
          loading={isSubmitting}
          onPress={() => void onBuildVessel()}
        />
      </StickyFormFooter>
    </Screen>
  );
}

/**
 * Builds build-checklist styles for the active palette.
 * @param colors - Active theme colors
 * @returns Style sheet
 */
function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      paddingHorizontal: 0,
      paddingBottom: 0,
    },
    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 24,
    },
    row: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      marginBottom: 10,
      borderRadius: 14,
    },
    rowText: { flex: 1, minWidth: 0, gap: 4 },
    itemTitle: {
      color: colors.navy,
      fontSize: 14,
      fontWeight: "700",
    },
    standard: {
      color: colors.muted,
      fontSize: 12,
    },
    error: {
      color: colors.muted,
      fontSize: 14,
      textAlign: "center",
      paddingHorizontal: 20,
      marginTop: 24,
      marginBottom: 16,
    },
  });
}
