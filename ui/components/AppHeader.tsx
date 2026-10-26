import type { ReactNode } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useColors, type ThemeColors } from "@/ui/theme";
import { useTranslation } from "@/ui/translations";
import { getPressedItemStyle } from "./pressableStyles";
import AppText from "./Text";

type AppHeaderProps = {
  title: string;
  /** Replaces the default settings button when provided. */
  right?: ReactNode;
  /** When true (default), shows the settings button on the right. Ignored if `right` is set. */
  showActions?: boolean;
  onLogoPress?: () => void;
  showBorder?: boolean;
};

/**
 * Branded top header used on main tabs (Home / Safety / Vessel / Wallet).
 * Logo on the left, centered title, settings (gear) button on the right by default.
 * Theme, log out, and delete account live on the Settings screen.
 * @param props - Header props
 * @param props.title - Centered screen title
 * @param props.right - Optional custom right-side content (replaces default actions)
 * @param props.showActions - Whether to show the settings button (default true)
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
 * Settings (gear) button on tab headers. Opens the Settings screen.
 * @returns Header action button
 */
function AppHeaderActions() {
  const colors = useColors();
  const { t } = useTranslation();
  const styles = getStyles(colors);

  return (
    <View style={styles.actions}>
      <Pressable
        onPress={() => router.push("/settings")}
        hitSlop={10}
        style={({ pressed }) => [
          styles.actionButton,
          getPressedItemStyle(pressed),
        ]}
        accessibilityRole="button"
        accessibilityLabel={t("settings.open")}
      >
        <Ionicons name="settings-outline" size={24} color={colors.navy} />
      </Pressable>
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
