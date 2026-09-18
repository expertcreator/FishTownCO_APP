import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet } from "react-native";
import { colors } from "@/constants/theme";
import {
  AppText,
  BackHeader,
  Card,
  Field,
  PrimaryButton,
  Screen,
} from "@/shared/components";
import { useTranslation } from "@/shared/translations";

/**
 * Reset Password screen matching prototype screen 7.
 * @returns Reset password UI
 */
export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <Screen>
      <BackHeader
        title={t("auth.reset-title")}
        subtitle={t("auth.reset-subtitle")}
      />

      <Card style={styles.card}>
        {sent ? (
          <AppText style={styles.sent}>{t("auth.reset-sent")}</AppText>
        ) : (
          <>
            <Field
              label={t("auth.email-address")}
              icon="mail-outline"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="skipper@northernstar.co.uk"
            />
            <PrimaryButton
              label={t("auth.send-reset-link")}
              onPress={() => setSent(true)}
            />
          </>
        )}
      </Card>

      <AppText style={styles.footer}>
        <AppText style={styles.link} onPress={() => router.replace("/(auth)/login")}>
          {t("auth.back-to-login")}
        </AppText>
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: 14 },
  sent: { color: colors.navy, fontSize: 15, lineHeight: 22 },
  footer: { textAlign: "center", marginTop: 22 },
  link: {
    color: colors.teal,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});
