import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useColors, type ThemeColors } from "@/ui/theme";
import {
  AppText,
  BackHeader,
  Card,
  Field,
  OutlineButton,
  PrimaryButton,
  Screen,
} from "@/ui/components";
import { useTranslation } from "@/ui/translations";

/**
 * Create Account screen matching prototype screen 6.
 * @returns Create account UI
 */
export default function CreateAccountScreen() {
  const colors = useColors();
  const styles = getStyles(colors);

  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);

  return (
    <Screen>
      <BackHeader
        title={t("auth.create-account-title")}
        subtitle={t("auth.create-account-subtitle")}
      />

      <Card style={styles.card}>
        <Field
          label={t("auth.full-name")}
          icon="id-card-outline"
          value={name}
          onChangeText={setName}
          placeholder="Capt. John Davies"
        />
        <Field
          label={t("auth.email-address")}
          icon="mail-outline"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="skipper@northernstar.co.uk"
        />
        <Field
          label={t("auth.password")}
          icon="lock-closed-outline"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          secureToggle
          placeholder="••••••••••••"
        />
        <AppText style={styles.hint}>{t("auth.password-hint")}</AppText>

        <Pressable
          style={styles.agreeRow}
          onPress={() => setAgreed((v) => !v)}
        >
          <View style={[styles.checkbox, agreed && styles.checkboxOn]} />
          <AppText style={styles.agreeText}>
            {t("auth.agree-prefix")}{" "}
            <AppText style={styles.link}>{t("auth.terms")}</AppText> {t("auth.and")}{" "}
            <AppText style={styles.link}>{t("auth.privacy")}</AppText>
          </AppText>
        </Pressable>

        <PrimaryButton
          label={t("auth.create-account")}
          icon="boat-outline"
          disabled={!agreed}
          onPress={() => router.push("/vessel/setup")}
        />
      </Card>

      <AppText style={styles.or}>{t("auth.or-continue-with")}</AppText>
      <OutlineButton label={t("auth.continue-apple")} icon="logo-apple" />
      <OutlineButton
        label={t("auth.continue-google")}
        icon="logo-google"
        style={styles.gap}
      />

      <AppText style={styles.footer}>
        {t("auth.already-have-account")}{" "}
        <AppText style={styles.link} onPress={() => router.replace("/(auth)/login")}>
          {t("auth.log-in")}
        </AppText>
      </AppText>
    </Screen>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
  card: { gap: 14, marginBottom: 18 },
  hint: { color: colors.muted, fontSize: 12, marginTop: -4 },
  agreeRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    marginTop: 2,
    backgroundColor: colors.card,
  },
  checkboxOn: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  agreeText: { flex: 1, color: colors.navy, fontSize: 13, lineHeight: 18 },
  link: { color: colors.teal, fontWeight: "700", textDecorationLine: "underline" },
  or: {
    textAlign: "center",
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 12,
  },
  gap: { marginTop: 10 },
  footer: {
    textAlign: "center",
    color: colors.navy,
    marginTop: 22,
    fontSize: 14,
  },
});
}
