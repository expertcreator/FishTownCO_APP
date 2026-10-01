import type { ConfigContext, ExpoConfig } from "expo/config";

/** Cream from https://fishtownco.itoasis.co/ (welcome / onboarding canvas). */
const SPLASH_BG = "#F3EBDD";
const BRAND_ROOT = "./assets/branding/fishtownco";

/**
 * Resolves the Google Maps key the same way as the customer app.
 * @returns Trimmed Maps API key, or empty string
 */
function resolveGoogleMapsKey(): string {
  return (
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ??
    process.env.GOOGLE_MAPS_API_KEY ??
    ""
  ).trim();
}

/**
 * Expo config for Fishtownco.
 * Icon / adaptive-icon / splash sizes and plugin options match Foori:
 * 1024×1024 assets, enableFullScreenImage_legacy false, android imageWidth 240.
 * Google Maps wiring matches the customer app (`react-native-maps` plugin with
 * both platform keys).
 * @param ctx - Expo config context
 * @returns Expo app configuration
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const googleMapsKey = resolveGoogleMapsKey();

  return {
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
      usesAppleSignIn: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: `${BRAND_ROOT}/adaptive-icon.png`,
        backgroundColor: SPLASH_BG,
        monochromeImage: `${BRAND_ROOT}/adaptive-icon.png`,
      },
      package: "com.itoasis.Fishtownco",
      googleServicesFile: "./google-services.json",
      config: {
        googleMaps: {
          apiKey: googleMapsKey,
        },
      },
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
      "expo-location",
      [
        "react-native-maps",
        {
          // Same as customer app: library plugin owns both platforms.
          iosGoogleMapsApiKey: googleMapsKey,
          androidGoogleMapsApiKey: googleMapsKey,
        },
      ],
      [
        "expo-image-picker",
        {
          photosPermission:
            "Allow Fishtownco to access your photos for certificates and safety item images.",
          cameraPermission:
            "Allow Fishtownco to use the camera to take photos of certificates and safety items.",
        },
      ],
      "expo-image",
      "@react-native-firebase/app",
      "@react-native-firebase/auth",
      "@react-native-google-signin/google-signin",
      "./plugins/withIosAppleSignIn",
      "./plugins/withAndroidReleaseSigning",
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
      [
        "expo-build-properties",
        {
          android: {
            // Required by recent Google / Firebase Android stacks
            minSdkVersion: 24,
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
      /** Same runtime key surface as customer app. */
      googleMapsApiKey: googleMapsKey,
      eas: {
        projectId: "985db04d-69f5-433b-bd3f-7266b4ec2275",
      },
    },
  };
};
