import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { mapAuthError } from "@/features/auth/utils/mapAuthError";
import { createBillingPayment } from "@/features/billing/services/createBillingPayment";
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
 * Starting a plan writes a Paid billing row, then opens Home.
 * @returns Subscription plan picker UI
 */
export default function SubscriptionScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const { t } = useTranslation();
  const toast = useToast();
  /** Prototype defaults to the Skipper Plan (£10/month). */
  const [plan, setPlan] = useState<BillingPlanId>("monthly");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Records the selected plan payment in Firestore, then opens Home.
   * @returns Promise that resolves when navigation starts or a toast is shown
   */
  const onStart = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await createBillingPayment({ planId: plan, status: "Paid" });
      toast.success(t("subscription.start-success"));
      router.replace("/(tabs)/home");
    } catch (error) {
      console.error("[SubscriptionScreen] start failed", error);
      if (error instanceof Error && error.message === "NOT_SIGNED_IN") {
        toast.error(t("subscription.sign-in-required"));
      } else {
        toast.error(mapAuthError(error, t));
      }
      setIsSubmitting(false);
    }
  };

  return (
    <Screen>
      <BackHeader
        title={t("subscription.title")}
        subtitle={t("subscription.subtitle")}
      />

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
