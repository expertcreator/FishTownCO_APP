import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { AppText } from "@/ui/components";
import { useTranslation } from "@/ui/translations";

const SOCIAL_BUTTON_HEIGHT = 48;
const SOCIAL_CORNER_RADIUS = 24;
const SOCIAL_BUTTON_BACKGROUND = "#FFFFFF";
const SOCIAL_BUTTON_TEXT = "#000000";
const SOCIAL_BUTTON_BORDER = "#747775";
const SOCIAL_BUTTON_PRESSED_BACKGROUND = "#F8F8F8";

const GOOGLE_ICON = require("@/assets/icons/google.png");

export type SocialAuthRowProps = {
  onPressGoogle?: () => void;
  onPressApple?: () => void;
  isGoogleLoading?: boolean;
  isAppleLoading?: boolean;
  disabled?: boolean;
  /** When true, Apple is shown on iOS only (customer-app rule). */
  showApple?: boolean;
};

/**
 * Google / Apple social auth buttons matching the customer-app SocialAuthRow.
 * Android: Google only. iOS: Apple + Google when `showApple` is true.
 * @param props - Social row props
 * @returns Social auth button column
 */
export function SocialAuthRow({
  onPressGoogle,
  onPressApple,
  isGoogleLoading = false,
  isAppleLoading = false,
  disabled = false,
  showApple = true,
}: SocialAuthRowProps) {
  const { t } = useTranslation();
  const styles = getStyles();
  const socialDisabled = isGoogleLoading || isAppleLoading || disabled;
  const showAppleButton = showApple && Platform.OS === "ios";

  return (
    <View style={styles.container}>
      {showAppleButton ? (
        <View
          style={[
            styles.buttonWrap,
            socialDisabled && styles.socialControlDisabled,
          ]}
          pointerEvents={socialDisabled ? "none" : "auto"}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("auth.continue-apple")}
            disabled={socialDisabled}
            onPress={onPressApple}
            style={({ pressed }) => [
              styles.socialButton,
              pressed && !socialDisabled && styles.socialButtonPressed,
            ]}
          >
            <View style={styles.socialContent}>
              <Ionicons name="logo-apple" size={22} color={SOCIAL_BUTTON_TEXT} />
              <AppText style={styles.socialLabel} numberOfLines={1}>
                {t("auth.continue-apple")}
              </AppText>
            </View>
          </Pressable>
          {isAppleLoading ? (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color={SOCIAL_BUTTON_TEXT} />
            </View>
          ) : null}
        </View>
      ) : null}

      <View
        style={[
          styles.buttonWrap,
          socialDisabled && styles.socialControlDisabled,
        ]}
        pointerEvents={socialDisabled ? "none" : "auto"}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("auth.continue-google")}
          disabled={socialDisabled}
          onPress={onPressGoogle}
          style={({ pressed }) => [
            styles.socialButton,
            pressed && !socialDisabled && styles.socialButtonPressed,
          ]}
        >
          <View style={styles.socialContent}>
            <Image
              source={GOOGLE_ICON}
              style={styles.googleIcon}
              resizeMode="contain"
            />
            <AppText style={styles.socialLabel} numberOfLines={1}>
              {t("auth.continue-google")}
            </AppText>
          </View>
        </Pressable>
        {isGoogleLoading ? (
          <View style={[styles.loadingOverlay, styles.googleLoadingOverlay]}>
            <ActivityIndicator color="#5F6368" />
          </View>
        ) : null}
      </View>
    </View>
  );
}

/**
 * Builds social-auth-row styles matching the customer app.
 * @returns Style sheet
 */
function getStyles() {
  return StyleSheet.create({
    container: {
      width: "100%",
      gap: 12,
    },
    buttonWrap: {
      position: "relative",
      width: "100%",
      height: SOCIAL_BUTTON_HEIGHT,
      alignItems: "center",
      justifyContent: "center",
    },
    socialButton: {
      width: "100%",
      height: SOCIAL_BUTTON_HEIGHT,
      borderRadius: SOCIAL_CORNER_RADIUS,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: SOCIAL_BUTTON_BACKGROUND,
      borderWidth: 1,
      borderColor: SOCIAL_BUTTON_BORDER,
    },
    socialButtonPressed: {
      backgroundColor: SOCIAL_BUTTON_PRESSED_BACKGROUND,
    },
    socialContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingHorizontal: 24,
    },
    googleIcon: {
      width: 20,
      height: 20,
    },
    socialLabel: {
      fontSize: 15,
      fontWeight: "600",
      color: SOCIAL_BUTTON_TEXT,
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFill,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0, 0, 0, 0.35)",
      borderRadius: SOCIAL_CORNER_RADIUS,
    },
    googleLoadingOverlay: {
      backgroundColor: "rgba(255, 255, 255, 0.65)",
    },
    socialControlDisabled: {
      opacity: 0.5,
    },
  });
}
