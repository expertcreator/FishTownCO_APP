import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PrimaryButton } from "@/ui/components/Buttons";
import AppText from "@/ui/components/Text";
import { Toastify } from "@/ui/components/Toast";
import { useNetworkStore } from "@/ui/stores/networkStore";
import { useColors } from "@/ui/theme";
import { useTranslation } from "@/ui/translations";
import { verifyNetworkUsability } from "@/ui/utils/verifyNetworkUsability";

const ICON_SIZE = 80;

const androidTextStyle = Platform.select({
  android: { includeFontPadding: false as const },
  default: {},
});

type OfflineScreenProps = {
  onRetry?: () => Promise<unknown> | unknown;
};

/**
 * Full-screen offline state: network icon, message, and refresh button.
 * Shown inside a root Modal when the app has no usable connectivity,
 * or in-place when a screen reuses this same UI after a load failure.
 * @param props - Screen props
 * @param props.onRetry - Optional extra work after connectivity is verified
 * @returns Offline screen element
 */
export function OfflineScreen({ onRetry }: OfflineScreenProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const storeVerifying = useNetworkStore((s) => s.isVerifying);
  const [refreshing, setRefreshing] = useState(false);
  const isBusy = refreshing || storeVerifying;

  const handleRefresh = () => {
    setRefreshing(true);
    verifyNetworkUsability()
      .then(async (usable) => {
        if (!usable) {
          return;
        }
        if (onRetry) {
          await Promise.resolve(onRetry()).catch(() => {});
        }
        Toastify.success(t("network-welcome-back", "Welcome back"));
      })
      .finally(() => {
        setRefreshing(false);
      });
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <Ionicons
            name="cloud-offline-outline"
            size={ICON_SIZE}
            color={colors.muted}
          />
        </View>
        <AppText
          style={[
            styles.title,
            androidTextStyle,
            { color: colors.navy },
          ]}
        >
          {t("network-no-connection", "No Internet Connection")}
        </AppText>
        <AppText
          style={[
            styles.description,
            androidTextStyle,
            { color: colors.muted },
          ]}
        >
          {t(
            "network-check-and-retry",
            "Please check your network and try again."
          )}
        </AppText>
        <PrimaryButton
          label={t("network-refresh", "Refresh")}
          onPress={handleRefresh}
          loading={isBusy}
          disabled={isBusy}
          icon="refresh"
          iconPosition="leading"
          style={styles.refreshButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 32,
    maxWidth: 340,
  },
  iconWrapper: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    marginBottom: 12,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  description: {
    marginBottom: 24,
    fontSize: 15,
    lineHeight: 21,
    textAlign: "center",
  },
  refreshButton: {
    minWidth: 200,
    marginTop: 8,
  },
});
