import React from "react";
import {
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  View,
  type ViewStyle,
} from "react-native";
import { moderateScale } from "react-native-size-matters";
import { useColors } from "@/shared/theme";
import AppText from "../Text/AppText";
import { styles } from "./AppButton.style";
import type { AppButtonProps } from "./AppButton.type";

const ON_PRIMARY_TEXT = "#FFFFFF";

const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  style,
  textStyle,
  contentStyle: customContentStyle,
  icon: Icon,
  iconProps,
  iconPosition = "left",
  rounded = false,
  pill = false,
  width,
  height,
  backgroundColor,
  opacity = 0.8,
  fontSize,
  color,
  fontWeight = "600",
  children,
  loading = false,
  loaderColor,
  accessibilityLabel,
  disabled = false,
  variant = "transparent",
  borderColor,
}) => {
  const themeColors = useColors();
  const windowWidth = Dimensions.get("window").width;

  const buttonWidth =
    width ?? (rounded && !pill ? windowWidth * 0.5 : undefined);
  const defaultPillHeight = moderateScale(48);
  const resolvedPillHeight =
    typeof height === "number" ? height : defaultPillHeight;
  const buttonHeight = height;

  let borderRadius: number;
  if (pill) {
    borderRadius = resolvedPillHeight / 2;
  } else if (rounded) {
    borderRadius = typeof height === "number" ? height / 2 : moderateScale(25);
  } else {
    borderRadius = moderateScale(12);
  }

  // Variant-based styling (primary / outline use theme brand — works in light & dark)
  const getVariantStyles = () => {
    const brand = themeColors.primary;
    const muted = themeColors.disabled;
    switch (variant) {
      case "primary":
        return {
          backgroundColor: disabled ? muted : (backgroundColor ?? brand),
          borderWidth: 0,
          color: color ?? ON_PRIMARY_TEXT,
          loaderColor: loaderColor ?? ON_PRIMARY_TEXT,
        };
      case "secondary":
        return {
          backgroundColor: disabled
            ? themeColors.surface
            : (backgroundColor ?? themeColors.surface),
          borderWidth: 0,
          color: color ?? themeColors.text,
          loaderColor: loaderColor ?? themeColors.text,
        };
      case "outline":
        return {
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: borderColor ?? (disabled ? muted : brand),
          color: color ?? (disabled ? muted : brand),
          loaderColor: loaderColor ?? (disabled ? muted : brand),
        };
      case "transparent":
        return {
          backgroundColor: "transparent",
          borderWidth: 0,
          color: color ?? (disabled ? muted : brand),
          loaderColor: loaderColor ?? (disabled ? muted : brand),
        };
      case "ghost":
        return {
          backgroundColor: "transparent",
          borderWidth: 0,
          color: color ?? (disabled ? muted : themeColors.text),
          loaderColor: loaderColor ?? (disabled ? muted : themeColors.text),
        };
      default:
        return {
          backgroundColor: disabled ? muted : (backgroundColor ?? brand),
          borderWidth: 0,
          color: color ?? ON_PRIMARY_TEXT,
          loaderColor: loaderColor ?? ON_PRIMARY_TEXT,
        };
    }
  };

  const variantStyles = getVariantStyles();

  const contentStyle: ViewStyle = {
    flexDirection: iconPosition === "right" ? "row-reverse" : "row",
    justifyContent: "center",
    alignItems: "center",
  };

  return (
    <TouchableOpacity
      activeOpacity={opacity}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessible
      style={[
        styles.button,
        {
          backgroundColor: variantStyles.backgroundColor,
          borderWidth: variantStyles.borderWidth,
          borderColor: variantStyles.borderColor,
          width: buttonWidth,
          height: buttonHeight,
          minHeight:
            pill && height === undefined ? resolvedPillHeight : undefined,
          paddingVertical: pill ? moderateScale(12) : undefined,
          borderRadius,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles.loaderColor} />
      ) : (
        <View style={[contentStyle, customContentStyle]}>
          {Icon && iconPosition === "left" && <Icon {...iconProps} />}
          {children
            ? children
            : title && (
                <AppText
                  color={variantStyles.color}
                  fontSize={fontSize}
                  fontWeight={fontWeight}
                  style={[
                    {
                      marginHorizontal:
                        Icon && iconPosition !== "center"
                          ? moderateScale(8)
                          : 0,
                    },
                    textStyle,
                  ]}
                >
                  {title}
                </AppText>
              )}
          {Icon && iconPosition === "right" && <Icon {...iconProps} />}
        </View>
      )}
    </TouchableOpacity>
  );
};

export default AppButton;
