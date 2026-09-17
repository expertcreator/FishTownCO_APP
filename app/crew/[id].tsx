import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/constants/theme";
import { DEMO_CREW } from "@/features/common/data/demo";
import {
  BackHeader,
  Card,
  Screen,
  StatusPill,
} from "@/features/common/ui";
import { useTranslation } from "@/shared/translations";

/**
 * Crew Detail screen matching prototype screen 21.
 * @returns Crew member detail UI
 */
export default function CrewDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const member = DEMO_CREW.find((c) => c.id === id) ?? DEMO_CREW[0];

  return (
    <Screen>
      <BackHeader title={member.name} subtitle={member.role} />

      <Card style={styles.hero}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={28} color={colors.teal} />
        </View>
        <StatusPill label={member.expires} tone={member.tone} />
      </Card>

      <Card style={styles.meta}>
        <Row label={t("crew.role")} value={member.role} />
        <Row label={t("crew.certificate")} value={member.cert} />
        <Row label={t("crew.expires")} value={member.expires} />
        <Row label={t("crew.phone")} value={member.phone} />
        <Row label={t("auth.email-address")} value={member.email} />
      </Card>
    </Screen>
  );
}

type RowProps = { label: string; value: string };

/**
 * Crew detail label/value row.
 * @param props - Row props
 * @param props.label - Field label
 * @param props.value - Field value
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
  hero: { alignItems: "flex-start", gap: 10, marginBottom: 12 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.softTeal,
    alignItems: "center",
    justifyContent: "center",
  },
  meta: { gap: 12 },
  row: { gap: 4 },
  label: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  value: { color: colors.navy, fontSize: 15, fontWeight: "600" },
});
