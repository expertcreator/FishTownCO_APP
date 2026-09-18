import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/ui/components";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors, type ThemeColors } from "@/ui/theme";
import { useTranslation } from "@/ui/translations";

/**
 * Welcome / entry screen matching https://fishtownco.itoasis.co/ screen 1.
 * @returns Welcome UI
 */
export default function WelcomeScreen() {
  const colors = useColors();
  const styles = getStyles(colors);

  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.centerBlock}>
          <Image
            source={require("@/assets/from-design/welcome/welcome-logo.png")}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel={t("app.name")}
          />
          <AppText style={styles.eyebrow}>{t("welcome.eyebrow")}</AppText>
          <AppText style={styles.headline}>{t("welcome.headline")}</AppText>
        </View>

        <View style={styles.actions}>
          <Link href="/onboarding" asChild>
            <Pressable style={styles.cta}>
              <AppText style={styles.ctaText}>{t("welcome.get-started")}</AppText>
              <Ionicons name="arrow-forward" size={18} color={colors.white} />
            </Pressable>
          </Link>

          <Link href="/(auth)/login" asChild>
            <Pressable style={styles.loginWrap}>
              <AppText style={styles.loginPrompt}>
                {t("welcome.already-have-account")}{" "}
                <AppText style={styles.loginLink}>{t("welcome.log-in")}</AppText>
              </AppText>
            </Pressable>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingVertical: 24,
    justifyContent: "space-between",
  },
  centerBlock: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 260,
    height: 110,
    marginBottom: 20,
  },
  eyebrow: {
    color: colors.teal,
    letterSpacing: 3,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  headline: {
    color: colors.navy,
    fontSize: 17,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 26,
    maxWidth: 320,
  },
  actions: {
    paddingBottom: 8,
    gap: 12,
  },
  cta: {
    backgroundColor: colors.orange,
    borderRadius: 14,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  ctaText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  loginWrap: {
    alignItems: "center",
    paddingVertical: 8,
  },
  loginPrompt: {
    color: colors.navy,
    textAlign: "center",
    fontSize: 14,
  },
  loginLink: {
    color: colors.teal,
    textDecorationLine: "underline",
    fontWeight: "700",
  },
});
}
