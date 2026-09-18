import type { ConfigContext, ExpoConfig } from "expo/config";

/** Cream from https://fishtownco.itoasis.co/ (welcome / onboarding canvas). */
const SPLASH_BG = "#F3EBDD";
const BRAND_ROOT = "./assets/branding/fishtownco";

/**
 * Expo config for Fishtownco.
 * Icon / adaptive-icon / splash sizes and plugin options match Foori:
 * 1024×1024 assets, enableFullScreenImage_legacy false, android imageWidth 240.
 * @param ctx - Expo config context
 * @returns Expo app configuration
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Fishtownco",
  slug: "fishtownco",
  scheme: "fishtownco",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  icon: `${BRAND_ROOT}/icon.png`,
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.itoasis.Fishtownco",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: `${BRAND_ROOT}/adaptive-icon.png`,
      backgroundColor: SPLASH_BG,
      monochromeImage: `${BRAND_ROOT}/adaptive-icon.png`,
    },
    package: "com.itoasis.Fishtownco",
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: `${BRAND_ROOT}/favicon.png`,
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-font",
    [
      "expo-splash-screen",
      {
        enableFullScreenImage_legacy: false,
        resizeMode: "cover",
        ios: {
          image: `${BRAND_ROOT}/splash.png`,
          backgroundColor: SPLASH_BG,
          resizeMode: "contain",
        },
        android: {
          image: `${BRAND_ROOT}/splash.png`,
          backgroundColor: SPLASH_BG,
          imageWidth: 240,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  runtimeVersion: {
    policy: "appVersion",
  },
  updates: {
    url: "https://u.expo.dev/985db04d-69f5-433b-bd3f-7266b4ec2275",
  },
  extra: {
    appBrand: "fishtownco",
    eas: {
      projectId: "985db04d-69f5-433b-bd3f-7266b4ec2275",
    },
  },
});
