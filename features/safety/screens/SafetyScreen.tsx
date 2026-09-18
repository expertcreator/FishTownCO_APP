import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/constants/theme";
import { DEMO_SAFETY_ITEMS, DEMO_VESSEL } from "@/features/common/data/demo";
import { Card, Screen, StatusPill } from "@/features/common/ui";
import { useTranslation } from "@/shared/translations";

type FilterKey = "all" | "ok" | "due" | "overdue";

/**
 * Safety Inventory tab matching prototype screen 12.
 * @returns Safety tab UI
 */
export default function SafetyScreen() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<FilterKey>("all");

  const counts = useMemo(() => {
    const ok = DEMO_SAFETY_ITEMS.filter((i) => i.tone === "ok").length;
    const due = DEMO_SAFETY_ITEMS.filter((i) => i.tone === "due").length;
    const overdue = DEMO_SAFETY_ITEMS.filter((i) => i.tone === "overdue").length;
    return { ok, due, overdue, all: DEMO_SAFETY_ITEMS.length };
  }, []);

  const items = useMemo(() => {
    if (filter === "all") return DEMO_SAFETY_ITEMS;
    return DEMO_SAFETY_ITEMS.filter((i) => i.tone === filter);
  }, [filter]);

  return (
    <Screen edges={["top", "left", "right"]} contentStyle={styles.content}>
      <Text style={styles.title}>{t("safety.title").toUpperCase()}</Text>
      <Text style={styles.sub}>
        {t("safety.tracked-on", { count: counts.all, vessel: DEMO_VESSEL.name })}
      </Text>

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
              <Text style={[styles.chipText, on && styles.chipTextOn]}>
                {label} ({count})
              </Text>
            </Pressable>
          );
        })}
      </View>

      {items.map((item) => (
        <Pressable
          key={item.id}
          onPress={() => router.push(`/safety/${item.id}`)}
        >
          <Card style={styles.row}>
            <View style={styles.iconWrap}>
              <Ionicons name="help-buoy-outline" size={22} color={colors.orange} />
            </View>
            <View style={styles.body}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>
                Next due: {item.dueDate} · {item.location}
              </Text>
            </View>
            <StatusPill label={item.status} tone={item.tone} />
          </Card>
        </Pressable>
      ))}

      <Pressable style={styles.fab} onPress={() => router.push("/add-safety")}>
        <Ionicons name="add" size={20} color={colors.white} />
        <Text style={styles.fabText}>{t("safety.add-title")}</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 36 },
  title: {
    color: colors.navy,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  sub: { color: colors.muted, marginTop: 6, marginBottom: 16 },
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
    backgroundColor: "#EFE8DC",
  },
  chipOn: { backgroundColor: colors.navy },
  chipText: { color: colors.navy, fontSize: 12, fontWeight: "700" },
  chipTextOn: { color: colors.white },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.softOrange,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, gap: 4 },
  name: { color: colors.navy, fontWeight: "700", fontSize: 14 },
  meta: { color: colors.muted, fontSize: 12 },
  fab: {
    marginTop: 8,
    alignSelf: "stretch",
    backgroundColor: colors.orange,
    borderRadius: 16,
    minHeight: 52,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  fabText: { color: colors.white, fontWeight: "800", fontSize: 13 },
});
