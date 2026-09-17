import * as Font from "expo-font";
import APP_CONFIG from "./appConfig";

export type FontToken = {
  heading: string;
  title: string;
  subTitle: string;
  button: string;
  caption: string;
  robotoMedium: string;
  robotoRegular: string;
  robotoLight: string;
};

export type FontName = keyof FontToken;

const baseFonts = APP_CONFIG.fontFamily;
const arabicFonts = APP_CONFIG.fontFamilyAr;

/** Returns fonts for the given language. AR and UR use Arabic script fonts (Cairo/IBM). */
export function getFontsForLanguage(lang: string): FontToken {
  const isRTLScript = lang === "ar" || lang === "ur";
  const localeFonts = isRTLScript && arabicFonts ? arabicFonts : baseFonts;
  return {
    heading: localeFonts.heading,
    title: localeFonts.title,
    subTitle: localeFonts.subTitle,
    button: localeFonts.button,
    caption: localeFonts.caption,
    robotoMedium: baseFonts.robotoMedium,
    robotoRegular: baseFonts.robotoRegular,
    robotoLight: baseFonts.robotoLight,
  };
}

/** Syncs the default fonts export with the current language. Called by ThemeProvider. */
let _currentLang = "en";
export function setFontsLanguage(lang: string) {
  _currentLang = lang?.split("-")[0] || "en";
}

/** Default export: reads current language for AR/UR → Arabic fonts. Use useFonts() for explicit hook. */
const fonts = new Proxy({} as FontToken, {
  get(_, prop: keyof FontToken) {
    return getFontsForLanguage(_currentLang)[prop];
  },
});
export default fonts;

// Font loader previously in features/common/fonts/index.ts
export const fontFiles = {
  // Inter
  "Inter-Light": require("@/assets/fonts/inter/inter-light.otf"),
  "Inter-Regular": require("@/assets/fonts/inter/inter-regular.otf"),
  "Inter-Medium": require("@/assets/fonts/inter/inter-medium.otf"),
  "Inter-SemiBold": require("@/assets/fonts/inter/inter-semi-bold.otf"),

  // Sofia Pro
  "SofiaPro-Light": require("@/assets/fonts/sofia-pro/sofia-pro-light.otf"),
  "SofiaPro-Regular": require("@/assets/fonts/sofia-pro/sofia-pro-regular.otf"),
  // NOTE: filename currently has a typo in repo: "sofiia-pro-medium.otf"
  // Update here to match existing file until it is renamed
  "SofiaPro-Medium": require("@/assets/fonts/sofia-pro/sofiia-pro-medium.otf"),
  "SofiaPro-SemiBold": require("@/assets/fonts/sofia-pro/sofia-pro-semi-bold.otf"),

  "IBM-Light": require("@/assets/fonts/IBMPlex/IBMPlexSansArabic-Light.ttf"),
  "IBM-Regular": require("@/assets/fonts/IBMPlex/IBMPlexSansArabic-Regular.ttf"),
  "IBM-Medium": require("@/assets/fonts/IBMPlex/IBMPlexSansArabic-Medium.ttf"),
  "IBM-SemiBold": require("@/assets/fonts/IBMPlex/IBMPlexSansArabic-SemiBold.ttf"),

  "Cairo-Light": require("@/assets/fonts/Cairo/Cairo-Light.ttf"),
  "Cairo-Regular": require("@/assets/fonts/Cairo/Cairo-Regular.ttf"),
  "Cairo-Medium": require("@/assets/fonts/Cairo/Cairo-Medium.ttf"),
  "Cairo-SemiBold": require("@/assets/fonts/Cairo/Cairo-SemiBold.ttf"),

  // Roboto
  "Roboto-Bold": require("@/assets/fonts/roboto/Roboto-Bold.ttf"),
  "Roboto-SemiBold": require("@/assets/fonts/roboto/Roboto-SemiBold.ttf"),
  "Roboto-Medium": require("@/assets/fonts/roboto/Roboto-Medium.ttf"),
  "Roboto-Regular": require("@/assets/fonts/roboto/Roboto-Regular.ttf"),
  "Roboto-Light": require("@/assets/fonts/roboto/Roboto-Light.ttf"),
};

/**
 * Vector icon fonts — aliases MUST match @expo/vector-icons createIconSet names
 * (e.g. "ionicons", not "Ionicons"). Loaded from assets/ so EAS Release embeds
 * resolve them like brand fonts (node_modules asset paths often fail there).
 * Synced by scripts/sync-vector-icon-fonts.mjs.
 */
const vectorIconFonts = {
  ionicons: require("@/assets/fonts/vector/Ionicons.ttf"),
  material: require("@/assets/fonts/vector/MaterialIcons.ttf"),
  "material-community": require("@/assets/fonts/vector/MaterialCommunityIcons.ttf"),
  feather: require("@/assets/fonts/vector/Feather.ttf"),
  entypo: require("@/assets/fonts/vector/Entypo.ttf"),
  "simple-line-icons": require("@/assets/fonts/vector/SimpleLineIcons.ttf"),
  "FontAwesome6Free-Regular": require("@/assets/fonts/vector/FontAwesome6_Regular.ttf"),
  "FontAwesome6Free-Solid": require("@/assets/fonts/vector/FontAwesome6_Solid.ttf"),
  "FontAwesome6Brands-Regular": require("@/assets/fonts/vector/FontAwesome6_Brands.ttf"),
  
};

export const loadFonts = async () => {
  await Font.loadAsync(fontFiles);

  // Load icon fonts separately so a packaging miss doesn't block brand fonts /
  // app boot — and so aliases match what Ionicons/etc. check via Font.isLoaded.
  try {
    await Font.loadAsync(vectorIconFonts);
  } catch {
    for (const [family, source] of Object.entries(vectorIconFonts)) {
      try {
        if (!Font.isLoaded(family)) {
          await Font.loadAsync({ [family]: source });
        }
      } catch {
        // leave unloaded; icon components may still try loadAsync on mount
      }
    }
  }
};
