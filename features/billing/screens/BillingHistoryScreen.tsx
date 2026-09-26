import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { DEMO_BILLING } from "@/features/billing/data/demoBilling";
import { useInitialSkeleton } from "@/features/common/hooks/useInitialSkeleton";
import {
  AppText,
  BackHeader,
  BillingListSkeleton,
  Card,
  Screen,
  SelectField,
  useToast,
} from "@/ui/components";
import { useColors, type ThemeColors } from "@/ui/theme";
import { useTranslation } from "@/ui/translations";

type DateFilter = "3m" | "year" | "all";

/**
 * Billing History screen matching prototype screen 22
 * (https://fishtownco.itoasis.co/).
 * @returns Billing history UI
 */
export default function BillingHistoryScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const { t } = useTranslation();
  const toast = useToast();
  const isPending = useInitialSkeleton();
  const [filter, setFilter] = useState<DateFilter>("all");

  const rows = DEMO_BILLING;
  const paidTotal = useMemo(() => {
    const sum = rows
      .filter((r) => r.status === "Paid")
      .reduce((acc, row) => {
        const n = Number(row.amount.replace(/[£,\s]/g, ""));
        return acc + (Number.isFinite(n) ? n : 0);
      }, 0);
    return sum.toFixed(2);
  }, [rows]);

  if (isPending) {
    return (
      <Screen>
        <BillingListSkeleton />
      </Screen>
    );
  }

  return (
    <Screen contentStyle={styles.content}>
      <BackHeader
        title={t("billing.title")}
        subtitle={t("billing.subtitle")}
      />

      <Card style={styles.filterCard}>
        <AppText style={styles.filterLabel}>{t("billing.filter-by-date")}</AppText>
        <View style={styles.chips}>
          {(
            [
              ["3m", t("billing.filter-3m")],
              ["year", t("billing.filter-year")],
              ["all", t("billing.filter-all")],
            ] as const
          ).map(([key, label]) => {
            const on = filter === key;
            return (
              <Pressable
                key={key}
                onPress={() => setFilter(key)}
                style={[styles.chip, on && styles.chipOn]}
              >
                <AppText style={[styles.chipText, on && styles.chipTextOn]}>
                  {label}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <SelectField
          label={t("billing.from")}
          value=""
          placeholder={t("billing.date-placeholder")}
          icon="calendar-outline"
          onPress={() => toast.info(t("common.coming-soon"))}
        />
        <SelectField
          label={t("billing.to")}
          value=""
          placeholder={t("billing.date-placeholder")}
          icon="calendar-outline"
          onPress={() => toast.info(t("common.coming-soon"))}
        />
      </Card>

      <AppText style={styles.summary}>
        {t("billing.summary", {
          count: rows.length,
          total: `£${paidTotal}`,
        })}
      </AppText>

      {rows.map((row) => {
        const paid = row.status === "Paid";
        return (
          <Pressable
            key={row.id}
            onPress={() => toast.info(t("common.coming-soon"))}
            style={({ pressed }) => [pressed && styles.pressed]}
          >
            <Card style={styles.row}>
              <View style={styles.rowLeft}>
                <AppText style={styles.amount}>{row.amount}</AppText>
                <AppText style={styles.date}>{row.date}</AppText>
                <AppText style={styles.method}>{row.method}</AppText>
              </View>
              <View style={styles.rowRight}>
                <AppText
                  style={[
                    styles.status,
                    { color: paid ? colors.teal : colors.statusOverdueText },
                  ]}
                >
                  {row.status}
                </AppText>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.muted}
                />
              </View>
            </Card>
          </Pressable>
        );
      })}
    </Screen>
  );
}

/**
 * Builds billing-history styles for the active palette.
 * @param colors - Active theme colors
 * @returns Style sheet
 */
function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: { paddingBottom: 36 },
    filterCard: {
      gap: 12,
      marginBottom: 16,
      borderRadius: 16,
    },
    filterLabel: {
      color: colors.teal,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.6,
    },
    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    chip: {
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 8,
      backgroundColor: colors.chipIdle,
    },
    chipOn: { backgroundColor: colors.inverse },
    chipText: { color: colors.navy, fontSize: 12, fontWeight: "700" },
    chipTextOn: { color: colors.onInverse },
    summary: {
      color: colors.muted,
      fontSize: 13,
      marginBottom: 12,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      marginBottom: 10,
      borderRadius: 16,
    },
    rowLeft: { flex: 1, minWidth: 0, gap: 2 },
    amount: {
      color: colors.navy,
      fontSize: 18,
      fontWeight: "800",
    },
    date: {
      color: colors.muted,
      fontSize: 13,
    },
    method: {
      color: colors.muted,
      fontSize: 12,
    },
    rowRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    status: {
      fontSize: 13,
      fontWeight: "700",
    },
    pressed: { opacity: 0.96 },
  });
}
