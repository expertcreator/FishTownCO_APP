import { BrandLogoWarmup } from "@/features/auth/components/BrandLogoWarmup/BrandLogoWarmup";
import { configureGoogleSignIn } from "@/features/auth/utils/configureGoogleSignIn";
import { queryClient } from "@/features/common/firebase";
import { prefetchSafetyCategories } from "@/features/safety/services/prefetchSafetyCategories";
import {
  NetworkStatusProvider,
  SafeKeyboardProvider,
  ToastifyProvider,
} from "@/ui/components";
import { prefetchBrandLogos } from "@/features/auth/utils/prefetchBrandLogos";
import { ThemeProvider, useColors, useTheme } from "@/ui/theme";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useLayoutEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

/**
 * Safety cap so the native splash cannot stick if the entry route never
 * resolves. The entry screen hides it as soon as Welcome, Login, or Home is ready.
 */
const SPLASH_MAX_MS = 8000;

/**
 * Root layout for Fishtownco.
 * Prefetches brand logos and Firestore safety categories while the native splash is up.
 * The entry route hides that splash once Welcome, Login, or Home is ready.
 * @returns Root navigation tree
 */
export default function RootLayout() {
  useLayoutEffect(() => {
    configureGoogleSignIn();
  }, []);

  useLayoutEffect(() => {
    Promise.all([
      Promise.race([
        prefetchBrandLogos(),
        new Promise<void>((resolve) => setTimeout(resolve, 2500)),
      ]),
      Promise.race([
        prefetchSafetyCategories(),
        new Promise<void>((resolve) => setTimeout(resolve, 4000)),
      ]),
    ]).catch(() => undefined);

    const splashCap = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => undefined);
    }, SPLASH_MAX_MS);

    return () => {
      clearTimeout(splashCap);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ThemeProvider>
            <ThemedShell />
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

/**
 * App shell that follows the active light or dark palette.
 * @returns Themed navigation tree
 */
function ThemedShell() {
  const colors = useColors();
  const { isDark } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <BrandLogoWarmup />
      <NetworkStatusProvider>
        <SafeKeyboardProvider>
          <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
            <Stack.Screen name="index" options={{ animation: "none" }} />
          </Stack>
        </SafeKeyboardProvider>
      </NetworkStatusProvider>
      <ToastifyProvider
        config={{
          theme: {
            backgroundColor: colors.card,
            textColor: colors.navy,
            textSecondaryColor: colors.muted,
            borderColor: colors.border,
            shadowColor: isDark ? "#000000" : colors.navy,
          },
        }}
      />
    </View>
  );
}

