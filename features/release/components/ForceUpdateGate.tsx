import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import * as SplashScreen from "expo-splash-screen";
import { type ReactNode, useEffect } from "react";
import {
  ActivityIndicator,
  AppState,
  BackHandler,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  APP_CONFIG_QUERY_KEY,
  useForceUpdate,
} from "@/features/release/services/forceUpdate";
import {
  APP_STORE_NATIVE_URL,
  APP_STORE_URL,
  PLAY_STORE_MARKET_URL,
  PLAY_STORE_URL,
} from "@/features/release/storeLinks";
import { AppText } from "@/ui/components";
import { useColors, type ThemeColors } from "@/ui/theme";
import { useTranslation } from "@/ui/translations";

type ForceUpdateGateProps = {
  children: ReactNode;
};

/**
 * Blocks the app when Firestore says this build is below the minimum version.
 * A failed config read leaves the app usable.
 * @param props - Gate props
 * @param props.children - The rest of the app
 * @returns The app, a loader, or the update screen
 */
export function ForceUpdateGate({ children }: ForceUpdateGateProps) {
  const { isPending, isUpdateRequired } = useForceUpdate();

  useEffect(() => {
    if (!isUpdateRequired) return;
    SplashScreen.hideAsync().catch(() => undefined);
  }, [isUpdateRequired]);

  if (isUpdateRequired) {
    return <ForceUpdateModal />;
  }

  if (isPending) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  }

  return children;
}

/**
 * Full-screen update prompt. Back and the close request do not dismiss it.
 * @returns Blocking update screen
 */
function ForceUpdateModal() {
  const colors = useColors();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => true
    );
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    let previous = AppState.currentState;
    const subscription = AppState.addEventListener("change", (next) => {
      const returned =
        /inactive|background/.test(previous) && next === "active";
      previous = next;
      if (!returned) return;
      queryClient
        .invalidateQueries({ queryKey: APP_CONFIG_QUERY_KEY })
        .catch(() => undefined);
    });
    return () => subscription.remove();
  }, [queryClient]);

  return (
    <Modal
      visible
      transparent={false}
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => undefined}
    >
      <View
        style={[
          styles.container,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
      >
        <View style={styles.card}>
          <Image
            source={require("@/assets/from-design/welcome/welcome-logo.png")}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="Fishtown Co logo"
          />
          <View style={styles.pill}>
            <AppText style={styles.eyebrow}>{t("force-update.eyebrow")}</AppText>
          </View>
          <AppText style={styles.title}>{t("force-update.title")}</AppText>
          <AppText style={styles.message}>{t("force-update.message")}</AppText>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void openStore();
            }}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <AppText style={styles.buttonText}>{t("force-update.action")}</AppText>
            <Ionicons name="arrow-forward" size={18} color={colors.white} />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Opens Google Play on Android, or the App Store listing on iOS.
 * @returns Promise that resolves when the store link has been requested
 */
async function openStore(): Promise<void> {
  try {
    if (Platform.OS === "android") {
      const canOpenMarket = await Linking.canOpenURL(PLAY_STORE_MARKET_URL).catch(
        () => false
      );
      await Linking.openURL(canOpenMarket ? PLAY_STORE_MARKET_URL : PLAY_STORE_URL);
      return;
    }
    const canOpenAppStore = await Linking.canOpenURL(APP_STORE_NATIVE_URL).catch(
      () => false
    );
    await Linking.openURL(canOpenAppStore ? APP_STORE_NATIVE_URL : APP_STORE_URL);
  } catch {
    // The screen stays up when the store cannot be opened.
  }
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

/**
 * Builds the blocking update screen styles.
 * @param colors - Active theme colors
 * @returns Style sheet
 */
function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 22,
      alignItems: "center",
      justifyContent: "center",
    },
    card: {
      width: "100%",
      maxWidth: 380,
      backgroundColor: colors.card,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 22,
      paddingTop: 28,
      paddingBottom: 22,
      alignItems: "center",
      shadowColor: colors.navy,
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 4,
    },
    logo: {
      width: 220,
      height: 92,
      marginBottom: 18,
    },
    pill: {
      backgroundColor: colors.softTeal,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginBottom: 14,
    },
    eyebrow: {
      color: colors.teal,
      letterSpacing: 1.6,
      fontSize: 11,
      fontWeight: "800",
      textAlign: "center",
    },
    title: {
      color: colors.navy,
      fontSize: 24,
      lineHeight: 30,
      fontWeight: "800",
      textAlign: "center",
      marginBottom: 10,
    },
    message: {
      color: colors.muted,
      fontSize: 15,
      lineHeight: 22,
      textAlign: "center",
      marginBottom: 22,
    },
    button: {
      alignSelf: "stretch",
      backgroundColor: colors.orange,
      borderRadius: 14,
      height: 54,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
    },
    buttonPressed: {
      opacity: 0.88,
    },
    buttonText: {
      color: colors.white,
      fontSize: 16,
      fontWeight: "700",
    },
  });
}
