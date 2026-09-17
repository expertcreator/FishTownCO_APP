export type OnboardingSlideData = {
  id: string;
  labelKey: string;
  tabKey: string;
  titleKey: string;
  bodyKey: string;
  badgeKey: string;
  badgeIcon: "check" | "bell" | "share";
  illustration: number;
};

/**
 * Onboarding slides from https://fishtownco.itoasis.co/ (copy via i18n keys).
 */
export const ONBOARDING_SLIDES: OnboardingSlideData[] = [
  {
    id: "central-log",
    labelKey: "onboarding.slide-01-label",
    tabKey: "onboarding.slide-01-tab",
    titleKey: "onboarding.slide-01-title",
    bodyKey: "onboarding.slide-01-body",
    badgeKey: "onboarding.slide-01-badge",
    badgeIcon: "check",
    illustration: require("@/assets/from-design/onboarding/01-central-log.jpg"),
  },
  {
    id: "due-dates",
    labelKey: "onboarding.slide-02-label",
    tabKey: "onboarding.slide-02-tab",
    titleKey: "onboarding.slide-02-title",
    bodyKey: "onboarding.slide-02-body",
    badgeKey: "onboarding.slide-02-badge",
    badgeIcon: "bell",
    illustration: require("@/assets/from-design/onboarding/02-due-dates.jpg"),
  },
  {
    id: "inspection",
    labelKey: "onboarding.slide-03-label",
    tabKey: "onboarding.slide-03-tab",
    titleKey: "onboarding.slide-03-title",
    bodyKey: "onboarding.slide-03-body",
    badgeKey: "onboarding.slide-03-badge",
    badgeIcon: "share",
    illustration: require("@/assets/from-design/onboarding/03-inspection.jpg"),
  },
];
