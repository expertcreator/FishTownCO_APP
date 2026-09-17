import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/constants/theme";
import { DEMO_BILLING } from "@/features/common/data/demo";
import {
  BackHeader,
  Card,
  PrimaryButton,
  Screen,
  StatusPill,
} from "@/features/common/ui";
import { useTranslation } from "@/shared/translations";

/**
 * Billing History screen matching prototype screen 22.
 * @returns Billing history UI
 */
export default function BillingHistoryScreen() {
  const { t } = useTranslation();

  return (
    <Screen>
      <BackHeader
        title={t("billing.title")}
        subtitle={t("billing.subtitle")}
      />

      <Card style={styles.plan}>
        <Text style={styles.planLabel}>{t("billing.current-plan")}</Text>
        <Text style={styles.planName}>{t("billing.plan-name")}</Text>
        <Text style={styles.planMeta}>{t("billing.renews")}</Text>
        <PrimaryButton
          label={t("billing.manage")}
          icon="card-outline"
          onPress={() => router.push("/subscription")}
          style={styles.manage}
        />
      </Card>

      <Text style={styles.section}>{t("billing.history")}</Text>
      {DEMO_BILLING.map((row) => (
        <Card key={row.id} style={styles.row}>
          <View style={styles.rowTop}>
            <Text style={styles.label}>{row.label}</Text>
            <Text style={styles.amount}>{row.amount}</Text>
          </View>
          <View style={styles.rowBottom}>
            <Text style={styles.date}>{row.date}</Text>
            <StatusPill label={row.status} tone="ok" />
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  plan: { marginBottom: 18, gap: 4 },
  planLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  planName: { color: colors.navy, fontSize: 20, fontWeight: "800" },
  planMeta: { color: colors.teal, fontWeight: "600", marginBottom: 8 },
  manage: { marginTop: 6 },
  section: {
    color: colors.navy,
    fontWeight: "800",
    fontSize: 16,
    marginBottom: 10,
  },
  row: { marginBottom: 10, gap: 8 },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  label: { color: colors.navy, fontWeight: "700", flex: 1 },
  amount: { color: colors.navy, fontWeight: "800" },
  rowBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  date: { color: colors.muted, fontSize: 12 },
});
