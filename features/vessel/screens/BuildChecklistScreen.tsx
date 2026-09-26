import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { DEMO_BUILD_CHECKLIST } from "@/features/vessel/data/demoChecklist";
import { useVesselProfile } from "@/features/vessel/hooks/useVesselProfile";
import {
  AppText,
  BackHeader,
  Card,
  KeyboardAwareContainer,
  PrimaryButton,
  Screen,
  StickyFormFooter,
} from "@/ui/components";
import { useColors, type ThemeColors } from "@/ui/theme";
import { useTranslation } from "@/ui/translations";

/**
 * Build Checklist screen matching prototype screen 9
 * (https://fishtownco.itoasis.co/).
 * @returns Checklist builder UI
 */
export default function BuildChecklistScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const { t } = useTranslation();
  const { data: vessel } = useVesselProfile();
  const allIds = useMemo(
    () => DEMO_BUILD_CHECKLIST.map((item) => item.id),
    []
  );
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(allIds.map((id) => [id, true]))
  );

  const selectedCount = Object.values(checked).filter(Boolean).length;
  const vesselLabel = vessel?.name?.trim()
    ? t("setup.checklist-vessel-sub", {
        name: vessel.name,
        length: vessel.length || "—",
        type: vessel.type || "—",
      })
    : t("setup.checklist-subtitle");

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
        keyboardDismissMode="on-drag"
      >
        {DEMO_BUILD_CHECKLIST.map((item) => {
          const on = Boolean(checked[item.id]);
          return (
            <Pressable
              key={item.id}
              onPress={() =>
                setChecked((prev) => ({ ...prev, [item.id]: !on }))
              }
              style={({ pressed }) => [pressed && styles.pressed]}
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
          onPress={() => router.push("/subscription")}
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
    pressed: { opacity: 0.95 },
  });
}
