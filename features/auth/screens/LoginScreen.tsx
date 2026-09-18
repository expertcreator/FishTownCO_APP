import { router } from "expo-router";
import { useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { colors } from "@/constants/theme";
import {
  AppText,
  BackHeader,
  Card,
  Field,
  OutlineButton,
  PrimaryButton,
  Screen,
  TextLink,
} from "@/shared/components";
import { useTranslation } from "@/shared/translations";

/**
 * Log In screen matching prototype screen 5.
 * @returns Login UI
 */
export default function LoginScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("skipper@northernstar.co.uk");
  const [password, setPassword] = useState("");

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
        <TextLink
          align="right"
          onPress={() => router.push("/(auth)/reset-password")}
        >
          {t("auth.forgot-password")}
        </TextLink>
        <PrimaryButton
          label={t("auth.log-in")}
          onPress={() => router.replace("/(tabs)/home")}
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

const styles = StyleSheet.create({
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
