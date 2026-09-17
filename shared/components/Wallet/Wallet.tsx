import { useTranslation } from "@/shared/translations";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  ListRenderItem,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";

import { toastServerCode } from "@/shared/api/errors";
import { AppText, EmptyState } from "@/shared/components";
import SubHeader from "@/shared/components/SubHeader";
import { colors, fonts } from "@/shared/constants";
import { formatCurrency as formatCurrencyByCode } from "@/shared/constants/currency";
import { useFilterDatePickerModals } from "@/shared/hooks";
import type { DateRange } from "@/shared/components/DateRangePicker/DateRangePicker.type";
import { mmkv } from "@/shared/stores/mmkvStorage";
import { useColors } from "@/shared/theme";
import { formatOrderDate, formatOrderDateTime } from "@/shared/utils/dateTime";
import { readRiderWalletDisplayId } from "@/core/rider-wallet";
import axios from "axios";
import { moderateScale } from "react-native-size-matters";
import { getStyles } from "./Wallet.styles";
import type { WalletApi, WalletTransactionItem } from "./walletApi.types";
import WalletModals from "./WalletModals";
import { WalletSummarySkeleton } from "./WalletSummarySkeleton";
import { WalletTransactionSkeleton } from "./WalletTransactionSkeleton";
import type { TransactionStatus, WalletTransaction } from "./walletViewTypes";

// Helper function to detect validation errors (skip toast for these)
const isValidationError = (error: unknown): boolean => {
  if (!axios.isAxiosError(error)) {
    return false;
  }
  const errorData = error.response?.data as
    | { code?: string; message?: string }
    | undefined;

  const errorMessage =
    typeof errorData === "string" ? errorData : errorData?.message || "";
  const errorCode = typeof errorData === "object" ? errorData?.code : "";

  return (
    errorCode === "VALIDATION_ERROR" ||
    errorMessage.toLowerCase().includes("validation")
  );
};

export type WalletProps = {
  /** Injected data + mutations (use `useWalletApi` from the app’s wallet service for the default driver). */
  walletApi: WalletApi;
  debounce?: boolean;
  swipeRefresh?: boolean;
  /** Optional parent-controlled flag to disable the "Deposit Cash" CTA. */
  disableDepositCashCta?: boolean;
  /**
   * When false, hides wallet reference / "Order ID" in the detail sheet and list cards.
   * Defaults true for shared reuse (e.g. POS); marketplace-only apps can set false.
   */
  showTransactionReferenceRow?: boolean;
  /**
   * When set, replaces the middle summary card title and the "collection" filter chip label.
   * Omit everywhere else so `walletScreen.collection` / `walletScreen.filter.collection` stay as-is.
   */
  collectionLabelOverride?: string;
  /**
   * Runs together with the wallet transactions refetch on pull-to-refresh (e.g. re-sync `/admin/me-pos`).
   */
  onPullToRefresh?: () => void | Promise<void>;
  /** When true, hides the built-in summary cards row (parent renders tab-specific cards). */
  hideSummaryCards?: boolean;
  /** Parent-owned date range for shared settlement filters. */
  filterDateRange?: DateRange;
  /** Opens the parent-rendered date filter modal. */
  onOpenDateFilter?: () => void;
  /** When true, parent renders date filter modals instead of Wallet. */
  hideDateFilterModals?: boolean;
  /** Notified when the date filter is applied or reset (e.g. parent refetches summary cards). */
  onDateRangeChange?: (range: DateRange) => void;
  /** Host app opens cash deposit (e.g. rider → `/CashDepositScreen`). Omit in apps without deposit flow. */
  onOpenCashDeposit?: () => void;
  /** Host app resubmits a rejected cash deposit (e.g. rider navigates with requestId). */
  onResubmitCashDeposit?: (tx: WalletTransaction) => void;
};

const Wallet: FC<WalletProps> = ({
  walletApi,
  debounce = false,
  swipeRefresh = true,
  disableDepositCashCta = false,
  showTransactionReferenceRow = true,
  collectionLabelOverride,
  onPullToRefresh,
  hideSummaryCards = false,
  filterDateRange,
  onOpenDateFilter,
  hideDateFilterModals = false,
  onDateRangeChange,
  onOpenCashDeposit,
  onResubmitCashDeposit,
}) => {
  const { transactionsQuery: walletTransactionsQuery } = walletApi;
  const themeColors = useColors();
  const styles = useMemo(() => getStyles(themeColors), [themeColors]);
  /** Small gap at end of list only; avoid stacking tab bar + inset + extra (feels huge). */
  const listBottomPadding = moderateScale(12);
  const { t, i18n, isRTL, language } = useTranslation();
  const collectionSummaryLabel =
    collectionLabelOverride ?? t("walletScreen.collection", "Collection");
  const collectionFilterChipLabel =
    collectionLabelOverride ??
    t("walletScreen.filter.collection", "Collection");
  const depositCashGradientColors = useMemo(
    () =>
      [
        themeColors.primary1,
        themeColors.primary,
        themeColors.secondary,
      ] as const,
    [themeColors.primary1, themeColors.primary, themeColors.secondary]
  );

  const {
    dateRange,
    isFilterModalVisible,
    isDatePickerVisible,
    handleOpenFilterModal,
    handleCloseFilterModal,
    handleOpenDatePicker,
    handleCloseDatePicker,
    handleFilterConfirm,
    handleFilterReset,
    handleDatePickerConfirm,
  } = useFilterDatePickerModals();
  const [filter, setFilter] = useState<"all" | "cashout" | "collection">("all");
  const effectiveDateRange = filterDateRange ?? dateRange;

  useEffect(() => {
    if (filterDateRange) {
      return;
    }
    onDateRangeChange?.(dateRange);
  }, [dateRange, filterDateRange, onDateRangeChange]);

  const openDateFilterModal = onOpenDateFilter ?? handleOpenFilterModal;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<WalletTransaction | null>(null);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);
  const pendingTransactionRef = useRef<WalletTransaction | null>(null);

  // Determine base wallet currency using same pattern as OrderPickupModal
  const savedCountryCode = mmkv.getString("userCountryCode"); // e.g. "PK" | "JO"
  const walletCurrencyCode = (() => {
    if (savedCountryCode === "JO") {
      return "JOD";
    }
    if (savedCountryCode === "PK") {
      return "PKR";
    }
    return "PKR";
  })();

  const currentBalance = useMemo(() => {
    const data = walletTransactionsQuery.data as
      | { pages: Array<{ data: { currentBalance?: number } }> }
      | undefined;

    if (!data?.pages?.length) {
      return 0;
    }

    const firstPageBalance = data.pages[0]?.data?.currentBalance;
    return typeof firstPageBalance === "number" ? firstPageBalance : 0;
  }, [walletTransactionsQuery.data]);

  const allTransactions = useMemo(() => {
    const data = walletTransactionsQuery.data as
      | { pages: Array<{ data: { items?: WalletTransactionItem[] } }> }
      | undefined;

    if (!data?.pages) {
      return [];
    }

    const items = data.pages.flatMap(
      (page) => page?.data?.items ?? []
    ) as WalletTransactionItem[];

    return items.map((raw, index): WalletTransaction => {
      const tx = raw;
      const id: string = String(tx.id ?? index);
      const typeRaw: string = String(tx.type ?? "").toLowerCase();
      // API types: cash_out, cash_in
      const type: "cashout" | "collection" =
        typeRaw === "cash_out" ||
        typeRaw === "cash-out" ||
        typeRaw === "cashout"
          ? "cashout"
          : "collection";

      const dateSource: string = String(
        tx.createdAt ?? tx.date ?? tx.transactionDate ?? ""
      );
      const formattedDate = dateSource
        ? formatOrderDate(dateSource, language)
        : dateSource;
      const formattedDateTime = dateSource
        ? formatOrderDateTime(dateSource, language)
        : dateSource;

      const statusRaw = String(tx.status ?? "").toLowerCase();
      let status: TransactionStatus = "pending";
      if (statusRaw === "rejected" || statusRaw === "reject") {
        status = "rejected";
      } else if (statusRaw === "approved" || statusRaw === "complete") {
        status = "approved";
      }

      const amountNumber: number =
        typeof tx.amount === "number"
          ? tx.amount
          : Number.parseFloat(String(tx.amount ?? "0"));

      // Use same currency pattern as rest of app (PKR/JOD based on country)
      const rawCurrency = String(tx.currency ?? "");
      const txCountryCode = String(tx.countryCode ?? "");

      // Resolve currency code without nested ternaries
      let resolvedCurrencyCode = walletCurrencyCode;
      if (rawCurrency) {
        resolvedCurrencyCode = rawCurrency;
      } else if (txCountryCode === "JO") {
        resolvedCurrencyCode = "JOD";
      } else if (txCountryCode === "PK") {
        resolvedCurrencyCode = "PKR";
      }

      const amountFormatted = formatCurrencyByCode(
        amountNumber || 0,
        resolvedCurrencyCode,
        true
      );

      const reference = readRiderWalletDisplayId(tx);

      // Resolve title: tx.title, or branchName { en, ar } for collection, or fallback
      let titleResolved: string = String(tx.title ?? "");
      if (!titleResolved && type === "collection") {
        const bn = (
          tx as { branchName?: string | { en?: string; ar?: string } }
        ).branchName;
        if (bn && typeof bn === "object" && ("en" in bn || "ar" in bn)) {
          const lang = i18n.language?.startsWith("ar") ? "ar" : "en";
          titleResolved =
            (bn as { ar?: string; en?: string })[lang] ??
            (bn as { en?: string }).en ??
            (bn as { ar?: string }).ar ??
            "";
        }
      }
      const title: string =
        titleResolved ||
        (type === "cashout"
          ? t("walletScreen.cash-out", "Cash out")
          : t("walletScreen.cash-in", "Cash in"));

      // Resolve rejectionReason: can be string or { ar, en } object
      let rejectionReasonResolved: string | null = null;
      const rr = tx.rejectionReason;
      if (typeof rr === "string" && rr) {
        rejectionReasonResolved = rr;
      } else if (rr && typeof rr === "object" && ("en" in rr || "ar" in rr)) {
        const lang = i18n.language?.startsWith("ar") ? "ar" : "en";
        const obj = rr as { ar?: string; en?: string };
        rejectionReasonResolved = obj[lang] ?? obj.en ?? obj.ar ?? null;
      }

      // For cash-out resubmit: API may return requestId or use id as the cash-out request ID
      const requestIdRaw =
        tx.requestId ?? (type === "cashout" ? tx.id : undefined);
      const requestId =
        requestIdRaw != null && String(requestIdRaw).trim() !== ""
          ? String(requestIdRaw)
          : undefined;

      return {
        id,
        requestId,
        type,
        title,
        reference,
        hideReference: tx.hideReference === true || !reference,
        date: formattedDate,
        dateTime: formattedDateTime,
        createdAt: dateSource || undefined,
        amount: amountFormatted,
        amountNumber: Number.isFinite(amountNumber) ? amountNumber : 0,
        currencyCode: resolvedCurrencyCode,
        status,
        rejectionReason: rejectionReasonResolved,
        proofImageUrl: tx.proofImageUrl ?? null,
      };
    });
  }, [
    walletTransactionsQuery.data,
    language,
    t,
    walletCurrencyCode,
    i18n.language,
  ]);

  // Apply date range filter client-side (same pattern as OrderScreen)
  const dateFilteredTransactions = useMemo(() => {
    const { startDate, endDate } = effectiveDateRange;
    if (!(startDate && endDate)) {
      return allTransactions;
    }

    const [startYear, startMonth, startDay] = startDate.split("-").map(Number);
    const [endYear, endMonth, endDay] = endDate.split("-").map(Number);

    const startDateObj = new Date(
      startYear,
      startMonth - 1,
      startDay,
      0,
      0,
      0,
      0
    );
    const endDateObj = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);

    return allTransactions.filter((tx) => {
      const dateSource = tx.createdAt;
      if (!dateSource) {
        return false;
      }
      const itemDate = new Date(dateSource);
      if (Number.isNaN(itemDate.getTime())) {
        return false;
      }
      return itemDate >= startDateObj && itemDate <= endDateObj;
    });
  }, [allTransactions, effectiveDateRange]);

  const summaryTotals = useMemo(() => {
    const { startDate, endDate } = effectiveDateRange;
    const hasDateFilter = !!(startDate && endDate);

    if (!hasDateFilter) {
      const firstPageData = (
        walletTransactionsQuery.data as
          | {
              pages: Array<{
                data?: {
                  allCash?: number;
                  collection?: number;
                  cashOut?: number;
                };
              }>;
            }
          | undefined
      )?.pages?.[0]?.data;

      if (
        firstPageData &&
        typeof firstPageData.collection === "number" &&
        typeof firstPageData.cashOut === "number"
      ) {
        return {
          allCash: currentBalance,
          collection: firstPageData.collection,
          cashOut: Math.abs(firstPageData.cashOut),
        };
      }
    }

    let collectionSum = 0;
    let cashOutSum = 0;
    const source = hasDateFilter ? dateFilteredTransactions : allTransactions;
    for (const tx of source) {
      if (tx.type === "collection") {
        collectionSum += tx.amountNumber;
      } else if (tx.type === "cashout") {
        cashOutSum += tx.amountNumber;
      }
    }
    return {
      allCash: currentBalance,
      collection: collectionSum,
      cashOut: Math.abs(cashOutSum),
    };
  }, [
    walletTransactionsQuery.data,
    allTransactions,
    dateFilteredTransactions,
    effectiveDateRange,
    currentBalance,
  ]);

  const filteredTransactions = useMemo(() => {
    if (filter === "all") {
      return dateFilteredTransactions;
    }
    return dateFilteredTransactions.filter((tx) => tx.type === filter);
  }, [dateFilteredTransactions, filter]);

  const openCashDepositScreen = useCallback(() => {
    onOpenCashDeposit?.();
  }, [onOpenCashDeposit]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    Promise.all([
      walletTransactionsQuery.refetch(),
      onPullToRefresh?.() ?? Promise.resolve(),
    ]).finally(() => {
      setIsRefreshing(false);
    });
  }, [walletTransactionsQuery.refetch, onPullToRefresh]);

  const handleRefetch = useCallback(() => {
    walletTransactionsQuery.refetch();
  }, [walletTransactionsQuery.refetch]);

  // Toast on API error (skip validation errors)
  useEffect(() => {
    const error = walletTransactionsQuery.error;
    if (!error) {
      return;
    }

    if (axios.isAxiosError(error)) {
      if (isValidationError(error)) {
        return;
      }
      const status = error.response?.status;
      if (status && status >= 400) {
        toastServerCode(error, "wallet_fetch_failed");
      }
    } else {
      toastServerCode(error, "wallet_fetch_failed");
    }
  }, [walletTransactionsQuery.error]);

  // Refetch wallet data when user switches to Wallet tab (screen gains focus)
  useFocusEffect(
    useCallback(() => {
      walletTransactionsQuery.refetch();
    }, [walletTransactionsQuery.refetch])
  );

  const getStatusLabel = (status: TransactionStatus) => {
    if (status === "pending") {
      return t("walletScreen.status-pending", "Pending");
    }
    if (status === "approved") {
      return t("walletScreen.status-approved", "Approved");
    }
    return t("walletScreen.status-reject", "Reject");
  };

  const renderStatusPill = (status: TransactionStatus) => {
    const label = getStatusLabel(status);
    if (status === "pending") {
      return (
        <View style={styles.statusPillPending}>
          <Ionicons
            name="time-outline"
            size={moderateScale(14)}
            color="#92400E"
          />
          <AppText style={styles.statusPillTextPending}>{label}</AppText>
        </View>
      );
    }
    if (status === "approved") {
      return (
        <View style={styles.statusPillApproved}>
          <Ionicons name="checkmark" size={moderateScale(14)} color="#065F46" />
          <AppText style={styles.statusPillTextApproved}>{label}</AppText>
        </View>
      );
    }
    return (
      <View style={styles.statusPillReject}>
        <Ionicons name="close" size={moderateScale(14)} color="#991B1B" />
        <AppText style={styles.statusPillTextReject}>{label}</AppText>
      </View>
    );
  };

  const handleResubmit = useCallback(
    (tx: WalletTransaction) => {
      setSelectedTransaction(null);
      onResubmitCashDeposit?.(tx);
    },
    [onResubmitCashDeposit]
  );

  const handleTransactionPress = useCallback((tx: WalletTransaction) => {
    setSelectedTransaction(tx);
  }, []);

  const handleOpenImageModal = useCallback(
    (imageUrl: string, transaction: WalletTransaction) => {
      pendingTransactionRef.current = transaction;
      setSelectedTransaction(null);
      setTimeout(() => {
        setImageModalUrl(imageUrl);
        setIsImageModalVisible(true);
      }, 300);
    },
    []
  );

  const handleCloseImageModal = useCallback(() => {
    const tx = pendingTransactionRef.current;
    setIsImageModalVisible(false);
    setImageModalUrl(null);
    pendingTransactionRef.current = null;
    setTimeout(() => {
      if (tx) {
        setSelectedTransaction(tx);
      }
    }, 300);
  }, []);

  const renderTransaction: ListRenderItem<WalletTransaction> = ({ item }) => {
    const isCashout = item.type === "cashout";
    const isRejected = item.status === "rejected";
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => handleTransactionPress(item)}
        style={styles.transactionCard}
      >
        <View style={styles.transactionTopRow}>
          <View style={styles.transRow}>
            <View style={styles.transactionTitleRow}>
              <MaterialCommunityIcons
                name={isCashout ? "cash-fast" : "credit-card-check-outline"}
                size={moderateScale(20)}
                color={themeColors.text}
              />
              <View style={styles.transactionInfo}>
                <AppText
                  style={styles.transactionTitle}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.title}
                </AppText>
              </View>
            </View>
            <View style={styles.transactionSpacer} />
            <View style={styles.transactionRightSection}>
              <View style={styles.transactionRightTop}>
                <AppText style={styles.transactionAmount}>
                  {formatCurrencyByCode(
                    item.amountNumber,
                    item.currencyCode || walletCurrencyCode,
                    true
                  )}
                </AppText>
                {item.type === "cashout" && renderStatusPill(item.status)}
              </View>
            </View>
          </View>
        </View>
        <View style={styles.transactionMetaSection}>
          {item.hideReference || !showTransactionReferenceRow ? null : (
            <AppText
              style={[styles.transactionMeta, styles.transactionMetaFirst]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.reference}
            </AppText>
          )}
          {isRejected ? (
            <>
              <View
                style={[
                  styles.transactionMetaRow,
                  isRTL && { flexDirection: "row-reverse" as const },
                ]}
              >
                <AppText
                  style={[styles.transactionMeta, styles.transactionMetaFlex]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.dateTime}
                </AppText>
                {!item.rejectionReason && (
                  <>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={styles.resubmitButtonInline}
                      onPress={() => handleResubmit(item)}
                    >
                      <AppText style={styles.resubmitButtonText}>
                        {t("walletScreen.re-submit", "Re-Submit")}
                      </AppText>
                    </TouchableOpacity>
                    <Ionicons
                      name="chevron-forward"
                      size={moderateScale(18)}
                      color={themeColors.textSecondary}
                      style={styles.transactionChevronInline}
                    />
                  </>
                )}
              </View>
              {item.rejectionReason ? (
                <View
                  style={[
                    styles.transactionMetaRow,
                    isRTL && { flexDirection: "row-reverse" as const },
                  ]}
                >
                  <AppText
                    style={[styles.rejectionReason, styles.transactionMetaFlex]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.rejectionReason}
                  </AppText>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.resubmitButtonInline}
                    onPress={() => handleResubmit(item)}
                  >
                    <AppText style={styles.resubmitButtonText}>
                      {t("walletScreen.re-submit", "Re-Submit")}
                    </AppText>
                  </TouchableOpacity>
                </View>
              ) : null}
            </>
          ) : (
            <View
              style={[
                styles.transactionMetaRow,
                isRTL && { flexDirection: "row-reverse" as const },
              ]}
            >
              <AppText
                style={[styles.transactionMeta, styles.transactionMetaFlex]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.dateTime}
              </AppText>
              <Ionicons
                name="chevron-forward"
                size={moderateScale(18)}
                color={themeColors.textSecondary}
                style={styles.transactionChevronInline}
              />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const fixedSummaryCards = useMemo(
    () => (
      <View style={styles.fixedSummaryCardsWrapper}>
        <View style={styles.summaryCardsRow}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryCardLabelWrapper}>
              <AppText
                style={styles.summaryCardLabel}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {t("walletScreen.all-cash", "All Cash")}
              </AppText>
            </View>
            <View style={styles.summaryCardAmountWrapper}>
              <AppText
                style={[
                  styles.summaryCardAmount,
                  (summaryTotals.allCash ?? 0) < 0 &&
                    styles.summaryCardAmountNegative,
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.5}
              >
                {formatCurrencyByCode(
                  summaryTotals.allCash || 0,
                  walletCurrencyCode,
                  true
                )}
              </AppText>
            </View>
          </View>
          <View style={styles.summaryCard}>
            <View style={styles.summaryCardLabelWrapper}>
              <AppText
                style={styles.summaryCardLabel}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {collectionSummaryLabel}
              </AppText>
            </View>
            <View style={styles.summaryCardAmountWrapper}>
              <AppText
                style={styles.summaryCardAmount}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.5}
              >
                {formatCurrencyByCode(
                  summaryTotals.collection || 0,
                  walletCurrencyCode,
                  true
                )}
              </AppText>
            </View>
          </View>
          <View style={styles.summaryCard}>
            <View style={styles.summaryCardLabelWrapper}>
              <AppText
                style={styles.summaryCardLabel}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {t("walletScreen.cash-out", "Cash Out")}
              </AppText>
            </View>
            <View style={styles.summaryCardAmountWrapper}>
              <AppText
                style={[
                  styles.summaryCardAmount,
                  (summaryTotals.cashOut ?? 0) < 0 &&
                    styles.summaryCardAmountNegative,
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.5}
              >
                {formatCurrencyByCode(
                  summaryTotals.cashOut || 0,
                  walletCurrencyCode,
                  true
                )}
              </AppText>
            </View>
          </View>
        </View>
      </View>
    ),
    [styles, summaryTotals, walletCurrencyCode, collectionSummaryLabel, t]
  );

  const filterChipsRow = useMemo(
    () => (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces={false}
        style={styles.filterRowScroll}
        contentContainerStyle={styles.filterRowContent}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.filterChip,
            filter === "all" && styles.filterChipActive,
          ]}
          onPress={() => setFilter("all")}
        >
          <AppText
            style={[
              styles.filterChipText,
              filter === "all" && styles.filterChipTextActive,
            ]}
            numberOfLines={1}
          >
            {t("walletScreen.filter.all", "All")}
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.filterChip,
            filter === "cashout" && styles.filterChipActive,
          ]}
          onPress={() => setFilter("cashout")}
        >
          <AppText
            style={[
              styles.filterChipText,
              filter === "cashout" && styles.filterChipTextActive,
            ]}
            numberOfLines={1}
          >
            {t("walletScreen.filter.cashout", "Cash out")}
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.filterChip,
            filter === "collection" && styles.filterChipActive,
          ]}
          onPress={() => setFilter("collection")}
        >
          <AppText
            style={[
              styles.filterChipText,
              filter === "collection" && styles.filterChipTextActive,
            ]}
            numberOfLines={1}
          >
            {collectionFilterChipLabel}
          </AppText>
        </TouchableOpacity>
      </ScrollView>
    ),
    [styles, t, filter, collectionFilterChipLabel]
  );

  const listHeaderComponent = useMemo(
    () => (
      <>
        {/* Recent Transactions */}
        <View style={styles.sectionHeader}>
          <SubHeader
            title={t("walletScreen.recent-transactions", "Recent Transactions")}
            containerStyle={styles.subHeaderContainer}
            iconRight={
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={openDateFilterModal}
              >
                <Ionicons
                  name="filter-outline"
                  size={moderateScale(20)}
                  color={colors.primaryRed}
                />
              </TouchableOpacity>
            }
          />
        </View>

        {filterChipsRow}
      </>
    ),
    [styles, t, openDateFilterModal, filterChipsRow]
  );

  const depositCashCta = useMemo(() => {
    if (!onOpenCashDeposit) {
      return null;
    }

    return (
      <View style={styles.depositCashSection}>
        <View style={styles.depositCashShadowWrap}>
          <TouchableOpacity
            activeOpacity={disableDepositCashCta ? 1 : 0.85}
            onPress={openCashDepositScreen}
            disabled={disableDepositCashCta}
            accessibilityRole="button"
            accessibilityLabel={t("walletScreen.add-cash", "Deposit Cash")}
            accessibilityHint={t(
              "walletScreen.deposit-cash-hint",
              "Add funds to your wallet balance"
            )}
            accessibilityState={{ disabled: disableDepositCashCta }}
          >
            <LinearGradient
              colors={depositCashGradientColors}
              locations={[0, 0.45, 1]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[
                styles.depositCashGradient,
                disableDepositCashCta && { opacity: 0.5 },
              ]}
            >
              <View
                style={[
                  styles.depositCashInner,
                  isRTL && { flexDirection: "row-reverse" as const },
                ]}
              >
                <Ionicons
                  name="add-circle"
                  size={moderateScale(22)}
                  color="#FFFFFF"
                />
                <AppText style={styles.depositCashButtonLabel}>
                  {t("walletScreen.add-cash", "Deposit Cash")}
                </AppText>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [
    onOpenCashDeposit,
    styles,
    t,
    openCashDepositScreen,
    isRTL,
    depositCashGradientColors,
    disableDepositCashCta,
  ]);

  const skeletonContent = (
    <>
      <View style={styles.walletTopCluster}>
        {depositCashCta}
        {hideSummaryCards ? null : (
          <View style={styles.fixedSummaryCardsWrapper}>
            <WalletSummarySkeleton />
          </View>
        )}
      </View>
      <ScrollView
        style={styles.walletFlatList}
        contentContainerStyle={[
          styles.listContent,
          styles.listContentFlex,
          { paddingBottom: listBottomPadding },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={true}
        refreshControl={
          swipeRefresh ? (
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={themeColors.primary}
              colors={[themeColors.primary]}
            />
          ) : undefined
        }
      >
        <View style={styles.sectionHeader}>
          <SubHeader
            title={t("walletScreen.recent-transactions", "Recent Transactions")}
            containerStyle={styles.subHeaderContainer}
            iconRight={
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={openDateFilterModal}
              >
                <Ionicons
                  name="filter-outline"
                  size={moderateScale(20)}
                  color={colors.primaryRed}
                />
              </TouchableOpacity>
            }
          />
        </View>
        {filterChipsRow}
        {[1, 2, 3, 4].map((index) => (
          <WalletTransactionSkeleton key={`skeleton-${index}`} />
        ))}
      </ScrollView>
    </>
  );

  // Show error screen for API failures (skip validation errors)
  const hasNonValidationError =
    walletTransactionsQuery.isError &&
    walletTransactionsQuery.error &&
    !isValidationError(walletTransactionsQuery.error);

  if (hasNonValidationError) {
    return (
      <View style={styles.container}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: moderateScale(24),
          }}
        >
          <AppText
            style={{
              color: colors.primaryRed,
              textAlign: "center",
              marginBottom: moderateScale(16),
            }}
          >
            {t(
              "walletScreen.load-transactions-error",
              "Failed to load wallet transactions. Please try again."
            )}
          </AppText>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleRefetch}
            style={{
              paddingHorizontal: moderateScale(24),
              paddingVertical: moderateScale(12),
              borderRadius: moderateScale(12),
              backgroundColor: colors.primaryRed,
            }}
          >
            <AppText style={{ color: "#fff", fontFamily: fonts.button }}>
              {t("common.try-again", "Try again")}
            </AppText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {walletTransactionsQuery.isLoading && !hasNonValidationError ? (
        skeletonContent
      ) : (
        <>
          <View style={styles.walletTopCluster}>
            {depositCashCta}
            {hideSummaryCards ? null : fixedSummaryCards}
          </View>
          <FlatList
            data={filteredTransactions}
            keyExtractor={(item) => item.id}
            renderItem={renderTransaction}
            ListHeaderComponent={listHeaderComponent}
            style={styles.walletFlatList}
            contentContainerStyle={[
              styles.listContent,
              styles.listContentFlex,
              { paddingBottom: listBottomPadding },
            ]}
            showsVerticalScrollIndicator={false}
            bounces={true}
            ListEmptyComponent={
              walletTransactionsQuery.isLoading ? null : (
                <EmptyState
                  iconLibrary="ionicons"
                  iconName="wallet-outline"
                  title={t("walletScreen.empty-title", "No transactions yet")}
                  description={t(
                    "walletScreen.empty-subtitle",
                    "Your wallet activity will appear here once you start receiving transactions."
                  )}
                />
              )
            }
            onEndReached={() => {
              if (
                walletTransactionsQuery.hasNextPage &&
                !walletTransactionsQuery.isFetchingNextPage
              ) {
                walletTransactionsQuery.fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.4}
            refreshControl={
              swipeRefresh ? (
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  tintColor={themeColors.primary}
                  colors={[themeColors.primary]}
                />
              ) : undefined
            }
          />
        </>
      )}

      <WalletModals
        selectedTransaction={selectedTransaction}
        onCloseTransaction={() => setSelectedTransaction(null)}
        onResubmit={handleResubmit}
        onOpenImageModal={handleOpenImageModal}
        renderStatusPill={renderStatusPill}
        walletCurrencyCode={walletCurrencyCode}
        isImageModalVisible={isImageModalVisible}
        imageModalUrl={imageModalUrl}
        onCloseImageModal={handleCloseImageModal}
        isFilterModalVisible={hideDateFilterModals ? false : isFilterModalVisible}
        isDatePickerVisible={hideDateFilterModals ? false : isDatePickerVisible}
        dateRange={effectiveDateRange}
        onCloseFilterModal={handleCloseFilterModal}
        onFilterConfirm={handleFilterConfirm}
        onFilterReset={handleFilterReset}
        onOpenDatePicker={handleOpenDatePicker}
        onCloseDatePicker={handleCloseDatePicker}
        onDatePickerConfirm={handleDatePickerConfirm}
        showTransactionReferenceRow={showTransactionReferenceRow}
      />
    </View>
  );
};

export default Wallet;
