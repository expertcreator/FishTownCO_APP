import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { AppState, BackHandler, Pressable, StyleSheet, View } from "react-native";
import Purchases, { type PurchasesPackage } from "react-native-purchases";
import type { BillingPlanId } from "@/features/billing/types/billing";
import { getCurrentUser } from "@/features/common/firebase";
import type { LegalDocument } from "@/features/common/legal/policyLinks";
import {
  configurePurchases,
  PREMIUM_ENTITLEMENT_ID,
} from "@/features/subscription/services/configurePurchases";
import {
  canUseApp,
  fetchSubscriptionAccess,
  isTrialActive,
  notifySubscriptionAccessChanged,
  startFreeTrial,
  type SubscriptionAccess,
} from "@/features/subscription/services/subscriptionAccess";
import { useColors, type ThemeColors } from "@/ui/theme";
import {
  AppHeader,
  AppHeaderActions,
  AppText,
  BackHeader,
  CARD_RIPPLE,
  Card,
  getPressedItemStyle,
  LegalPolicyModal,
  PrimaryButton,
  Screen,
  useToast,
} from "@/ui/components";
import { useTranslation } from "@/ui/translations";

/**
 * Matches the RevenueCat monthly package. Product ids use "monthly".
 * @param pkg - Offering package
 * @returns Whether this is the monthly plan
 */
function isMonthlyPackage(pkg: PurchasesPackage): boolean {
  const id = `${pkg.identifier} ${pkg.product.identifier}`.toLowerCase();
  return pkg.packageType === "MONTHLY" || id.includes("month");
}

/**
 * Matches the RevenueCat yearly package. The offering calls it yearly.
 * @param pkg - Offering package
 * @returns Whether this is the annual plan
 */
function isAnnualPackage(pkg: PurchasesPackage): boolean {
  const id = `${pkg.identifier} ${pkg.product.identifier}`.toLowerCase();
  return pkg.packageType === "ANNUAL" || /year|annual/.test(id);
}

const PLANS = [
  {
    id: "annual" as const,
    titleKey: "subscription.annual-title",
    priceKey: "subscription.annual-price",
    noteKey: "subscription.annual-note",
  },
  {
    id: "monthly" as const,
    titleKey: "subscription.monthly-title",
    priceKey: "subscription.monthly-price",
    noteKey: "subscription.monthly-note",
  },
] as const;

/**
 * Subscription screen matching prototype screen 10.
 * Buys a plan or starts the 7-day free trial.
 * @returns Subscription plan picker UI
 */
export default function SubscriptionScreen() {
  return <SubscriptionForm />;
}

/**
 * Plan picker and RevenueCat purchase form.
 * @returns Subscription form
 */
function SubscriptionForm() {
  const colors = useColors();
  const styles = getStyles(colors);
  const { t } = useTranslation();
  const toast = useToast();

  const [plan, setPlan] = useState<BillingPlanId>("monthly");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [monthlyPackage, setMonthlyPackage] = useState<PurchasesPackage | null>(null);
  const [annualPackage, setAnnualPackage] = useState<PurchasesPackage | null>(null);
  /** True once the offerings request has finished, whether or not it found plans. */
  const [offeringsLoaded, setOfferingsLoaded] = useState(false);
  const [access, setAccess] = useState<SubscriptionAccess | null>(null);
  const [startingTrial, setStartingTrial] = useState(false);
  const [legalDocument, setLegalDocument] = useState<LegalDocument | null>(null);
  const locked = access !== null && !canUseApp(access) && !isTrialActive(access) && Boolean(access.trialStartedAt);
  const canStartTrial = access !== null && !access.trialStartedAt;
  /** No trial or payment yet, so Settings is the only way to log out or delete. */
  const showSettings = access !== null && !canUseApp(access);

  /**
   * Loads the monthly and annual plans with their store prices from RevenueCat.
   * Safe to call again after a failed load (slow or no internet).
   * @returns The plans found, or nulls when the store could not be reached
   */
  const loadOfferings = useCallback(async () => {
    setOfferingsLoaded(false);
    let monthly: PurchasesPackage | null = null;
    let annual: PurchasesPackage | null = null;
    try {
      const offerings = await Purchases.getOfferings();
      const packages = offerings.current?.availablePackages ?? [];
      monthly = packages.find((pkg) => isMonthlyPackage(pkg)) ?? null;
      annual = packages.find((pkg) => isAnnualPackage(pkg)) ?? null;
    } catch (error) {
      console.log("[RevenueCat] Failed to fetch offerings", error);
    }
    if (monthly) setMonthlyPackage(monthly);
    if (annual) setAnnualPackage(annual);
    setOfferingsLoaded(true);
    return { monthly, annual };
  }, []);

  // Fetch offerings from RevenueCat when screen loads
  useEffect(() => {
    void loadOfferings();
    void fetchSubscriptionAccess()
      .then(setAccess)
      .catch(() => setAccess(null));
  }, [loadOfferings]);

  useEffect(() => {
    if (!locked) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => sub.remove();
  }, [locked]);

  /** A plan's price could not be loaded, so offer a retry. */
  const pricesMissing = offeringsLoaded && (!monthlyPackage || !annualPackage);

  // Try again when the user comes back to the app, e.g. after turning Wi-Fi on.
  useEffect(() => {
    if (!pricesMissing) return;
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void loadOfferings();
    });
    return () => sub.remove();
  }, [pricesMissing, loadOfferings]);

  /**
   * Store price for a plan in the buyer's currency, e.g. "£10.00 / month".
   * Matches what the Apple or Google payment sheet will charge.
   * @param planId - Monthly or annual
   * @param priceKey - Text with a {{price}} slot
   * @returns Price text, or a loading / unavailable message
   */
  const planPrice = (planId: BillingPlanId, priceKey: string) => {
    const pkg = planId === "annual" ? annualPackage : monthlyPackage;
    const price = pkg?.product.priceString;
    if (price) return t(priceKey, { price });
    return offeringsLoaded
      ? t("subscription.price-unavailable")
      : t("subscription.price-loading");
  };

  const selectedPrice = (plan === "annual" ? annualPackage : monthlyPackage)
    ?.product.priceString;
  const subscribeLabel = selectedPrice
    ? t(
        plan === "monthly"
          ? "subscription.start-monthly"
          : "subscription.start-annual",
        { price: selectedPrice }
      )
    : t("subscription.start");

  /**
   * Records the 7-day trial once, then opens Home.
   * @returns Promise that resolves when navigation starts or a toast is shown
   */
  const onStartTrial = async () => {
    if (startingTrial || isSubmitting) return;
    setStartingTrial(true);
    try {
      await startFreeTrial();
      router.replace("/(tabs)/home");
    } catch (error) {
      toast.error(
        error instanceof Error && error.message === "NOT_SIGNED_IN"
          ? t("subscription.sign-in-required")
          : t("subscription.payment-failed")
      );
      setStartingTrial(false);
    }
  };

  const onStart = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await configurePurchases(getCurrentUser()?.uid ?? null);
      let targetPackage = plan === "annual" ? annualPackage : monthlyPackage;
      if (!targetPackage) {
        // Prices may have failed to load on a slow connection; try once more.
        const loaded = await loadOfferings();
        targetPackage = plan === "annual" ? loaded.annual : loaded.monthly;
      }

      if (!targetPackage) {
        console.log("[RevenueCat] package missing", plan);
        toast.error(t("subscription.prices-unavailable"));
        setIsSubmitting(false);
        return;
      }

      console.log("[RevenueCat] Purchasing package:", targetPackage.identifier);
      const { customerInfo } = await Purchases.purchasePackage(targetPackage);
      const premium = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID];

      if (premium) {
        console.log("[RevenueCat] Purchase successful");
        notifySubscriptionAccessChanged({ storePaid: true });
        toast.success(t("subscription.start-success"));
        router.replace("/(tabs)/home");
      } else {
        throw new Error("PURCHASE_NOT_ACTIVE");
      }
    } catch (error: unknown) {
      const cancelled =
        typeof error === "object" &&
        error !== null &&
        "userCancelled" in error &&
        Boolean((error as { userCancelled?: boolean }).userCancelled);
      if (cancelled) {
        setIsSubmitting(false);
        return;
      }
      console.log("[RevenueCat] Purchase failed", error instanceof Error ? error.message : error);
      toast.error(t("subscription.payment-failed"));
      setIsSubmitting(false);
    }
  };

  return (
    <Screen
      header={
        locked ? (
          <AppHeader title={t("subscription.title")} />
        ) : (
          <BackHeader
            title={t("subscription.title")}
            subtitle={t("subscription.subtitle")}
            right={showSettings ? <AppHeaderActions /> : undefined}
          />
        )
      }
    >
      {locked ? (
        <AppText style={styles.trialEnded}>{t("subscription.trial-ended")}</AppText>
      ) : null}
      {PLANS.map((p) => {
        const selected = plan === p.id;
        return (
          <Pressable
            key={p.id}
            onPress={() => setPlan(p.id)}
            android_ripple={CARD_RIPPLE}
            style={({ pressed }) => [getPressedItemStyle(pressed)]}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
          >
            <Card style={[styles.plan, selected && styles.planOn]}>
              <View style={styles.planTop}>
                <AppText style={styles.planTitle}>{t(p.titleKey)}</AppText>
                <View style={[styles.radio, selected && styles.radioOn]} />
              </View>
              <AppText style={styles.price}>{planPrice(p.id, p.priceKey)}</AppText>
              <AppText style={styles.note}>{t(p.noteKey)}</AppText>
            </Card>
          </Pressable>
        );
      })}

      {pricesMissing ? (
        <Pressable
          onPress={() => void loadOfferings()}
          style={({ pressed }) => [getPressedItemStyle(pressed)]}
          accessibilityRole="button"
        >
          <AppText style={styles.retry}>{t("subscription.prices-retry")}</AppText>
        </Pressable>
      ) : null}

      <Card style={styles.perks}>
        <AppText style={styles.perk}>{t("subscription.perk-1")}</AppText>
        <AppText style={styles.perk}>{t("subscription.perk-2")}</AppText>
        <AppText style={styles.perk}>{t("subscription.perk-3")}</AppText>
      </Card>

      <PrimaryButton
        label={subscribeLabel}
        loading={isSubmitting}
        onPress={() => void onStart()}
      />
      {canStartTrial ? (
        <Pressable
          disabled={isSubmitting || startingTrial}
          onPress={() => void onStartTrial()}
          style={({ pressed }) => [getPressedItemStyle(pressed)]}
          accessibilityRole="button"
        >
          <AppText style={styles.skip}>{t("subscription.trial")}</AppText>
        </Pressable>
      ) : null}
      <AppText style={styles.legal}>
        {t("subscription.agree-prefix")}{" "}
        <AppText
          style={styles.legalLink}
          onPress={() => setLegalDocument("terms")}
        >
          {t("subscription.terms")}
        </AppText>
        {" & "}
        <AppText
          style={styles.legalLink}
          onPress={() => setLegalDocument("privacy")}
        >
          {t("subscription.privacy")}
        </AppText>
      </AppText>
      <LegalPolicyModal
        document={legalDocument}
        onClose={() => setLegalDocument(null)}
      />
    </Screen>
  );
}

/**
 * Builds subscription screen styles for the active palette.
 * @param colors - Active theme colors
 * @returns Style sheet
 */
function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    plan: { marginBottom: 12, gap: 6 },
    planOn: { borderColor: colors.orange, borderWidth: 2 },
    planTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    planTitle: { color: colors.navy, fontWeight: "800", fontSize: 16 },
    radio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.border,
    },
    radioOn: {
      borderColor: colors.orange,
      backgroundColor: colors.orange,
    },
    price: { color: colors.orange, fontSize: 24, fontWeight: "800" },
    note: { color: colors.muted, fontSize: 13 },
    perks: { marginBottom: 16, gap: 8 },
    perk: { color: colors.navy, fontSize: 14 },
    trialEnded: {
      color: colors.navy,
      fontSize: 15,
      fontWeight: "700",
      marginBottom: 14,
    },
    skip: {
      textAlign: "center",
      color: colors.teal,
      marginTop: 14,
      fontWeight: "700",
      textDecorationLine: "underline",
    },
    retry: {
      textAlign: "center",
      color: colors.teal,
      fontSize: 13,
      fontWeight: "700",
      textDecorationLine: "underline",
      marginBottom: 14,
    },
    legal: {
      textAlign: "center",
      color: colors.muted,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 18,
    },
    legalLink: {
      color: colors.teal,
      fontSize: 12,
      fontWeight: "700",
      textDecorationLine: "underline",
    },
  });
}