import { useState, type ReactNode } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { deleteAccount } from "@/features/auth/services/deleteAccount";
import { getAuthErrorCode } from "@/features/auth/utils/mapAuthError";
import { logout } from "@/features/auth/services/logout";
import { useColors, useTheme, type ThemeColors } from "@/ui/theme";
import { useTranslation } from "@/ui/translations";
import { ConfirmModal } from "./ConfirmModal";
import { LogoutModal } from "./LogoutModal";
import { getPressedItemStyle } from "./pressableStyles";
import AppText from "./Text";
import { useToast } from "./Toast";

type AppHeaderProps = {
  title: string;
  /** Replaces the default theme + logout actions when provided. */
  right?: ReactNode;
  /** When true (default), shows theme toggle and logout on the right. Ignored if `right` is set. */
  showActions?: boolean;
  onLogoPress?: () => void;
  showBorder?: boolean;
};

/**
 * Branded top header used on main tabs (Home / Safety / Vessel / Wallet).
 * Logo on the left, centered title, theme toggle + logout on the right by default.
 * @param props - Header props
 * @param props.title - Centered screen title
 * @param props.right - Optional custom right-side content (replaces default actions)
 * @param props.showActions - Whether to show theme + logout (default true)
 * @param props.onLogoPress - Logo press handler (defaults to Home tab)
 * @param props.showBorder - Whether to show the bottom border
 * @returns App header element
 */
export function AppHeader({
  title,
  right,
  showActions = true,
  onLogoPress,
  showBorder = true,
}: AppHeaderProps) {
  const colors = useColors();
  const styles = getStyles(colors);

  return (
    <View style={[styles.wrap, showBorder && styles.border]}>
      <View style={styles.row}>
        <Pressable
          onPress={onLogoPress ?? (() => router.push("/(tabs)/home"))}
          style={({ pressed }) => [styles.side, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Fishtown Co Home"
        >
          <Image
            source={require("@/assets/from-design/welcome/welcome-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </Pressable>

        <AppText style={styles.title} numberOfLines={1}>
          {title}
        </AppText>

        <View style={[styles.side, styles.right]}>
          {right ?? (showActions ? <AppHeaderActions /> : null)}
        </View>
      </View>
    </View>
  );
}

/**
 * Theme toggle, delete account, and logout icons on tab headers.
 * @returns Header action buttons
 */
function AppHeaderActions() {
  const colors = useColors();
  const { isDark, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const toast = useToast();
  const styles = getStyles(colors);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  /**
   * Deletes the Firebase account and returns to the login screen.
   * @returns Promise that resolves when navigation starts or a toast is shown
   */
  const onConfirmDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await deleteAccount();
      setDeleteOpen(false);
      toast.success(t("auth.delete-account-success"));
      router.replace("/(auth)/login");
    } catch (error) {
      const code = getAuthErrorCode(error);
      toast.error(
        code === "auth/requires-recent-login"
          ? t("auth.delete-account-recent-login")
          : t("auth.delete-account-failed")
      );
    } finally {
      setDeleting(false);
    }
  };

  /**
   * Signs out of Firebase Auth and returns to the login screen.
   * @returns Promise that resolves when navigation starts or a toast is shown
   */
  const onConfirmLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      setLogoutOpen(false);
      toast.success(t("auth.log-out-success"));
      router.replace("/(auth)/login");
    } catch {
      setLogoutOpen(false);
      toast.error(t("auth.log-out-failed"));
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <View style={styles.actions}>
      <Pressable
        onPress={toggleTheme}
        hitSlop={10}
        style={({ pressed }) => [
          styles.actionButton,
          getPressedItemStyle(pressed),
        ]}
        accessibilityRole="button"
        accessibilityLabel={
          isDark ? t("app.theme-light") : t("app.theme-dark")
        }
      >
        <Ionicons
          name={isDark ? "sunny-outline" : "moon-outline"}
          size={22}
          color={colors.navy}
        />
      </Pressable>
      <Pressable
        onPress={() => setDeleteOpen(true)}
        hitSlop={10}
        style={({ pressed }) => [
          styles.actionButton,
          getPressedItemStyle(pressed),
        ]}
        accessibilityRole="button"
        accessibilityLabel={t("auth.delete-account")}
      >
        <Ionicons name="trash-outline" size={22} color={colors.navy} />
      </Pressable>
      <Pressable
        onPress={() => setLogoutOpen(true)}
        hitSlop={10}
        style={({ pressed }) => [
          styles.actionButton,
          getPressedItemStyle(pressed),
        ]}
        accessibilityRole="button"
        accessibilityLabel={t("auth.log-out")}
      >
        <Ionicons name="log-out-outline" size={22} color={colors.navy} />
      </Pressable>
      <LogoutModal
        visible={logoutOpen}
        loading={loggingOut}
        onClose={() => setLogoutOpen(false)}
        onConfirm={() => {
          void onConfirmLogout();
        }}
      />
      <ConfirmModal
        visible={deleteOpen}
        title={t("auth.delete-account-title")}
        description={t("auth.delete-account-description")}
        confirmLabel={t("auth.delete-account")}
        icon="trash-outline"
        loading={deleting}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          void onConfirmDelete();
        }}
      />
    </View>
  );
}

/**
 * Builds app-header styles for the active palette.
 * @param colors - Active theme colors
 * @returns Style sheet
 */
function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      backgroundColor: colors.card,
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginHorizontal: -20,
      marginTop: -8,
      marginBottom: 12,
    },
    border: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    row: {
      minHeight: 44,
      flexDirection: "row",
      alignItems: "center",
    },
    side: {
      width: 112,
      height: 36,
      justifyContent: "center",
    },
    right: {
      alignItems: "flex-end",
    },
    actions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
    },
    actionButton: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
    },
    logo: {
      width: 88,
      height: 32,
    },
    title: {
      flex: 1,
      textAlign: "center",
      color: colors.navy,
      fontSize: 17,
      fontWeight: "700",
    },
    pressed: { opacity: 0.75 },
  });
}
