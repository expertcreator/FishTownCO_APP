/**
 * Fishtownco brand image registry (Vessel Companion only).
 */
export const Images = {
  logo: require("@/assets/branding/fishtownco/logo.png"),
  logoArabic: require("@/assets/branding/fishtownco/logoArabic.png"),
  icon: require("@/assets/branding/fishtownco/icon.png"),
  splash: require("@/assets/branding/fishtownco/splash.png"),
  adaptiveIcon: require("@/assets/branding/fishtownco/adaptive-icon.png"),
  welcomeLogo: require("@/assets/from-design/welcome/welcome-logo.png"),
  onboardingCentralLog: require("@/assets/from-design/onboarding/01-central-log.jpg"),
  onboardingDueDates: require("@/assets/from-design/onboarding/02-due-dates.jpg"),
  onboardingInspection: require("@/assets/from-design/onboarding/03-inspection.jpg"),
} as const;

export type ImageKey = keyof typeof Images;
