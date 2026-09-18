import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { colors } from "@/constants/theme";
import {
  DEMO_SAFETY_ITEMS,
  DEMO_VESSEL,
  type StatusTone,
} from "@/features/common/data/demo";
import { AppText, Card, Screen, StatusPill } from "@/shared/components";
import { useTranslation } from "@/shared/translations";

type FilterKey = "all" | "ok" | "due" | "overdue";

/**
 * Home dashboard matching prototype screen 11.
 * @returns Home tab UI
 */
export default function HomeScreen() {
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

  const attention = counts.due + counts.overdue;

  return (
    <Screen edges={["top", "left", "right"]} contentStyle={styles.content}>
      <View style={styles.topBar}>
        <Image
          source={require("@/assets/from-design/welcome/welcome-logo.png")}
          style={styles.brand}
          resizeMode="contain"
        />
        <AppText style={styles.topTitle}>{t("home.title")}</AppText>
        <View style={styles.topSpacer} />
      </View>

      <Card style={styles.hero}>
        <Image
          source={require("@/assets/from-design/onboarding/01-central-log.jpg")}
          style={styles.heroImage}
          resizeMode="cover"
        />
        <View style={styles.heroOverlay}>
          <View style={styles.classPill}>
            <AppText style={styles.classText}>{t("home.vessel-class")}</AppText>
          </View>
          <AppText style={styles.vesselName}>{DEMO_VESSEL.name.toUpperCase()}</AppText>
        </View>
      </Card>

      {attention > 0 ? (
        <Pressable onPress={() => setFilter("overdue")}>
          <Card style={styles.attention}>
            <AppText style={styles.attentionTitle}>
              {t("home.attention-title", { count: attention })}
            </AppText>
            <AppText style={styles.attentionBody}>{t("home.attention-body")}</AppText>
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

      <AppText style={styles.section}>{t("home.upcoming")}</AppText>
      {items.map((item) => (
        <Pressable
          key={item.id}
          onPress={() => router.push(`/safety/${item.id}`)}
        >
          <Card style={styles.row}>
            <View style={styles.rowBody}>
              <AppText style={styles.rowTitle}>{item.name}</AppText>
              <AppText style={styles.rowMeta}>
                {item.category} · {item.dueDate}
              </AppText>
            </View>
            <StatusPill label={item.status} tone={item.tone} />
          </Card>
        </Pressable>
      ))}

      <AppText style={styles.section}>{t("home.quick-actions")}</AppText>
      <View style={styles.actions}>
        <ActionChip
          label={t("home.view-safety")}
          icon="shield-outline"
          onPress={() => router.push("/(tabs)/safety")}
        />
        <ActionChip
          label={t("home.view-wallet")}
          icon="folder-outline"
          onPress={() => router.push("/(tabs)/wallet")}
        />
        <ActionChip
          label={t("home.view-crew")}
          icon="people-outline"
          onPress={() => router.push("/crew")}
        />
        <ActionChip
          label={t("home.view-billing")}
          icon="card-outline"
          onPress={() => router.push("/billing")}
        />
      </View>
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
 * Compact compliance stat tile.
 * @param props - Stat props
 * @returns Stat card
 */
function StatCard({ icon, label, value, tone, onPress }: StatCardProps) {
  const bg =
    tone === "ok"
      ? "#E4F5EC"
      : tone === "due"
        ? "#FFF4E0"
        : tone === "overdue"
          ? "#FDECEC"
          : colors.softTeal;
  const fg =
    tone === "ok"
      ? "#1F7A4D"
      : tone === "due"
        ? "#B45309"
        : tone === "overdue"
          ? "#B91C1C"
          : colors.teal;

  return (
    <Pressable onPress={onPress} style={[styles.stat, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={18} color={fg} />
      <AppText style={[styles.statValue, { color: fg }]}>{value}</AppText>
      <AppText style={[styles.statLabel, { color: fg }]}>{label}</AppText>
    </Pressable>
  );
}

type ActionChipProps = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

/**
 * Home quick-action chip.
 * @param props - Chip props
 * @returns Action chip
 */
function ActionChip({ label, icon, onPress }: ActionChipProps) {
  return (
    <Pressable onPress={onPress} style={styles.action}>
      <Ionicons name={icon} size={16} color={colors.navy} />
      <AppText style={styles.actionText}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 36 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  brand: { width: 88, height: 36 },
  topTitle: {
    flex: 1,
    textAlign: "center",
    color: colors.navy,
    fontWeight: "700",
    fontSize: 17,
  },
  topSpacer: { width: 88 },
  hero: { padding: 0, overflow: "hidden", marginBottom: 14 },
  heroImage: { width: "100%", height: 168 },
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
    backgroundColor: colors.navy,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  classText: { color: colors.white, fontSize: 10, fontWeight: "800" },
  vesselName: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  attention: {
    backgroundColor: colors.softOrange,
    borderColor: "#F7C7AE",
    marginBottom: 14,
    gap: 4,
  },
  attentionTitle: { color: colors.orange, fontWeight: "800", fontSize: 14 },
  attentionBody: { color: colors.navy, fontSize: 13 },
  stats: { flexDirection: "row", gap: 8, marginBottom: 14 },
  stat: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: "flex-start",
    gap: 4,
  },
  statValue: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 10, fontWeight: "800" },
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
  section: {
    color: colors.navy,
    fontWeight: "800",
    fontSize: 15,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  rowBody: { flex: 1, gap: 2 },
  rowTitle: { color: colors.navy, fontWeight: "700", fontSize: 14 },
  rowMeta: { color: colors.muted, fontSize: 12 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  actionText: { color: colors.navy, fontWeight: "700", fontSize: 12 },
});
