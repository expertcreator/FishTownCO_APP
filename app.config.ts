import type { ConfigContext, ExpoConfig } from "expo/config";

/** Cream from https://fishtownco.itoasis.co/ (welcome / onboarding canvas). */
const SPLASH_BG = "#F3EBDD";
const BRAND_ROOT = "./assets/branding/fishtownco";

/**
 * Resolves one Google Maps key from the public env.
 * @param name - Env var name
 * @param fallback - Value used when that var is empty
 * @returns Trimmed Maps API key, or empty string
 */
function resolveGoogleMapsKey(name: string, fallback = ""): string {
  return (process.env[name] ?? fallback).trim();
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
  const androidMapsKey = resolveGoogleMapsKey(
    "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY",
    process.env.GOOGLE_MAPS_API_KEY ?? ""
  );
  const iosMapsKey = resolveGoogleMapsKey(
    "EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY",
    androidMapsKey
  );

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
      // iPad gets all four orientations (Expo adds them; App Store requires them for multitasking).
      supportsTablet: true,
      bundleIdentifier: "com.itoasis.Fishtownco",
      // Build number for Xcode archives / TestFlight. Raise it for every upload.
      // (EAS builds ignore this and use the remote build number from eas.json.)
      buildNumber: "2",
      /** Client's Apple Developer team. */
      appleTeamId: "5G3N4M29YF",
      usesAppleSignIn: true,
      googleServicesFile: "./GoogleService-Info.plist",
      backgroundColor: SPLASH_BG,
      config: {
        googleMapsApiKey: iosMapsKey,
        // Only standard HTTPS. Skips the export-compliance prompt per upload.
        usesNonExemptEncryption: false,
      },
      infoPlist: {
        // iPhone stays portrait only (`orientation` would also allow upside down).
        UISupportedInterfaceOrientations: ["UIInterfaceOrientationPortrait"],
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: `${BRAND_ROOT}/adaptive-icon.png`,
        backgroundColor: SPLASH_BG,
        monochromeImage: `${BRAND_ROOT}/adaptive-icon.png`,
      },
      package: "com.itoasis.Fishtownco",
      // Version code for Play Console uploads. Raise it for every upload.
      // (EAS builds ignore this and use the remote version code from eas.json.)
      versionCode: 3,
      googleServicesFile: "./google-services.json",
      config: {
        googleMaps: {
          apiKey: androidMapsKey,
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
      [
        "expo-secure-store",
        {
          faceIDPermission: false,
        },
      ],
      "expo-font",
      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "Fishtownco uses your location while you add a safety item, so it can be placed on the vessel map.",
          locationAlwaysAndWhenInUsePermission: false,
          locationAlwaysPermission: false,
          motionUsagePermission: false,
        },
      ],
      [
        "expo-notifications",
        {
          defaultChannel: "default_high",
        },
      ],
      [
        "react-native-maps",
        {
          // Same as customer app: library plugin owns both platforms.
          iosGoogleMapsApiKey: iosMapsKey,
          androidGoogleMapsApiKey: androidMapsKey,
        },
      ],
      [
        "expo-image-picker",
        {
          photosPermission:
            "Allow Fishtownco to access your photos for certificates and safety item images.",
          cameraPermission:
            "Allow Fishtownco to use the camera to take photos of certificates and safety items.",
          microphonePermission: false,
        },
      ],
      "expo-image",
      
      // Stripe disabled
      /*
      [
        "@stripe/stripe-react-native",
        {
          merchantIdentifier: "merchant.com.itoasis.Fishtownco",
          enableGooglePay: false,
        },
      ],
      */

      // RevenueCat enabled (No special config plugin required in plugins array for basic purchases, SDK handles it)

      [
        "@react-native-firebase/app",
        {
          // Resolve Firebase through CocoaPods. SPM needs dynamic frameworks.
          ios: { disableSPM: true },
        },
      ],
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
            imageWidth: 240,
          },
          android: {
            image: `${BRAND_ROOT}/splash.png`,
            backgroundColor: SPLASH_BG,
            imageWidth: 180,
          },
        },
      ],
      [
        "expo-build-properties",
        {
          android: {
            // Required by recent Google / Firebase Android stacks
            minSdkVersion: 24,
            // Compress native libraries so a sideloaded APK installs.
            // Uncompressed libs install with adb and fail from the phone installer.
            useLegacyPackaging: true,
          },
          ios: {
            // Firebase iOS pods need frameworks for their Swift modules.
            useFrameworks: "static",
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
      googleMapsApiKey: androidMapsKey,
      googleMapsIosApiKey: iosMapsKey,
      eas: {
        projectId: "985db04d-69f5-433b-bd3f-7266b4ec2275",
      },
    },
  };
};