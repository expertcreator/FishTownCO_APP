import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/constants/theme";
import { DEMO_VESSEL } from "@/features/common/data/demo";
import { Card, Screen } from "@/features/common/ui";
import { useTranslation } from "@/shared/translations";

/**
 * My Vessel tab matching prototype screen 13.
 * @returns Vessel tab UI
 */
export default function VesselScreen() {
  const { t } = useTranslation();

  return (
    <Screen edges={["top", "left", "right"]}>
      <Text style={styles.title}>{t("vessel.title")}</Text>
      <Text style={styles.sub}>{t("vessel.subtitle")}</Text>

      <Card style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.boatIcon}>
            <Ionicons name="boat" size={28} color={colors.teal} />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.name}>{DEMO_VESSEL.name}</Text>
            <Text style={styles.type}>{DEMO_VESSEL.type}</Text>
          </View>
        </View>
        <View style={styles.grid}>
          <Meta label={t("setup.length")} value={DEMO_VESSEL.length} />
          <Meta label={t("vessel.tonnage")} value={DEMO_VESSEL.tonnage} />
          <Meta label={t("vessel.flag")} value={DEMO_VESSEL.flag} />
          <Meta label={t("setup.home-port")} value={DEMO_VESSEL.homePort} />
          <Meta label={t("setup.mmsi")} value={DEMO_VESSEL.mmsi} />
          <Meta label={t("vessel.call-sign")} value={DEMO_VESSEL.callSign} />
          <Meta label={t("vessel.year-built")} value={DEMO_VESSEL.yearBuilt} />
          <Meta label={t("vessel.skipper")} value={DEMO_VESSEL.skipper} />
        </View>
      </Card>

      <ActionRow
        icon="create-outline"
        label={t("vessel.edit")}
        onPress={() => router.push("/edit-vessel")}
      />
      <ActionRow
        icon="people-outline"
        label={t("vessel.crew")}
        onPress={() => router.push("/crew")}
      />
      <ActionRow
        icon="card-outline"
        label={t("vessel.billing")}
        onPress={() => router.push("/billing")}
      />
    </Screen>
  );
}

type MetaProps = { label: string; value: string };

/**
 * Vessel particulars label/value cell.
 * @param props - Meta props
 * @returns Meta cell
 */
function Meta({ label, value }: MetaProps) {
  return (
    <View style={styles.meta}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

type ActionRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
};

/**
 * Vessel secondary action row.
 * @param props - Action props
 * @returns Action row
 */
function ActionRow({ icon, label, onPress }: ActionRowProps) {
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.action}>
        <Ionicons name={icon} size={20} color={colors.navy} />
        <Text style={styles.actionText}>{label}</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.navy, fontSize: 28, fontWeight: "800" },
  sub: { color: colors.muted, marginTop: 6, marginBottom: 16 },
  hero: { marginBottom: 14, gap: 16 },
  heroTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  boatIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.softTeal,
    alignItems: "center",
    justifyContent: "center",
  },
  heroText: { flex: 1, gap: 2 },
  name: { color: colors.navy, fontSize: 20, fontWeight: "800" },
  type: { color: colors.teal, fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  meta: { width: "47%", gap: 2 },
  metaLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  metaValue: { color: colors.navy, fontWeight: "700", fontSize: 14 },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  actionText: { flex: 1, color: colors.navy, fontWeight: "700", fontSize: 15 },
});
