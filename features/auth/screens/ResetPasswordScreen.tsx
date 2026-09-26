import { zodResolver } from "@hookform/resolvers/zod";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
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
  useToast,
} from "@/ui/components";
import { useTranslation } from "@/ui/translations";
import { resetPassword } from "@/features/auth/services/resetPassword";
import { mapAuthError } from "@/features/auth/utils/mapAuthError";
import {
  createResetPasswordSchema,
  type ResetPasswordSchema,
} from "@/features/auth/validation/authSchema";

/**
 * Reset Password screen matching prototype screen 7.
 * Sends a Firebase Auth password-reset email for the entered address.
 * @returns Reset password UI
 */
export default function ResetPasswordScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const toast = useToast();
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { t } = useTranslation();
  const schema = useMemo(() => createResetPasswordSchema(t), [t]);
  const { control, handleSubmit, reset } = useForm<ResetPasswordSchema>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  useFocusEffect(
    useCallback(() => {
      reset({ email: "" });
      setSent(false);
      setIsSubmitting(false);
    }, [reset])
  );

  /**
   * Requests a Firebase password-reset email for the form address.
   * @param values - Validated email
   * @returns Promise that resolves when the success UI or toast is shown
   */
  const onSubmit = async (values: ResetPasswordSchema) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    console.log("[ResetPasswordScreen] submit", {
      email: values.email.trim(),
    });
    try {
      await resetPassword({ email: values.email });
      toast.success(t("auth.reset-email-sent-toast"));
      setSent(true);
    } catch (error) {
      console.error("[ResetPasswordScreen] submit failed", error);
      toast.error(mapAuthError(error, t));
    } finally {
      setIsSubmitting(false);
    }
  };

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
              placeholder={t("auth.email-placeholder")}
            />
            <PrimaryButton
              label={t("auth.send-reset-link")}
              loading={isSubmitting}
              onPress={handleSubmit(onSubmit)}
            />
          </>
        )}
      </Card>

      <AppText style={styles.footer}>
        <AppText
          style={styles.link}
          onPress={() => router.replace("/(auth)/login")}
        >
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
