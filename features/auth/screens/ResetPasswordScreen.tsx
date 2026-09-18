import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { StyleSheet } from "react-native";
import { useColors, type ThemeColors } from "@/ui/theme";
import {
  AppText,
  BackHeader,
  Card,
  FormField,
  PrimaryButton,
  Screen,
} from "@/ui/components";
import { useTranslation } from "@/ui/translations";
import {
  createResetPasswordSchema,
  type ResetPasswordSchema,
} from "@/features/auth/validation/authSchema";

/**
 * Reset Password screen matching prototype screen 7.
 * @returns Reset password UI
 */
export default function ResetPasswordScreen() {
  const colors = useColors();
  const styles = getStyles(colors);

  const { t } = useTranslation();
  const [sent, setSent] = useState(false);
  const schema = useMemo(() => createResetPasswordSchema(t), [t]);
  const { control, handleSubmit } = useForm<ResetPasswordSchema>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
    mode: "onChange",
    reValidateMode: "onChange",
  });

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
            <FormField
              control={control}
              name="email"
              label={t("auth.email-address")}
              icon="mail-outline"
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="skipper@northernstar.co.uk"
            />
            <PrimaryButton
              label={t("auth.send-reset-link")}
              onPress={handleSubmit(() => setSent(true))}
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

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
  card: { gap: 14 },
  sent: { color: colors.navy, fontSize: 15, lineHeight: 22 },
  footer: { textAlign: "center", marginTop: 22 },
  link: {
    color: colors.teal,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});
}
