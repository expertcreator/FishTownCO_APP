import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/constants/theme";
import {
  BackHeader,
  Card,
  Field,
  OutlineButton,
  PrimaryButton,
  Screen,
} from "@/features/common/ui";
import { useTranslation } from "@/shared/translations";

/**
 * Create Account screen matching prototype screen 6.
 * @returns Create account UI
 */
export default function CreateAccountScreen() {
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
        <Text style={styles.hint}>{t("auth.password-hint")}</Text>

        <Pressable
          style={styles.agreeRow}
          onPress={() => setAgreed((v) => !v)}
        >
          <View style={[styles.checkbox, agreed && styles.checkboxOn]} />
          <Text style={styles.agreeText}>
            {t("auth.agree-prefix")}{" "}
            <Text style={styles.link}>{t("auth.terms")}</Text> {t("auth.and")}{" "}
            <Text style={styles.link}>{t("auth.privacy")}</Text>
          </Text>
        </Pressable>

        <PrimaryButton
          label={t("auth.create-account")}
          icon="boat-outline"
          disabled={!agreed}
          onPress={() => router.push("/vessel-setup")}
        />
      </Card>

      <Text style={styles.or}>{t("auth.or-continue-with")}</Text>
      <OutlineButton label={t("auth.continue-apple")} icon="logo-apple" />
      <OutlineButton
        label={t("auth.continue-google")}
        icon="logo-google"
        style={styles.gap}
      />

      <Text style={styles.footer}>
        {t("auth.already-have-account")}{" "}
        <Text style={styles.link} onPress={() => router.replace("/(auth)/login")}>
          {t("auth.log-in")}
        </Text>
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: colors.white,
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
