import { resolveAppLaunchRoute } from "@/features/auth/utils/resolveAppLaunchRoute";
import { useOnboardingStore } from "@/features/onboarding/store/onboardingStore";
import { colors } from "@/constants/theme";
import { Redirect, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

/**
 * App entry after native splash — resolves Welcome vs Login like Foori.
 * @returns Redirect or boot loader
 */
export default function Index() {
  const hasCompletedOnboarding = useOnboardingStore(
    (s) => s.hasCompletedOnboarding
  );
  const [isReady, setIsReady] = useState(false);
  const [redirectTo, setRedirectTo] = useState<Href | null>(null);

  useEffect(() => {
    let cancelled = false;

    const resolveLaunch = () => {
      try {
        const route = resolveAppLaunchRoute(hasCompletedOnboarding);
        if (!cancelled) {
          setRedirectTo(route);
        }
      } catch {
        if (!cancelled) {
          setRedirectTo("/welcome");
        }
      } finally {
        if (!cancelled) {
          setIsReady(true);
        }
      }
    };

    resolveLaunch();

    return () => {
      cancelled = true;
    };
  }, [hasCompletedOnboarding]);

  if (!(isReady && redirectTo)) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={colors.orange} />
      </View>
    );
  }

  return <Redirect href={redirectTo} />;
}

const styles = {
  boot: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    backgroundColor: colors.background,
  },
};
