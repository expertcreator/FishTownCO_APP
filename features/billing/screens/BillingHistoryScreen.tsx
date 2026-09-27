import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useBillingPayments } from "@/features/billing/hooks/useBillingPayments";
import type { BillingRow } from "@/features/billing/types/billing";
import {
  formatSafetyDueDate,
  parseSafetyDueDate,
} from "@/features/safety/utils/formatSafetyDueDate";
import {
  AppText,
  BackHeader,
  BillingListSkeleton,
  CARD_RIPPLE,
  Card,
  DatePickerModal,
  EmptyState,
  getPressedItemStyle,
  PrimaryButton,
  Screen,
  SelectField,
  useToast,
} from "@/ui/components";
import { useColors, type ThemeColors } from "@/ui/theme";
import { useTranslation } from "@/ui/translations";

type DateFilter = "3m" | "year" | "all";
type RangeField = "from" | "to";

/**
 * Billing History screen matching prototype screen 22
 * (https://fishtownco.itoasis.co/).
 * Loads live payments from Firestore `users/{uid}/billing`.
 * @returns Billing history UI
 */
export default function BillingHistoryScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const { t } = useTranslation();
  const toast = useToast();
  const [filter, setFilter] = useState<DateFilter>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [activeRange, setActiveRange] = useState<RangeField | null>(null);

  const { data, isLoading, isFetching, isError, refetch } = useBillingPayments();
  const payments = data ?? [];
  /** `undefined` until first fetch settles — never treat that as an empty list. */
  const isInitialLoad = data === undefined;

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch])
  );

  const rows = useMemo(() => {
    const now = new Date();
    const fromParsed = parseSafetyDueDate(fromDate);
    const toParsed = parseSafetyDueDate(toDate);

    return payments.filter((row) => {
      const paidAt = new Date(row.dateIso);
      if (Number.isNaN(paidAt.getTime())) return false;

      if (filter === "3m") {
        const cutoff = new Date(now);
        cutoff.setMonth(cutoff.getMonth() - 3);
        if (paidAt < cutoff) return false;
      } else if (filter === "year") {
        if (paidAt.getFullYear() !== now.getFullYear()) return false;
      }

      if (fromParsed) {
        const start = new Date(fromParsed);
        start.setHours(0, 0, 0, 0);
        if (paidAt < start) return false;
      }
      if (toParsed) {
        const end = new Date(toParsed);
        end.setHours(23, 59, 59, 999);
        if (paidAt > end) return false;
      }
      return true;
    });
  }, [payments, filter, fromDate, toDate]);

  const paidTotal = useMemo(() => {
    const sum = rows
      .filter((r) => r.status === "Paid")
      .reduce((acc, row) => acc + row.amountValue, 0);
    return sum.toFixed(2);
  }, [rows]);

  const rangeValue =
    activeRange === "from" ? fromDate : activeRange === "to" ? toDate : "";

  /**
   * Receipt detail is not in the prototype yet — show the same coming-soon cue.
   * @param row - Payment row that was pressed
   * @returns void
   */
  const onPaymentPress = (row: BillingRow) => {
    toast.info(
      t("billing.receipt-coming-soon", {
        amount: row.amount,
        date: row.date,
      })
    );
  };

  if (isInitialLoad && (isLoading || isFetching || !isError)) {
    return (
      <Screen>
        <BackHeader
          title={t("billing.title")}
          subtitle={t("billing.subtitle")}
        />
        <BillingListSkeleton />
      </Screen>
    );
  }

  if (isInitialLoad && isError) {
    return (
      <Screen>
        <BackHeader
          title={t("billing.title")}
          subtitle={t("billing.subtitle")}
        />
        <AppText style={styles.empty}>{t("billing.load-failed")}</AppText>
        <PrimaryButton
          label={t("common.try-again")}
          onPress={() => void refetch()}
        />
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
                android_ripple={CARD_RIPPLE}
                style={({ pressed }) => [
                  styles.chip,
                  on && styles.chipOn,
                  getPressedItemStyle(pressed),
                ]}
              >
                <AppText style={[styles.chipText, on && styles.chipTextOn]}>
                  {label}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.dateRow}>
          <View style={styles.dateField}>
            <SelectField
              label={t("billing.from")}
              value={fromDate}
              placeholder={t("billing.date-placeholder")}
              trailingIcon="calendar-outline"
              onPress={() => setActiveRange("from")}
            />
          </View>
          <View style={styles.dateField}>
            <SelectField
              label={t("billing.to")}
              value={toDate}
              placeholder={t("billing.date-placeholder")}
              trailingIcon="calendar-outline"
              onPress={() => setActiveRange("to")}
            />
          </View>
        </View>
      </Card>

      <AppText style={styles.summary}>
        {t("billing.summary", {
          count: rows.length,
          total: `£${paidTotal}`,
        })}
      </AppText>

      {rows.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title={t("billing.empty-title")}
          body={t("billing.empty")}
          actionLabel={t("billing.start-subscription")}
          actionIcon="arrow-forward"
          onActionPress={() => router.push("/subscription")}
        />
      ) : (
        rows.map((row) => {
          const paid = row.status === "Paid";
          return (
            <Pressable
              key={row.id}
              onPress={() => onPaymentPress(row)}
              android_ripple={CARD_RIPPLE}
              style={({ pressed }) => [getPressedItemStyle(pressed)]}
              accessibilityRole="button"
              accessibilityLabel={`${row.amount}, ${row.status}`}
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
                      {
                        color: paid
                          ? colors.teal
                          : colors.statusOverdueText,
                      },
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
        })
      )}

      <DatePickerModal
        visible={activeRange !== null}
        initialDate={parseSafetyDueDate(rangeValue) ?? new Date()}
        onClose={() => setActiveRange(null)}
        onConfirm={(date) => {
          const value = formatSafetyDueDate(date);
          if (activeRange === "from") setFromDate(value);
          if (activeRange === "to") setToDate(value);
          setActiveRange(null);
        }}
      />
    </Screen>
  );
}

/**
 * Builds billing-history styles matching the prototype filter + payment cards.
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
      letterSpacing: 1.8,
    },
    chips: {
      flexDirection: "row",
      flexWrap: "nowrap",
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
    dateRow: {
      flexDirection: "row",
      gap: 12,
      marginTop: 4,
    },
    dateField: {
      flex: 1,
      minWidth: 0,
    },
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
      padding: 16,
    },
    rowLeft: { flex: 1, minWidth: 0, gap: 2 },
    amount: {
      color: colors.navy,
      fontSize: 16,
      fontWeight: "800",
    },
    date: {
      color: "rgba(11, 42, 69, 0.6)",
      fontSize: 12,
      marginTop: 2,
    },
    method: {
      color: "rgba(11, 42, 69, 0.45)",
      fontSize: 11,
      marginTop: 2,
    },
    rowRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    status: {
      fontSize: 13,
      fontWeight: "700",
    },
    empty: {
      color: colors.muted,
      textAlign: "center",
      marginVertical: 24,
      fontSize: 14,
    },
  });
}
