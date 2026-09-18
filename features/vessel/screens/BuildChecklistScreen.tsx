import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useColors, type ThemeColors } from "@/ui/theme";
import { DEMO_CHECKLIST } from "@/features/common/data/demo";
import {
  AppText,
  BackHeader,
  Card,
  PrimaryButton,
  Screen,
} from "@/ui/components";
import { useTranslation } from "@/ui/translations";

/**
 * Build Checklist screen matching prototype screen 9.
 * @returns Checklist builder UI
 */
export default function BuildChecklistScreen() {
  const colors = useColors();
  const styles = getStyles(colors);

  const { t } = useTranslation();
  const allIds = useMemo(
    () => DEMO_CHECKLIST.flatMap((g) => g.items.map((item) => `${g.id}:${item}`)),
    []
  );
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(allIds.map((id) => [id, true]))
  );

  const selectedCount = Object.values(checked).filter(Boolean).length;

  return (
    <Screen>
      <BackHeader
        title={t("setup.checklist-title")}
        subtitle={t("setup.checklist-subtitle")}
      />

      <View style={styles.meta}>
        <AppText style={styles.metaText}>
          {t("setup.checklist-selected", { count: selectedCount })}
        </AppText>
      </View>

      {DEMO_CHECKLIST.map((group) => (
        <Card key={group.id} style={styles.group}>
          <AppText style={styles.groupTitle}>{group.title}</AppText>
          {group.items.map((item) => {
            const id = `${group.id}:${item}`;
            const on = Boolean(checked[id]);
            return (
              <Pressable
                key={id}
                style={styles.row}
                onPress={() => setChecked((prev) => ({ ...prev, [id]: !on }))}
              >
                <Ionicons
                  name={on ? "checkbox" : "square-outline"}
                  size={22}
                  color={on ? colors.teal : colors.muted}
                />
                <AppText style={styles.rowText}>{item}</AppText>
              </Pressable>
            );
          })}
        </Card>
      ))}

      <PrimaryButton
        label={t("setup.continue-subscription")}
        onPress={() => router.push("/subscription")}
        style={styles.cta}
      />
    </Screen>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
  meta: {
    backgroundColor: colors.softOrange,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  metaText: { color: colors.orange, fontWeight: "700", fontSize: 13 },
  group: { marginBottom: 12, gap: 10 },
  groupTitle: {
    color: colors.navy,
    fontWeight: "800",
    fontSize: 15,
    marginBottom: 2,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 },
  rowText: { color: colors.navy, fontSize: 14, flex: 1 },
  cta: { marginTop: 8 },
});
}
