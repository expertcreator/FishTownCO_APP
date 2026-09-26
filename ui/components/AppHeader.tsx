import type { ReactNode } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { useColors, type ThemeColors } from "@/ui/theme";
import AppText from "./Text";

type AppHeaderProps = {
  title: string;
  right?: ReactNode;
  onLogoPress?: () => void;
  showBorder?: boolean;
};

/**
 * Branded top header used on main tabs (Home / Safety / Vessel).
 * Logo on the left, centered title, optional right action.
 * @param props - Header props
 * @param props.title - Centered screen title
 * @param props.right - Optional right-side action (e.g. logout)
 * @param props.onLogoPress - Logo press handler (defaults to Home tab)
 * @param props.showBorder - Whether to show the bottom border
 * @returns App header element
 */
export function AppHeader({
  title,
  right,
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

        <View style={[styles.side, styles.right]}>{right ?? null}</View>
      </View>
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
      width: 88,
      height: 36,
      justifyContent: "center",
    },
    right: {
      alignItems: "flex-end",
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
