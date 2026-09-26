import { BrandLogoWarmup } from "@/features/auth/components/BrandLogoWarmup/BrandLogoWarmup";
import { configureGoogleSignIn } from "@/features/auth/utils/configureGoogleSignIn";
import { queryClient } from "@/features/common/firebase";
import { prefetchSafetyCategories } from "@/features/safety/services/prefetchSafetyCategories";
import { SafeKeyboardProvider, ToastifyProvider } from "@/ui/components";
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

/** Minimum time the native splash stays visible before `hideAsync` (Foori: 1000ms). */
const SPLASH_HIDE_DELAY_MS = 1000;

/**
 * Root layout for Fishtownco — native splash hide matches Foori pattern.
 * Prefetches brand logos and Firestore safety categories while splash is up.
 * @returns Root navigation tree
 */
export default function RootLayout() {
  useLayoutEffect(() => {
    configureGoogleSignIn();
  }, []);

  useLayoutEffect(() => {
    let cancelled = false;

    (async () => {
      await Promise.all([
        Promise.race([
          prefetchBrandLogos(),
          new Promise<void>((resolve) => setTimeout(resolve, 2500)),
        ]),
        Promise.race([
          prefetchSafetyCategories(),
          new Promise<void>((resolve) => setTimeout(resolve, 4000)),
        ]),
      ]);
      await new Promise<void>((resolve) =>
        setTimeout(resolve, SPLASH_HIDE_DELAY_MS)
      );
      if (!cancelled) {
        SplashScreen.hideAsync().catch(() => undefined);
      }
    })().catch(() => {
      if (!cancelled) {
        SplashScreen.hideAsync().catch(() => undefined);
      }
    });

    return () => {
      cancelled = true;
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
      <SafeKeyboardProvider>
        <Stack screenOptions={{ headerShown: false, animation: "fade" }} />
      </SafeKeyboardProvider>
      <ToastifyProvider />
    </View>
  );
}

