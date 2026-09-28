import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Pressable, StyleSheet, View } from "react-native";
import { resetPassword } from "@/features/auth/services/resetPassword";
import { mapAuthError } from "@/features/auth/utils/mapAuthError";
import {
  createResetPasswordSchema,
  type ResetPasswordSchema,
} from "@/features/auth/validation/authSchema";
import {
  AppText,
  Card,
  FormField,
  PrimaryButton,
  Screen,
  useToast,
} from "@/ui/components";
import { useColors, type ThemeColors } from "@/ui/theme";
import { useTranslation } from "@/ui/translations";

/**
 * Reset Password screen matching https://fishtownco.itoasis.co/ (prototype screen 7).
 * Sends a Firebase Auth password-reset email for the entered address.
 * @returns Reset password UI
 */
export default function ResetPasswordScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const toast = useToast();
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
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
      setSentEmail("");
      setIsSubmitting(false);
    }, [reset])
  );

  /**
   * Navigates back to the login screen.
   * @returns void
   */
  const goToLogin = () => {
    router.replace("/(auth)/login");
  };

  /**
   * Requests a Firebase password-reset email for the form address.
   * @param values - Validated email
   * @returns Promise that resolves when the success UI or toast is shown
   */
  const onSubmit = async (values: ResetPasswordSchema) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const email = values.email.trim();

    try {
      await resetPassword({ email });
      toast.success(t("auth.reset-email-sent-toast"));
      setSentEmail(email);
      setSent(true);
    } catch (error) {

      toast.error(mapAuthError(error, t));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}>
        <Pressable
          onPress={goToLogin}
          hitSlop={12}
          style={({ pressed }) => [
            styles.backRow,
            pressed && styles.backPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t("auth.back-to-login")}
        >
          <Ionicons name="arrow-back" size={20} color={colors.navy} />
          <AppText style={styles.backLabel}>{t("auth.back-to-login")}</AppText>
        </Pressable>
        <AppText style={styles.title}>{t("auth.reset-title")}</AppText>
        <AppText style={styles.subtitle}>{t("auth.reset-subtitle")}</AppText>
      </View>

      <Card style={styles.card}>
        {sent ? (
          <View style={styles.sentWrap}>
            <View style={styles.sentIconCircle}>
              <Ionicons
                name="mail-open-outline"
                size={32}
                color={colors.teal}
              />
            </View>
            <AppText style={styles.sentTitle}>
              {t("auth.reset-sent-title")}
            </AppText>
            <AppText style={styles.sentBody}>
              {t("auth.reset-sent-prefix")}
              <AppText style={styles.sentEmail}>{sentEmail}</AppText>
              {t("auth.reset-sent-suffix")}
            </AppText>
            <Pressable
              onPress={goToLogin}
              style={({ pressed }) => [
                styles.returnBtn,
                pressed && styles.returnBtnPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={t("auth.return-to-login")}
            >
              <AppText style={styles.returnBtnText}>
                {t("auth.return-to-login")}
              </AppText>
            </Pressable>
          </View>
        ) : (
          <>
            <FormField
              control={control}
              name="email"
              label={t("auth.skipper-email-address")}
              icon="mail-outline"
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder={t("auth.email-placeholder-login")}
            />
            <PrimaryButton
              label={t("auth.send-reset-link")}
              icon="arrow-forward"
              loading={isSubmitting}
              onPress={handleSubmit(onSubmit)}
              style={styles.submitBtn}
            />
          </>
        )}
      </Card>
    </Screen>
  );
}

/**
 * Builds reset-password screen styles matching the prototype.
 * @param colors - Theme colors
 * @returns Style sheet
 */
function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: {
      paddingTop: 12,
      paddingBottom: 36,
      justifyContent: "center",
    },
    header: {
      paddingTop: 8,
      paddingBottom: 20,
      gap: 4,
    },
    backRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 8,
      alignSelf: "flex-start",
    },
    backPressed: { opacity: 0.7 },
    backLabel: {
      color: colors.navy,
      fontSize: 14,
      fontWeight: "600",
    },
    title: {
      color: colors.navy,
      fontSize: 22,
      fontWeight: "800",
      letterSpacing: 0.4,
      textTransform: "uppercase",
    },
    subtitle: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 18,
      marginTop: 2,
    },
    card: {
      gap: 14,
      padding: 24,
      borderRadius: 16,
    },
    submitBtn: {
      marginTop: 4,
    },
    sentWrap: {
      alignItems: "center",
      paddingVertical: 12,
      gap: 12,
    },
    sentIconCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: "rgba(31, 138, 138, 0.1)",
      alignItems: "center",
      justifyContent: "center",
    },
    sentTitle: {
      color: colors.navy,
      fontSize: 22,
      fontWeight: "800",
      letterSpacing: 0.4,
      textTransform: "uppercase",
      textAlign: "center",
    },
    sentBody: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 20,
      textAlign: "center",
    },
    sentEmail: {
      color: colors.navy,
      fontSize: 13,
      fontWeight: "700",
    },
    returnBtn: {
      marginTop: 8,
      width: "100%",
      minHeight: 48,
      borderRadius: 12,
      backgroundColor: colors.navy,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 18,
    },
    returnBtnPressed: { opacity: 0.9 },
    returnBtnText: {
      color: colors.white,
      fontSize: 14,
      fontWeight: "600",
    },
  });
}