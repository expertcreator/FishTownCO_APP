import { resolveAppLaunchRoute } from "@/features/auth/utils/resolveAppLaunchRoute";
import { firebaseAuth } from "@/features/common/firebase";
import { useOnboardingStore } from "@/features/onboarding/store/onboardingStore";
import { AppBootSkeleton } from "@/ui/components";
import { useColors, type ThemeColors } from "@/ui/theme";
import { onAuthStateChanged } from "@react-native-firebase/auth";
import { Redirect, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";

/**
 * App entry after native splash.
 * Waits for onboarding hydration and Firebase Auth restore, then routes to
 * Welcome, Login, or Home so a restart keeps an existing session.
 * @returns Redirect or boot skeleton
 */
export default function Index() {
  const colors = useColors();
  const styles = getStyles(colors);

  const hasCompletedOnboarding = useOnboardingStore(
    (s) => s.hasCompletedOnboarding
  );
  const [onboardingHydrated, setOnboardingHydrated] = useState(() =>
    useOnboardingStore.persist.hasHydrated()
  );
  const [isReady, setIsReady] = useState(false);
  const [redirectTo, setRedirectTo] = useState<Href | null>(null);

  useEffect(() => {
    if (onboardingHydrated) return;
    return useOnboardingStore.persist.onFinishHydration(() => {
      setOnboardingHydrated(true);
    });
  }, [onboardingHydrated]);

  useEffect(() => {
    if (!onboardingHydrated) return;

    let cancelled = false;

    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      if (cancelled) return;
      try {
        setRedirectTo(
          resolveAppLaunchRoute(hasCompletedOnboarding, Boolean(user))
        );
      } catch {
        setRedirectTo("/welcome");
      } finally {
        setIsReady(true);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [hasCompletedOnboarding, onboardingHydrated]);

  if (!(isReady && redirectTo)) {
    return (
      <View style={styles.boot}>
        <AppBootSkeleton />
      </View>
    );
  }

  return <Redirect href={redirectTo} />;
}

/**
 * Builds boot-loader styles for the active palette.
 * @param colors - Active theme colors
 * @returns Style object
 */
function getStyles(colors: ThemeColors) {
  return {
    boot: {
      flex: 1,
      backgroundColor: colors.background,
    },
  };
}
