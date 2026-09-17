import { GradientButton } from "@/features/auth/components";
import { AppText } from "@/shared/components";
import { Toastify } from "@/shared/components/Toast";
import { fontSizes } from "@/shared/constants";
import { MaterialIcons } from "@/shared/imports";
import { useNetworkStore } from "@/shared/stores/networkStore";
import { useColors, useTheme } from "@/shared/theme";
import { useTranslation } from "@/shared/translations";
import { verifyNetworkUsability } from "@/shared/utils/verifyNetworkUsability";
import { useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { moderateScale } from "react-native-size-matters";

const ICON_SIZE = moderateScale(80);

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
 * Refresh re-checks NetInfo and probes the API before dismissing.
 * @param props - Screen props
 * @param props.onRetry - Optional extra work after connectivity is verified (e.g. refetch)
 * @returns Offline screen element
 */
export function OfflineScreen({ onRetry }: OfflineScreenProps) {
  const colors = useColors();
  const { fonts } = useTheme();
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
          <MaterialIcons
            name="signal-wifi-off"
            size={ICON_SIZE}
            color={colors.textSecondary}
          />
        </View>
        <AppText
          style={[
            styles.title,
            androidTextStyle,
            {
              color: colors.text,
              fontFamily: fonts.heading,
              fontSize: fontSizes.h4,
            },
          ]}
          textAlign="center"
        >
          {t("network-no-connection", "No Internet Connection")}
        </AppText>
        <AppText
          style={[
            styles.description,
            androidTextStyle,
            {
              color: colors.textSecondary,
              fontFamily: fonts.subTitle,
              fontSize: fontSizes.p,
              lineHeight: fontSizes.p * 1.4,
            },
          ]}
          textAlign="center"
        >
          {t(
            "network-check-and-retry",
            "Please check your network and try again."
          )}
        </AppText>
        <GradientButton
          title={t("network-refresh", "Refresh")}
          onPress={handleRefresh}
          loading={isBusy}
          disabled={isBusy}
          gradientColors={[colors.primary1, colors.primary]}
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
    paddingHorizontal: moderateScale(32),
    maxWidth: 340,
  },
  iconWrapper: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: moderateScale(24),
  },
  title: {
    marginBottom: moderateScale(12),
  },
  description: {
    marginBottom: moderateScale(24),
  },
  refreshButton: {
    minWidth: moderateScale(200),
    marginTop: moderateScale(8),
  },
});
