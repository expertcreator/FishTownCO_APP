import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useColors, type ThemeColors } from "@/ui/theme";
import { DEMO_BILLING } from "@/features/common/data/demo";
import {
  AppText,
  BackHeader,
  Card,
  PrimaryButton,
  Screen,
  StatusPill,
} from "@/ui/components";
import { useTranslation } from "@/ui/translations";

/**
 * Billing History screen matching prototype screen 22.
 * @returns Billing history UI
 */
export default function BillingHistoryScreen() {
  const colors = useColors();
  const styles = getStyles(colors);

  const { t } = useTranslation();

  return (
    <Screen>
      <BackHeader
        title={t("billing.title")}
        subtitle={t("billing.subtitle")}
      />

      <Card style={styles.plan}>
        <AppText style={styles.planLabel}>{t("billing.current-plan")}</AppText>
        <AppText style={styles.planName}>{t("billing.plan-name")}</AppText>
        <AppText style={styles.planMeta}>{t("billing.renews")}</AppText>
        <PrimaryButton
          label={t("billing.manage")}
          icon="card-outline"
          onPress={() => router.push("/subscription")}
          style={styles.manage}
        />
      </Card>

      <AppText style={styles.section}>{t("billing.history")}</AppText>
      {DEMO_BILLING.map((row) => (
        <Card key={row.id} style={styles.row}>
          <View style={styles.rowTop}>
            <AppText style={styles.label}>{row.label}</AppText>
            <AppText style={styles.amount}>{row.amount}</AppText>
          </View>
          <View style={styles.rowBottom}>
            <AppText style={styles.date}>{row.date}</AppText>
            <StatusPill label={row.status} tone="ok" />
          </View>
        </Card>
      ))}
    </Screen>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
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
}
