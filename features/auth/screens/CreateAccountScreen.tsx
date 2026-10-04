import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { SocialAuthRow } from "@/features/auth/components/SocialAuthRow";
import { createAccount } from "@/features/auth/services/createAccount";
import { loginWithApple } from "@/features/auth/services/loginWithApple";
import { loginWithGoogle } from "@/features/auth/services/loginWithGoogle";
import { mapAuthError } from "@/features/auth/utils/mapAuthError";
import {
  createAccountSchema,
  type CreateAccountSchema,
} from "@/features/auth/validation/authSchema";
import { startSessionPrefetch } from "@/features/vessel/services/prefetchVesselCatalogs";
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

type LegalModal = "terms" | "privacy" | null;

/**
 * Create Account screen matching https://fishtownco.itoasis.co/ (prototype screen 6).
 * Creates a Firebase Auth user and writes `users/{uid}` in Firestore.
 * @returns Create account UI
 */
export default function CreateAccountScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [legalModal, setLegalModal] = useState<LegalModal>(null);

  const { t } = useTranslation();
  const schema = useMemo(() => createAccountSchema(t), [t]);
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateAccountSchema>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", agreed: false },
    mode: "onChange",
    reValidateMode: "onChange",
  });
  const agreed = watch("agreed");

  useFocusEffect(
    useCallback(() => {
      reset({ name: "", email: "", password: "", agreed: false });
      setIsSubmitting(false);
      setIsGoogleLoading(false);
      setIsAppleLoading(false);
      setLegalModal(null);
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
   * Submits create-account form to Firebase Auth + Firestore profile.
   * @param values - Validated form values
   * @returns Promise that resolves when navigation starts or a toast is shown
   */
  const onSubmit = async (values: CreateAccountSchema) => {
    if (isSubmitting || isGoogleLoading || isAppleLoading || !values.agreed) {
      return;
    }
    setIsSubmitting(true);
    try {
      await createAccount({
        name: values.name,
        email: values.email,
        password: values.password,
      });
      openVesselOnboarding();
    } catch (error) {

      toast.error(mapAuthError(error, t));
      setIsSubmitting(false);
    }
  };

  /**
   * Opens the vessel form so a new account can add its first boat.
   * Catalogs keep loading after the screen opens.
   * @returns void
   */
  const openVesselOnboarding = () => {
    startSessionPrefetch();
    toast.success(t("auth.create-account-success"));
    router.replace("/vessel/edit");
  };

  /**
   * Completes post-auth navigation after social sign-in.
   * A new account opens the add-vessel form. An existing account opens Home.
   * @param isNewUser - Whether this sign-in created the account
   * @returns Promise that resolves when navigation starts
   */
  const afterSocialAuthSuccess = async (isNewUser: boolean) => {
    if (isNewUser) {
      openVesselOnboarding();
      return;
    }
    startSessionPrefetch();
    toast.success(t("auth.log-in-success"));
    router.replace("/(tabs)/home");
  };

  /**
   * Starts Google Sign-In (Android + iOS).
   * @returns Promise that resolves when auth finishes or a toast is shown
   */
  const onGoogleSignIn = async () => {
    if (isSubmitting || isGoogleLoading || isAppleLoading) return;
    if (!agreed) {
      setValue("agreed", true, { shouldValidate: true });
    }
    setIsGoogleLoading(true);
    try {
      const result = await loginWithGoogle();
      await afterSocialAuthSuccess(result.isNewUser);
    } catch (error) {

      const message = error instanceof Error ? error.message : "";
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
    if (!agreed) {
      setValue("agreed", true, { shouldValidate: true });
    }
    setIsAppleLoading(true);
    try {
      const result = await loginWithApple();
      await afterSocialAuthSuccess(result.isNewUser);
    } catch (error) {

      const message = error instanceof Error ? error.message : "";
      if (message !== "APPLE_SIGNIN_CANCELLED") {
        toast.error(mapAuthError(error, t));
      }
      setIsAppleLoading(false);
    }
  };

  const legalTitle =
    legalModal === "terms"
      ? t("auth.terms-modal-title")
      : t("auth.privacy-modal-title");
  const legalIcon =
    legalModal === "terms" ? "document-text-outline" : "shield-outline";

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Pressable
            onPress={goToLogin}
            hitSlop={12}
            style={({ pressed }) => [
              styles.backBtn,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={t("auth.back-to-login")}
          >
            <Ionicons name="arrow-back" size={24} color={colors.navy} />
          </Pressable>
          <AppText style={styles.title}>{t("auth.create-account-title")}</AppText>
        </View>
        <AppText style={styles.subtitle}>
          {t("auth.create-account-subtitle")}
        </AppText>
      </View>

      <Card style={styles.card}>
        <FormField
          control={control}
          name="name"
          label={t("auth.full-name")}
          icon="id-card-outline"
          placeholder={t("auth.full-name-placeholder")}
        />
        <FormField
          control={control}
          name="email"
          label={t("auth.email-address")}
          icon="mail-outline"
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder={t("auth.email-placeholder-login")}
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
        <View style={styles.hintRow}>
          <Ionicons
            name="shield-checkmark-outline"
            size={15}
            color={colors.teal}
          />
          <AppText style={styles.hint}>{t("auth.password-hint")}</AppText>
        </View>

        <Pressable
          style={styles.agreeRow}
          onPress={() =>
            setValue("agreed", !agreed, { shouldValidate: true })
          }
          accessibilityRole="checkbox"
          accessibilityState={{ checked: agreed }}
        >
          <View style={[styles.checkbox, agreed && styles.checkboxOn]}>
            {agreed ? (
              <Ionicons name="checkmark" size={14} color={colors.white} />
            ) : null}
          </View>
          <AppText style={styles.agreeText}>
            {t("auth.agree-prefix")}{" "}
            <AppText
              style={styles.link}
              onPress={() => setLegalModal("terms")}
            >
              {t("auth.terms")}
            </AppText>{" "}
            {t("auth.and")}{" "}
            <AppText
              style={styles.link}
              onPress={() => setLegalModal("privacy")}
            >
              {t("auth.privacy")}
            </AppText>
          </AppText>
        </Pressable>
        {errors.agreed?.message ? (
          <AppText style={styles.error}>{errors.agreed.message}</AppText>
        ) : null}

        <PrimaryButton
          label={t("auth.create-account")}
          icon="boat-outline"
          iconPosition="leading"
          loading={isSubmitting}
          disabled={!agreed}
          onPress={handleSubmit(onSubmit)}
          style={styles.submitBtn}
        />

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <AppText style={styles.or}>{t("auth.or-continue-with")}</AppText>
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

      <AppText style={styles.footer}>
        {t("auth.already-have-account")}{" "}
        <AppText style={styles.link} onPress={goToLogin}>
          {t("auth.log-in")}
        </AppText>
      </AppText>

      <Modal
        visible={legalModal != null}
        transparent
        animationType="fade"
        onRequestClose={() => setLegalModal(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setLegalModal(null)}
        >
          <Pressable
            style={styles.modalCard}
            onPress={(event) => event.stopPropagation()}
          >
            <Pressable
              style={styles.modalClose}
              onPress={() => setLegalModal(null)}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={t("common.close")}
            >
              <Ionicons name="close" size={20} color={colors.muted} />
            </Pressable>
            <View style={styles.modalTitleRow}>
              <Ionicons name={legalIcon} size={24} color={colors.teal} />
              <AppText style={styles.modalTitle}>{legalTitle}</AppText>
            </View>
            <View style={styles.modalBody}>
              {legalModal === "terms" ? (
                <>
                  <AppText style={styles.modalText}>
                    {t("auth.terms-body-1")}
                  </AppText>
                  <AppText style={styles.modalText}>
                    {t("auth.terms-body-2")}
                  </AppText>
                </>
              ) : (
                <>
                  <AppText style={styles.modalText}>
                    {t("auth.privacy-body-1")}
                  </AppText>
                  <AppText style={styles.modalText}>
                    {t("auth.privacy-body-2")}
                  </AppText>
                </>
              )}
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.acceptBtn,
                pressed && styles.pressed,
              ]}
              onPress={() => {
                setValue("agreed", true, { shouldValidate: true });
                setLegalModal(null);
              }}
            >
              <AppText style={styles.acceptBtnText}>
                {t("auth.accept-close")}
              </AppText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

/**
 * Builds create-account screen styles matching the prototype.
 * @param colors - Theme colors
 * @returns Style sheet
 */
function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: {
      paddingTop: 8,
      paddingBottom: 36,
    },
    header: {
      marginBottom: 16,
      gap: 6,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    backBtn: {
      width: 36,
      height: 36,
      marginLeft: -6,
      alignItems: "center",
      justifyContent: "center",
    },
    pressed: { opacity: 0.7 },
    title: {
      flex: 1,
      color: colors.navy,
      fontSize: 22,
      fontWeight: "800",
      letterSpacing: 0.6,
      textTransform: "uppercase",
    },
    subtitle: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 19,
      paddingLeft: 2,
    },
    card: {
      gap: 14,
      padding: 20,
      borderRadius: 16,
      marginBottom: 18,
    },
    hintRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: -6,
    },
    hint: {
      color: colors.muted,
      fontSize: 11,
      flex: 1,
    },
    error: {
      color: colors.statusOverdueText,
      fontSize: 12,
      fontWeight: "600",
    },
    agreeRow: {
      flexDirection: "row",
      gap: 10,
      alignItems: "flex-start",
      paddingTop: 2,
    },
    checkbox: {
      width: 18,
      height: 18,
      borderRadius: 4,
      borderWidth: 1.5,
      borderColor: colors.inputBorder,
      marginTop: 1,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
    },
    checkboxOn: {
      backgroundColor: colors.teal,
      borderColor: colors.teal,
    },
    agreeText: {
      flex: 1,
      color: colors.navy,
      fontSize: 12,
      lineHeight: 18,
    },
    link: {
      color: colors.teal,
      fontWeight: "700",
      textDecorationLine: "underline",
    },
    submitBtn: {
      marginTop: 4,
      minHeight: 48,
      borderRadius: 12,
    },
    dividerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: 2,
      marginBottom: 2,
    },
    dividerLine: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
    or: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    footer: {
      textAlign: "center",
      color: colors.muted,
      fontSize: 12,
      marginTop: 4,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      padding: 20,
    },
    modalCard: {
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 24,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    modalClose: {
      position: "absolute",
      top: 14,
      right: 14,
      zIndex: 1,
      padding: 4,
    },
    modalTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingRight: 28,
    },
    modalTitle: {
      flex: 1,
      color: colors.navy,
      fontSize: 18,
      fontWeight: "800",
      letterSpacing: 0.4,
      textTransform: "uppercase",
    },
    modalBody: {
      gap: 8,
      maxHeight: 220,
    },
    modalText: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 18,
    },
    acceptBtn: {
      marginTop: 4,
      minHeight: 40,
      borderRadius: 12,
      backgroundColor: colors.navy,
      alignItems: "center",
      justifyContent: "center",
    },
    acceptBtnText: {
      color: colors.white,
      fontSize: 12,
      fontWeight: "600",
    },
  });
}