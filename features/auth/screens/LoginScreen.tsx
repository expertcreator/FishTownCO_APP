import { zodResolver } from "@hookform/resolvers/zod";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Image, StyleSheet, View } from "react-native";
import { useColors, type ThemeColors } from "@/ui/theme";
import {
  AppText,
  BackHeader,
  Card,
  FormField,
  OutlineButton,
  PrimaryButton,
  Screen,
  TextLink,
  useToast,
} from "@/ui/components";
import { useTranslation } from "@/ui/translations";
import { login } from "@/features/auth/services/login";
import { mapAuthError } from "@/features/auth/utils/mapAuthError";
import { useSafetyCategoriesStore } from "@/features/safety/store/safetyCategoriesStore";
import {
  createLoginSchema,
  type LoginSchema,
} from "@/features/auth/validation/authSchema";

/**
 * Log In screen matching prototype screen 5.
 * Signs in with Firebase Auth, then opens the home tab.
 * @returns Login UI
 */
export default function LoginScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { t } = useTranslation();
  const schema = useMemo(() => createLoginSchema(t), [t]);
  const { control, handleSubmit, reset } = useForm<LoginSchema>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  useFocusEffect(
    useCallback(() => {
      reset({ email: "", password: "" });
      setIsSubmitting(false);
    }, [reset])
  );

  /**
   * Submits login credentials to Firebase Auth.
   * @param values - Validated email and password
   * @returns Promise that resolves when navigation starts or a toast is shown
   */
  const onSubmit = async (values: LoginSchema) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    console.log("[LoginScreen] submit", { email: values.email.trim() });
    try {
      await login({
        email: values.email,
        password: values.password,
      });
      await useSafetyCategoriesStore.getState().loadCategories();
      toast.success(t("auth.log-in-success"));
      router.replace("/(tabs)/home");
      // Keep loader visible until this screen unmounts after navigation.
    } catch (error) {
      console.error("[LoginScreen] submit failed", error);
      toast.error(mapAuthError(error, t));
      setIsSubmitting(false);
    }
  };

  return (
    <Screen>
      <BackHeader
        title={t("auth.login-title")}
        subtitle={t("auth.login-subtitle")}
        onBack={() => router.replace("/welcome")}
      />

      <Card style={styles.hero}>
        <Image
          source={require("@/assets/from-design/welcome/welcome-logo.png")}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel={t("app.name")}
        />
        <View style={styles.badge}>
          <View style={styles.badgeDot} />
          <AppText style={styles.badgeText}>{t("auth.hero-badge")}</AppText>
        </View>
      </Card>

      <Card style={styles.form}>
        <FormField
          control={control}
          name="email"
          label={t("auth.email-address")}
          icon="mail-outline"
          placeholder={t("auth.email-placeholder")}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <FormField
          control={control}
          name="password"
          label={t("auth.password")}
          icon="lock-closed-outline"
          secureTextEntry
          secureToggle
          placeholder="••••••••••••"
        />
        <TextLink
          align="right"
          onPress={() => router.push("/(auth)/reset-password")}
        >
          {t("auth.forgot-password")}
        </TextLink>
        <PrimaryButton
          label={t("auth.log-in")}
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit)}
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
        {t("auth.new-here")}{" "}
        <AppText
          style={styles.link}
          onPress={() => router.push("/(auth)/create-account")}
        >
          {t("auth.create-account")}
        </AppText>
      </AppText>
    </Screen>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
  hero: {
    marginBottom: 14,
    alignItems: "center",
    gap: 12,
    paddingVertical: 18,
  },
  logo: { width: 180, height: 72 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.softTeal,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.teal,
  },
  badgeText: { color: colors.teal, fontWeight: "700", fontSize: 12 },
  form: { gap: 14, marginBottom: 18 },
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
  link: {
    color: colors.teal,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});
}
