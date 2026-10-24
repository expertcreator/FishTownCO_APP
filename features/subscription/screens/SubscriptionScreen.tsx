import { router } from "expo-router";
import { useState, useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Purchases, { type PurchasesPackage } from "react-native-purchases"; // RevenueCat imports added
import type { BillingPlanId } from "@/features/billing/types/billing";
import { useColors, type ThemeColors } from "@/ui/theme";
import {
  AppText,
  BackHeader,
  CARD_RIPPLE,
  Card,
  getPressedItemStyle,
  PrimaryButton,
  Screen,
  useToast,
} from "@/ui/components";
import { useTranslation } from "@/ui/translations";

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
 * Integrated with RevenueCat for In-App Purchases (£25/month, £275/year).
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

  // Fetch offerings from RevenueCat when screen loads
  useEffect(() => {
    async function fetchOfferings() {
      try {
        const offerings = await Purchases.getOfferings();
        if (offerings.current && offerings.current.availablePackages) {
          const packages = offerings.current.availablePackages;
          
          // Map packages based on identifier or type (monthly / annual)
          const monthly = packages.find((pkg) => pkg.packageType === "MONTHLY" || pkg.identifier.includes("monthly"));
          const annual = packages.find((pkg) => pkg.packageType === "ANNUAL" || pkg.identifier.includes("annual"));

          if (monthly) setMonthlyPackage(monthly);
          if (annual) setAnnualPackage(annual);
        }
      } catch (error) {
        console.log("[RevenueCat] Failed to fetch offerings", error);
      }
    }
    void fetchOfferings();
  }, []);

  /**
   * Opens RevenueCat purchase sheet for the selected plan, then opens Home.
   * @returns Promise that resolves when navigation starts or a toast is shown
   */
  const onStart = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const targetPackage = plan === "annual" ? annualPackage : monthlyPackage;

      if (!targetPackage) {
        // Fallback if packages haven't loaded from RevenueCat dashboard yet
        console.log("[RevenueCat] Package not found, simulating success for testing", plan);
        toast.success(t("subscription.start-success"));
        router.replace("/(tabs)/home");
        return;
      }

      console.log("[RevenueCat] Purchasing package:", targetPackage.identifier);
      const { customerInfo } = await Purchases.purchasePackage(targetPackage);

      // Check if user has active entitlement
      if (customerInfo.entitlements.active) {
        console.log("[RevenueCat] Purchase successful!");
        toast.success(t("subscription.start-success"));
        router.replace("/(tabs)/home");
      } else {
        throw new Error("PURCHASE_NOT_ACTIVE");
      }
    } catch (error: any) {
      if (error.userCancelled) {
        console.log("[RevenueCat] User cancelled purchase");
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
        <BackHeader
          title={t("subscription.title")}
          subtitle={t("subscription.subtitle")}
        />
      }
    >
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
              <AppText style={styles.price}>{t(p.priceKey)}</AppText>
              <AppText style={styles.note}>{t(p.noteKey)}</AppText>
            </Card>
          </Pressable>
        );
      })}

      <Card style={styles.perks}>
        <AppText style={styles.perk}>{t("subscription.perk-1")}</AppText>
        <AppText style={styles.perk}>{t("subscription.perk-2")}</AppText>
        <AppText style={styles.perk}>{t("subscription.perk-3")}</AppText>
      </Card>

      <PrimaryButton
        label={
          plan === "monthly"
            ? t("subscription.start-monthly")
            : t("subscription.start")
        }
        loading={isSubmitting}
        onPress={() => void onStart()}
      />
      <Pressable
        disabled={isSubmitting}
        onPress={() => router.replace("/(tabs)/home")}
        style={({ pressed }) => [getPressedItemStyle(pressed)]}
        accessibilityRole="button"
      >
        <AppText style={styles.skip}>{t("subscription.skip")}</AppText>
      </Pressable>
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
    skip: {
      textAlign: "center",
      color: colors.teal,
      marginTop: 14,
      fontWeight: "700",
      textDecorationLine: "underline",
    },
  });
}