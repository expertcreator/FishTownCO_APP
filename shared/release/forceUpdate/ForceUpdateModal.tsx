import { useQueryClient } from "@tanstack/react-query";
import * as Application from "expo-application";
import { useEffect } from "react";
import {
  AppState,
  type AppStateStatus,
  BackHandler,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  getAppConfigQueryKey,
  isNumericAppStoreId,
} from "./forceUpdateCore";
import { getSheetModalTitleTypography } from "@/shared/constants";
import { moderateScale } from "react-native-size-matters";

/** Legacy customer-app listing — used only when `iosAppStoreId` is omitted. */
const LEGACY_IOS_APP_STORE_URL = "https://apps.apple.com/app/id6766233890";


async function openAppStoreForUpdate(iosAppStoreId?: string): Promise<void> {
  try {
    if (Platform.OS === "android") {
      const pkg = Application.applicationId;
      if (!pkg) {
        return;
      }
      const market = `market://details?id=${encodeURIComponent(pkg)}`;
      const web = `https://play.google.com/store/apps/details?id=${encodeURIComponent(
        pkg
      )}`;
      const canOpenMarket = await Linking.canOpenURL(market).catch(() => false);
      await Linking.openURL(canOpenMarket ? market : web);
      return;
    }
    if (Platform.OS !== "ios") {
      return;
    }
    const appleId = isNumericAppStoreId(iosAppStoreId)
      ? iosAppStoreId?.trim()
      : undefined;
    if (appleId) {
      const native = `itms-apps://apps.apple.com/app/id${appleId}`;
      const https = `https://apps.apple.com/app/id${appleId}`;
      const canOpenNative = await Linking.canOpenURL(native).catch(() => false);
      await Linking.openURL(canOpenNative ? native : https);
      return;
    }
    if (iosAppStoreId !== undefined) {
      return;
    }
    await Linking.openURL(LEGACY_IOS_APP_STORE_URL).catch(() => { });
  } catch {
    // Modal stays blocking even if store navigation fails.
  }
}

type ForceUpdateModalProps = {
  appId: string;
  visible: boolean;
  iosAppStoreId?: string;
};

export function ForceUpdateModal({
  appId,
  visible,
  iosAppStoreId,
}: ForceUpdateModalProps) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!visible || Platform.OS !== "android") {
      return;
    }
    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => sub.remove();
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    let previousState: AppStateStatus = AppState.currentState;
    const sub = AppState.addEventListener("change", (nextState) => {
      const returnedToForeground =
        previousState.match(/inactive|background/) && nextState === "active";
      previousState = nextState;

      if (returnedToForeground) {
        queryClient
          .invalidateQueries({
            queryKey: getAppConfigQueryKey(appId),
          })
          .catch(() => { });
      }
    });

    return () => sub.remove();
  }, [appId, queryClient, visible]);

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={() => { }}
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Update required</Text>
          <Text style={styles.message}>
            This version of the app is no longer supported. Please update to
            continue using the app.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              openAppStoreForUpdate(iosAppStoreId).catch(() => { });
            }}
            style={({ pressed }) => [
              styles.button,
              pressed ? styles.buttonPressed : null,
            ]}
          >
            <Text style={styles.buttonText}>Update Now</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  content: {
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
  },
  title: {
    ...getSheetModalTitleTypography(),
    lineHeight: moderateScale(22),
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    color: "#4B5563",
    textAlign: "center",
    marginBottom: 24,
  },
  button: {
    minWidth: 180,
    backgroundColor: "#111827",
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
