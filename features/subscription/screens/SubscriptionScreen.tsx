import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/constants/theme";
import {
  BackHeader,
  Card,
  PrimaryButton,
  Screen,
} from "@/features/common/ui";
import { useTranslation } from "@/shared/translations";

const PLANS = [
  {
    id: "annual",
    titleKey: "subscription.annual-title",
    priceKey: "subscription.annual-price",
    noteKey: "subscription.annual-note",
  },
  {
    id: "monthly",
    titleKey: "subscription.monthly-title",
    priceKey: "subscription.monthly-price",
    noteKey: "subscription.monthly-note",
  },
] as const;

/**
 * Subscription screen matching prototype screen 10.
 * @returns Subscription plan picker UI
 */
export default function SubscriptionScreen() {
  const { t } = useTranslation();
  const [plan, setPlan] = useState<(typeof PLANS)[number]["id"]>("annual");

  return (
    <Screen>
      <BackHeader
        title={t("subscription.title")}
        subtitle={t("subscription.subtitle")}
      />

      {PLANS.map((p) => {
        const selected = plan === p.id;
        return (
          <Pressable key={p.id} onPress={() => setPlan(p.id)}>
            <Card style={[styles.plan, selected && styles.planOn]}>
              <View style={styles.planTop}>
                <Text style={styles.planTitle}>{t(p.titleKey)}</Text>
                <View style={[styles.radio, selected && styles.radioOn]} />
              </View>
              <Text style={styles.price}>{t(p.priceKey)}</Text>
              <Text style={styles.note}>{t(p.noteKey)}</Text>
            </Card>
          </Pressable>
        );
      })}

      <Card style={styles.perks}>
        <Text style={styles.perk}>{t("subscription.perk-1")}</Text>
        <Text style={styles.perk}>{t("subscription.perk-2")}</Text>
        <Text style={styles.perk}>{t("subscription.perk-3")}</Text>
      </Card>

      <PrimaryButton
        label={t("subscription.start")}
        onPress={() => router.replace("/(tabs)/home")}
      />
      <Pressable onPress={() => router.replace("/(tabs)/home")}>
        <Text style={styles.skip}>{t("subscription.skip")}</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
