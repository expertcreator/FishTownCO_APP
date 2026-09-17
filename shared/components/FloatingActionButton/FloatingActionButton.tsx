import React from "react";
import { TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { moderateScale } from "@/shared/imports";
import { useColors } from "@/shared/theme";
import AppText from "../Text/AppText";
import { useFloatingActionButtonStyles } from "./FloatingActionButton.style";
import type { FloatingActionButtonProps } from "./FloatingActionButton.type";

const DEFAULT_SIZE = 56;
const DEFAULT_BOTTOM = 16;
const DEFAULT_END = 16;
const DEFAULT_ICON_SIZE = 24;

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onPress,
  accessibilityLabel,
  accessibilityHint,
  iconName = "add",
  iconSize = DEFAULT_ICON_SIZE,
  iconColor,
  children,
  badgeCount = 0,
  disabled = false,
  size = DEFAULT_SIZE,
  bottom = DEFAULT_BOTTOM,
  end = DEFAULT_END,
  start,
  avoidTabBar = true,
  style,
}) => {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const resolvedBottom =
    moderateScale(bottom) + (avoidTabBar ? Math.max(insets.bottom, 0) : 0);
  const styles = useFloatingActionButtonStyles(
    size,
    resolvedBottom,
    end,
    start
  );
  const resolvedIconColor = iconColor ?? colors.white;
  const showBadge = badgeCount > 0;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, disabled && styles.buttonDisabled, style]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
    >
      {children ??
        (iconName ? (
          <Ionicons
            name={iconName}
            size={moderateScale(iconSize)}
            color={resolvedIconColor}
          />
        ) : null)}

      {showBadge ? (
        <View style={styles.badge}>
          <AppText style={styles.badgeText}>
            {badgeCount > 99 ? "99+" : String(badgeCount)}
          </AppText>
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

export default FloatingActionButton;
