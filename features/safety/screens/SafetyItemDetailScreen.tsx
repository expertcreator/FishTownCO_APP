import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/constants/theme";
import { DEMO_SAFETY_ITEMS } from "@/features/common/data/demo";
import {
  BackHeader,
  Card,
  Screen,
  StatusPill,
} from "@/features/common/ui";
import { useTranslation } from "@/shared/translations";

/**
 * Safety item detail matching prototype screen 15 (Liferaft).
 * @returns Item detail UI
 */
export default function SafetyItemDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = DEMO_SAFETY_ITEMS.find((i) => i.id === id) ?? DEMO_SAFETY_ITEMS[0];

  return (
    <Screen>
      <BackHeader title={item.name} subtitle={item.category} />

      <Card style={styles.hero}>
        <View style={styles.iconWrap}>
          <Ionicons name="help-buoy" size={32} color={colors.orange} />
        </View>
        <StatusPill label={item.status} tone={item.tone} />
      </Card>

      <Card style={styles.meta}>
        <Row label={t("safety.category")} value={item.category} />
        <Row label={t("safety.location")} value={item.location} />
        <Row label={t("safety.due-date")} value={item.dueDate} />
        {item.serial ? (
          <Row label={t("safety.serial")} value={item.serial} />
        ) : null}
        {item.notes ? (
          <Row label={t("safety.notes")} value={item.notes} />
        ) : null}
      </Card>
    </Screen>
  );
}

type RowProps = { label: string; value: string };

/**
 * Detail label/value row.
 * @param props - Row props
 * @returns Row element
 */
function Row({ label, value }: RowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.softOrange,
    alignItems: "center",
    justifyContent: "center",
  },
  meta: { gap: 14 },
  row: { gap: 4 },
  label: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  value: { color: colors.navy, fontSize: 15, fontWeight: "600" },
});
