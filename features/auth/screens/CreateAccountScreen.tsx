import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { Pressable, StyleSheet, View } from "react-native";
import { useColors, type ThemeColors } from "@/ui/theme";
import {
  AppText,
  BackHeader,
  Card,
  FormField,
  OutlineButton,
  PrimaryButton,
  Screen,
} from "@/ui/components";
import { useTranslation } from "@/ui/translations";
import {
  createAccountSchema,
  type CreateAccountSchema,
} from "@/features/auth/validation/authSchema";

/**
 * Create Account screen matching prototype screen 6.
 * @returns Create account UI
 */
export default function CreateAccountScreen() {
  const colors = useColors();
  const styles = getStyles(colors);

  const { t } = useTranslation();
  const schema = useMemo(() => createAccountSchema(t), [t]);
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateAccountSchema>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", agreed: false },
    mode: "onChange",
    reValidateMode: "onChange",
  });
  const agreed = watch("agreed");

  return (
    <Screen>
      <BackHeader
        title={t("auth.create-account-title")}
        subtitle={t("auth.create-account-subtitle")}
      />

      <Card style={styles.card}>
        <FormField
          control={control}
          name="name"
          label={t("auth.full-name")}
          icon="id-card-outline"
          placeholder="Capt. John Davies"
        />
        <FormField
          control={control}
          name="email"
          label={t("auth.email-address")}
          icon="mail-outline"
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="skipper@northernstar.co.uk"
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
        <AppText style={styles.hint}>{t("auth.password-hint")}</AppText>

        <Pressable
          style={styles.agreeRow}
          onPress={() =>
            setValue("agreed", !agreed, { shouldValidate: true })
          }
        >
          <View style={[styles.checkbox, agreed && styles.checkboxOn]} />
          <AppText style={styles.agreeText}>
            {t("auth.agree-prefix")}{" "}
            <AppText style={styles.link}>{t("auth.terms")}</AppText> {t("auth.and")}{" "}
            <AppText style={styles.link}>{t("auth.privacy")}</AppText>
          </AppText>
        </Pressable>
        {errors.agreed?.message ? (
          <AppText style={styles.error}>{errors.agreed.message}</AppText>
        ) : null}

        <PrimaryButton
          label={t("auth.create-account")}
          icon="boat-outline"
          onPress={handleSubmit(() => router.push("/vessel/setup"))}
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
  error: { color: colors.statusOverdueText, fontSize: 12, fontWeight: "600" },
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
