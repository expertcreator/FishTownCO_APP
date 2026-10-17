import { StripeProvider, useStripe } from "@stripe/stripe-react-native";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import {
  createSubscriptionSheet,
  recordSubscriptionPayment,
} from "@/features/subscription/services/startStripeSubscription";
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

const STRIPE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

/**
 * Subscription screen matching prototype screen 10.
 * Starting a plan opens the Stripe card sheet, then Home.
 * @returns Subscription plan picker UI
 */
export default function SubscriptionScreen() {
  return (
    <StripeProvider
      publishableKey={STRIPE_PUBLISHABLE_KEY}
      merchantIdentifier="merchant.com.itoasis.Fishtownco"
      urlScheme="fishtownco"
    >
      <SubscriptionForm />
    </StripeProvider>
  );
}

/**
 * Plan picker and Stripe Payment Sheet.
 * @returns Subscription form
 */
function SubscriptionForm() {
  const colors = useColors();
  const styles = getStyles(colors);
  const { t } = useTranslation();
  const toast = useToast();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  /** Prototype defaults to the Skipper Plan (£10/month). */
  const [plan, setPlan] = useState<BillingPlanId>("monthly");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Opens the Stripe card sheet for the selected plan, then opens Home.
   * @returns Promise that resolves when navigation starts or a toast is shown
   */
  const onStart = async () => {
    if (isSubmitting) return;
    if (!STRIPE_PUBLISHABLE_KEY) {
      console.log("[Payment] missing publishable key");
      toast.error(t("subscription.payment-failed"));
      return;
    }
    setIsSubmitting(true);
    try {
      console.log("[Payment] start", plan);
      const sheet = await createSubscriptionSheet(plan);
      console.log("[Payment] sheet", {
        alreadyActive: sheet.alreadyActive,
        hasCustomer: Boolean(sheet.customerId),
        hasEphemeralKey: Boolean(sheet.ephemeralKey),
        hasPaymentSecret: Boolean(sheet.paymentIntentClientSecret),
        subscriptionId: sheet.subscriptionId ?? "",
      });
      if (!sheet.alreadyActive) {
        if (
          !sheet.customerId ||
          !sheet.ephemeralKey ||
          !sheet.paymentIntentClientSecret ||
          !sheet.subscriptionId
        ) {
          throw new Error("PAYMENT_NOT_READY");
        }
        const init = await initPaymentSheet({
          merchantDisplayName: "Fishtownco",
          customerId: sheet.customerId,
          customerEphemeralKeySecret: sheet.ephemeralKey,
          paymentIntentClientSecret: sheet.paymentIntentClientSecret,
          returnURL: "fishtownco://stripe-redirect",
        });
        if (init.error) {
          console.log("[Payment] init sheet failed", init.error.code, init.error.message);
          throw new Error(init.error.message);
        }
        const presented = await presentPaymentSheet();
        if (presented.error) {
          console.log("[Payment] sheet closed", presented.error.code, presented.error.message);
          if (presented.error.code === "Canceled") {
            setIsSubmitting(false);
            return;
          }
          throw new Error(presented.error.message);
        }
        console.log("[Payment] card accepted", sheet.subscriptionId);
        await recordSubscriptionPayment(sheet.subscriptionId);
      }
      toast.success(
        sheet.alreadyActive
          ? t("subscription.already-subscribed")
          : t("subscription.start-success")
      );
      router.replace("/(tabs)/home");
    } catch (error) {
      console.log(
        "[Payment] failed",
        error instanceof Error ? error.message : error
      );
      const code = error instanceof Error ? error.message : "";
      if (code === "NOT_SIGNED_IN") {
        toast.error(t("subscription.sign-in-required"));
      } else {
        toast.error(t("subscription.payment-failed"));
      }
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
