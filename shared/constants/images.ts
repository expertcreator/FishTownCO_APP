// Centralized image registry — only assets used by Fishtownco.

const brandImages = {
  logo: require("@/assets/branding/fishtownco/logo.png"),
  logoArabic: require("@/assets/branding/fishtownco/logoArabic.png"),
  icon: require("@/assets/branding/fishtownco/icon.png"),
  splash: require("@/assets/branding/fishtownco/splash.png"),
  adaptiveIcon: require("@/assets/branding/fishtownco/adaptive-icon.png"),
} as const;

export const Images = {
  ...brandImages,
  noData: require("@/assets/images/noData.png"),
  noConnection: require("@/assets/images/noData.png"),
  noOrder: require("@/assets/images/no-order.png"),
  placeholder: require("@/assets/images/picPlaceHolder.jpeg"),
  welcomeLogo: require("@/assets/from-design/welcome/welcome-logo.png"),
  onboardingCentralLog: require("@/assets/from-design/onboarding/01-central-log.jpg"),
  onboardingDueDates: require("@/assets/from-design/onboarding/02-due-dates.jpg"),
  onboardingInspection: require("@/assets/from-design/onboarding/03-inspection.jpg"),
} as const;

export const Icons = {
  apple: require("@/assets/icons/apple.png"),
  arabic: require("@/assets/icons/arabic.svg"),
  avatar: require("@/assets/icons/avatar.png"),
  back: require("@/assets/icons/back.png"),
  english: require("@/assets/icons/english.svg"),
  filter: require("@/assets/icons/filter.png"),
  google: require("@/assets/icons/google.png"),
  language: require("@/assets/icons/language.svg"),
  search: require("@/assets/icons/search.png"),
  selectedRadio: require("@/assets/icons/selectedRadio.png"),
  urdu: require("@/assets/icons/urdu.png"),
} as const;

export type ImageKey = keyof typeof Images;
export type IconKey = keyof typeof Icons;
