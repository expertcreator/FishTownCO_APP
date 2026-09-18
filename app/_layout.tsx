import { BrandLogoWarmup } from "@/features/auth/components/BrandLogoWarmup/BrandLogoWarmup";
import { SafeKeyboardProvider } from "@/shared/components";
import { prefetchBrandLogos } from "@/features/auth/utils/prefetchBrandLogos";
import { colors } from "@/constants/theme";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useLayoutEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

/** Minimum time the native splash stays visible before `hideAsync` (Foori: 1000ms). */
const SPLASH_HIDE_DELAY_MS = 1000;

/**
 * Root layout for Fishtownco — native splash hide matches Foori pattern.
 * @returns Root navigation tree
 */
export default function RootLayout() {
  useLayoutEffect(() => {
    let cancelled = false;

    (async () => {
      await Promise.race([
        prefetchBrandLogos(),
        new Promise<void>((resolve) => setTimeout(resolve, 2500)),
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
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <BrandLogoWarmup />
        <SafeKeyboardProvider>
          <Stack screenOptions={{ headerShown: false, animation: "fade" }} />
        </SafeKeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
