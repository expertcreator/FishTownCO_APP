import { Ionicons } from "@expo/vector-icons";
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors, useTheme, type ThemeColors } from "@/ui/theme";
import { useTranslation } from "@/ui/translations";
import { PrimaryButton } from "./Buttons";
import AppText from "./Text";

type LogoutModalProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
};

/**
 * Logout confirmation sheet. Copy comes from `auth.log-out-*` and
 * `common.cancel`. Colors follow the active light or dark palette, and the
 * close button flips when the locale is RTL.
 * @param props - Sheet props
 * @param props.visible - Whether the sheet is shown
 * @param props.onClose - Dismiss handler (backdrop, back, close, Cancel)
 * @param props.onConfirm - Confirm handler
 * @param props.loading - Disables actions and shows a spinner on confirm
 * @returns Logout confirmation modal
 */
export function LogoutModal({
  visible,
  onClose,
  onConfirm,
  loading = false,
}: LogoutModalProps) {
  const colors = useColors();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { t, isRTL, direction } = useTranslation();
  const styles = getStyles(colors, isDark);

  const dismiss = () => {
    if (loading) return;
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={dismiss}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={dismiss} />
        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 20) },
          ]}
        >
          <View style={styles.handle} />
          <Pressable
            onPress={dismiss}
            disabled={loading}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t("common.close")}
            style={({ pressed }) => [
              styles.closeBtn,
              isRTL ? styles.closeBtnStart : styles.closeBtnEnd,
              pressed && !loading && styles.pressed,
              loading && styles.disabled,
            ]}
          >
            <Ionicons name="close" size={20} color={colors.navy} />
          </Pressable>

          <View style={styles.iconWrap}>
            <Ionicons name="log-out-outline" size={30} color={colors.orange} />
          </View>

          <AppText
            style={[styles.title, { writingDirection: direction }]}
          >
            {t("auth.log-out-title")}
          </AppText>
          <AppText
            style={[styles.description, { writingDirection: direction }]}
          >
            {t("auth.log-out-description")}
          </AppText>

          <PrimaryButton
            label={t("auth.log-out")}
            icon={loading ? null : "log-out-outline"}
            iconPosition="leading"
            loading={loading}
            onPress={onConfirm}
            style={styles.confirmBtn}
          />
          <Pressable
            onPress={dismiss}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel={t("common.cancel")}
            style={({ pressed }) => [
              styles.cancelBtn,
              pressed && !loading && styles.pressed,
              loading && styles.disabled,
            ]}
          >
            <AppText style={[styles.cancelText, { writingDirection: direction }]}>
              {t("common.cancel")}
            </AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Builds the centered logout-sheet styles for the active palette.
 * @param colors - Active theme colors
 * @param isDark - Whether the dark palette is active
 * @returns Style sheet
 */
function getStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: isDark ? "rgba(0,0,0,0.62)" : "rgba(13,44,65,0.45)",
    },
    backdrop: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    sheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 22,
      paddingTop: 8,
      alignItems: "center",
      shadowColor: "#0D2C41",
      shadowOffset: { width: 0, height: -8 },
      shadowOpacity: isDark ? 0.35 : 0.12,
      shadowRadius: 18,
      elevation: 16,
    },
    handle: {
      width: 42,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginBottom: 18,
    },
    closeBtn: {
      position: "absolute",
      top: 16,
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.cardSoft,
    },
    closeBtnEnd: {
      right: 16,
    },
    closeBtnStart: {
      left: 16,
    },
    iconWrap: {
      width: 76,
      height: 76,
      borderRadius: 38,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.softOrange,
      borderWidth: 1,
      borderColor: colors.attentionBorder,
      marginBottom: 16,
    },
    title: {
      color: colors.navy,
      fontSize: 20,
      fontWeight: "800",
      textAlign: "center",
      letterSpacing: 0.2,
      lineHeight: 26,
      marginBottom: 8,
      paddingHorizontal: 12,
    },
    description: {
      color: colors.muted,
      fontSize: 15,
      fontWeight: "500",
      textAlign: "center",
      lineHeight: 22,
      marginBottom: 22,
      paddingHorizontal: 8,
    },
    confirmBtn: {
      alignSelf: "stretch",
      marginBottom: 10,
    },
    cancelBtn: {
      alignSelf: "stretch",
      minHeight: 48,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    cancelText: {
      color: colors.navy,
      fontSize: 15,
      fontWeight: "700",
    },
    pressed: { opacity: 0.85 },
    disabled: { opacity: 0.6 },
  });
}
