import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { SocialAuthRow } from "@/features/auth/components/SocialAuthRow";
import { login } from "@/features/auth/services/login";
import { loginWithApple } from "@/features/auth/services/loginWithApple";
import { loginWithGoogle } from "@/features/auth/services/loginWithGoogle";
import { mapAuthError } from "@/features/auth/utils/mapAuthError";
import {
  createLoginSchema,
  type LoginSchema,
} from "@/features/auth/validation/authSchema";
import { useSafetyCategoriesStore } from "@/features/safety/store/safetyCategoriesStore";
import {
  AppText,
  Card,
  FormField,
  PrimaryButton,
  Screen,
  TextLink,
  useToast,
} from "@/ui/components";
import { useColors, type ThemeColors } from "@/ui/theme";
import { useTranslation } from "@/ui/translations";

const LOGIN_BANNER = require("@/assets/from-design/login/marina-banner.jpg");

/**
 * Log In screen matching prototype screen 5
 * (https://fishtownco.itoasis.co/ and fishtown-co LoginScreen layout).
 * Signs in with Firebase Auth, then opens the home tab.
 * @returns Login UI
 */
export default function LoginScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
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
    } catch (error) {
      console.error("[LoginScreen] submit failed", error);
      toast.error(mapAuthError(error, t));
      setIsSubmitting(false);
    }
  };

  /**
   * Completes post-auth navigation after email or social sign-in.
   * @returns Promise that resolves when home opens
   */
  const afterAuthSuccess = async () => {
    await useSafetyCategoriesStore.getState().loadCategories();
    toast.success(t("auth.log-in-success"));
    router.replace("/(tabs)/home");
  };

  /**
   * Starts Google Sign-In (Android + iOS).
   * @returns Promise that resolves when auth finishes or a toast is shown
   */
  const onGoogleSignIn = async () => {
    if (isSubmitting || isGoogleLoading || isAppleLoading) return;
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
      await afterAuthSuccess();
    } catch (error) {
      console.error("[LoginScreen] google failed", error);
      const message =
        error instanceof Error ? error.message : "";
      if (message !== "GOOGLE_SIGNIN_CANCELLED") {
        toast.error(mapAuthError(error, t));
      }
      setIsGoogleLoading(false);
    }
  };

  /**
   * Starts Apple Sign-In (iOS only).
   * @returns Promise that resolves when auth finishes or a toast is shown
   */
  const onAppleSignIn = async () => {
    if (isSubmitting || isGoogleLoading || isAppleLoading) return;
    setIsAppleLoading(true);
    try {
      await loginWithApple();
      await afterAuthSuccess();
    } catch (error) {
      console.error("[LoginScreen] apple failed", error);
      const message =
        error instanceof Error ? error.message : "";
      if (message !== "APPLE_SIGNIN_CANCELLED") {
        toast.error(mapAuthError(error, t));
      }
      setIsAppleLoading(false);
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}>
        <AppText style={styles.title}>{t("auth.login-title")}</AppText>
        <AppText style={styles.subtitle}>{t("auth.login-subtitle")}</AppText>
      </View>

      <View style={styles.banner}>
        <Image
          source={LOGIN_BANNER}
          style={styles.bannerImage}
          resizeMode="cover"
          accessibilityLabel={t("auth.login-banner-alt")}
        />
        <LinearGradient
          colors={["transparent", "rgba(11,42,69,0.4)", "rgba(11,42,69,0.92)"]}
          locations={[0, 0.45, 1]}
          style={styles.bannerGradient}
        />
        <View style={styles.bannerFooter}>
          <View style={styles.brandRow}>
            <Ionicons name="boat-outline" size={20} color={colors.teal} />
            <AppText style={styles.brandName}>{t("app.name")}</AppText>
          </View>
          <View style={styles.badge}>
            <View style={styles.badgeDot} />
            <AppText style={styles.badgeText}>{t("auth.hero-badge")}</AppText>
          </View>
        </View>
      </View>

      <Card style={styles.formCard}>
        <FormField
          control={control}
          name="email"
          label={t("auth.email-address")}
          icon="mail-outline"
          placeholder={t("auth.email-placeholder-login")}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <FormField
          control={control}
          name="password"
          label={t("auth.password")}
          icon="key-outline"
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
          label={
            isSubmitting ? t("auth.authenticating") : t("auth.log-in")
          }
          icon={isSubmitting ? undefined : "arrow-forward"}
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit)}
          style={styles.loginBtn}
        />

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <AppText style={styles.or}>{t("auth.or")}</AppText>
          <View style={styles.dividerLine} />
        </View>

        <SocialAuthRow
          onPressGoogle={() => void onGoogleSignIn()}
          onPressApple={() => void onAppleSignIn()}
          isGoogleLoading={isGoogleLoading}
          isAppleLoading={isAppleLoading}
          disabled={isSubmitting}
        />
      </Card>

      <View style={styles.footer}>
        <AppText style={styles.footerText}>
          {t("auth.new-here")}{" "}
          <AppText
            style={styles.link}
            onPress={() => router.push("/(auth)/create-account")}
          >
            {t("auth.create-account-link")}
          </AppText>
        </AppText>
        <Pressable
          onPress={() => router.push("/(auth)/create-account")}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t("auth.create-account-link")}
        >
          <Ionicons name="open-outline" size={14} color={colors.teal} />
        </Pressable>
      </View>
    </Screen>
  );
}

/**
 * Builds login-screen styles to match the prototype layout.
 * @param colors - Active theme colors
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
    },
    banner: {
      height: 128,
      borderRadius: 16,
      overflow: "hidden",
      marginBottom: 24,
      backgroundColor: colors.navy,
    },
    bannerImage: {
      ...StyleSheet.absoluteFill,
      width: "100%",
      height: "100%",
    },
    bannerGradient: {
      ...StyleSheet.absoluteFill,
    },
    bannerFooter: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: 16,
      paddingBottom: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    brandRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flexShrink: 1,
    },
    brandName: {
      color: colors.white,
      fontSize: 16,
      fontWeight: "800",
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.teal,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    badgeDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.white,
    },
    badgeText: {
      color: colors.white,
      fontWeight: "700",
      fontSize: 11,
    },
    formCard: {
      gap: 14,
      borderRadius: 16,
      padding: 24,
      shadowColor: "#0B2A45",
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
    loginBtn: {
      marginTop: 4,
      borderRadius: 12,
      minHeight: 52,
    },
    dividerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginVertical: 4,
    },
    dividerLine: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
    or: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1.5,
    },
    footer: {
      marginTop: 24,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
    },
    footerText: {
      color: colors.muted,
      fontSize: 12,
      textAlign: "center",
    },
    link: {
      color: colors.teal,
      fontWeight: "800",
      fontSize: 12,
    },
  });
}
