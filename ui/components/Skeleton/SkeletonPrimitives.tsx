import { useColors, useTheme } from "@/ui/theme";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { View } from "react-native";
import ShimmerPlaceholder from "react-native-shimmer-placeholder";

/**
 * Picks shimmer stops for the active light or dark palette.
 * @param surface - Card / surface color
 * @param border - Border color
 * @param isDark - Whether dark mode is active
 * @returns Three shimmer gradient colors
 */
function getShimmerColors(
  surface: string,
  border: string,
  isDark: boolean
): [string, string, string] {
  if (isDark) {
    return [surface, border, surface];
  }
  return ["#ebebeb", "#c5c5c5", "#ebebeb"];
}

type SkeletonRectProps = {
  width: number | `${number}%` | "100%" | "90%" | "80%" | "70%" | "60%";
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Rectangle shimmer block, same role as Foori `SkeletonRect`.
 * @param props - Size and style
 * @param props.width - Block width
 * @param props.height - Block height
 * @param props.borderRadius - Corner radius
 * @param props.style - Optional style
 * @returns Shimmer rectangle
 */
export function SkeletonRect({
  width,
  height,
  borderRadius = 8,
  style,
}: SkeletonRectProps) {
  const themeColors = useColors();
  const { isDark } = useTheme();
  const shimmerColors = useMemo(
    () => getShimmerColors(themeColors.card, themeColors.border, isDark),
    [themeColors.card, themeColors.border, isDark]
  );
  const containerStyle = useMemo(
    () => [
      {
        width,
        height,
        borderRadius,
        backgroundColor: isDark ? themeColors.cardSoft : "#ebebeb",
        overflow: "hidden" as const,
      },
      style,
    ],
    [width, height, borderRadius, isDark, themeColors.cardSoft, style]
  );

  return (
    <ShimmerPlaceholder
      LinearGradient={LinearGradient}
      shimmerWidthPercent={1}
      shimmerColors={shimmerColors}
      style={containerStyle}
    />
  );
}

type SkeletonCircleProps = {
  size: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Circular shimmer block, same role as Foori `SkeletonCircle`.
 * @param props - Circle props
 * @param props.size - Diameter
 * @param props.style - Optional style
 * @returns Shimmer circle
 */
export function SkeletonCircle({ size, style }: SkeletonCircleProps) {
  return (
    <SkeletonRect
      width={size}
      height={size}
      borderRadius={size / 2}
      style={style}
    />
  );
}

type SkeletonSpacerProps = {
  width?: number;
  height?: number;
};

/**
 * Empty space between skeleton blocks.
 * @param props - Spacer size
 * @param props.width - Horizontal gap
 * @param props.height - Vertical gap
 * @returns Spacer view
 */
export function SkeletonSpacer({ width, height }: SkeletonSpacerProps) {
  return <View style={{ width, height }} />;
}
