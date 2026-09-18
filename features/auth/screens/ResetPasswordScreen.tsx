import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { colors } from "@/constants/theme";
import {
  BackHeader,
  Card,
  Field,
  PrimaryButton,
  Screen,
} from "@/features/common/ui";
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
          <Text style={styles.sent}>{t("auth.reset-sent")}</Text>
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

      <Text style={styles.footer}>
        <Text style={styles.link} onPress={() => router.replace("/(auth)/login")}>
          {t("auth.back-to-login")}
        </Text>
      </Text>
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
