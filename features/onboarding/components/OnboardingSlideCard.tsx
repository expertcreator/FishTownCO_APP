import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, View } from "react-native";
import { AppText } from "@/ui/components";
import { colors } from "@/constants/theme";
import type { OnboardingSlideData } from "@/features/onboarding/data/slides";
import { useTranslation } from "@/ui/translations";

type OnboardingSlideCardProps = {
  slide: OnboardingSlideData;
};

/**
 * Renders one onboarding feature card matching the prototype layout.
 * @param props - Slide props
 * @param props.slide - Slide content from the design
 * @returns Onboarding card element
 */
export function OnboardingSlideCard({ slide }: OnboardingSlideCardProps) {
  const { t } = useTranslation();
  const iconName =
    slide.badgeIcon === "bell"
      ? "notifications"
      : slide.badgeIcon === "share"
        ? "checkmark-circle"
        : "ribbon";

  return (
    <View style={styles.card}>
      <View style={styles.illustrationWrap}>
        <Image
          source={slide.illustration}
          style={styles.illustration}
          resizeMode="cover"
          accessibilityLabel={t(slide.titleKey)}
        />
        <View style={styles.badge}>
          <View style={styles.badgeIconWrap}>
            <Ionicons name={iconName} size={16} color={colors.white} />
          </View>
          <AppText style={styles.badgeText}>{t(slide.badgeKey)}</AppText>
        </View>
      </View>
      <AppText style={styles.slideLabel}>{t(slide.labelKey)}</AppText>
      <AppText style={styles.title}>{t(slide.titleKey)}</AppText>
      <AppText style={styles.body}>{t(slide.bodyKey)}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 28,
    paddingBottom: 24,
    overflow: "hidden",
  },
  illustrationWrap: {
    height: 220,
    margin: 12,
    borderRadius: 22,
    overflow: "hidden",
    justifyContent: "flex-end",
    backgroundColor: "#E2F1F8",
  },
  illustration: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  badgeIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: "700",
    maxWidth: 220,
  },
  slideLabel: {
    marginTop: 8,
    textAlign: "center",
    color: colors.teal,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.4,
  },
  title: {
    marginTop: 10,
    paddingHorizontal: 20,
    textAlign: "center",
    color: colors.navy,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  body: {
    marginTop: 10,
    paddingHorizontal: 22,
    textAlign: "center",
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
});
