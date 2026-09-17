import { useColors, useTheme } from "@/shared/theme";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { View } from "react-native";
import ShimmerPlaceholder from "react-native-shimmer-placeholder";

const getShimmerColors = (
  surface: string,
  border: string,
  isDark: boolean
): [string, string, string] => {
  if (isDark) {
    return [surface, border, surface];
  }
  return ["#ebebeb", "#c5c5c5", "#ebebeb"];
};

type SkeletonRectProps = {
  width: number | string;
  height: number | string;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

export const SkeletonRect = ({
  width,
  height,
  borderRadius = 8,
  style,
}: SkeletonRectProps) => {
  const themeColors = useColors();
  const { isDark } = useTheme();
  const shimmerColors = useMemo(
    () =>
      getShimmerColors(
        themeColors.surface,
        themeColors.border,
        isDark
      ),
    [themeColors.surface, themeColors.border, isDark]
  );
  const containerStyle = useMemo(
    () => [
      {
        width,
        height,
        borderRadius,
        backgroundColor: isDark ? themeColors.surface : "#ebebeb",
        overflow: "hidden" as const,
      },
      style,
    ],
    [width, height, borderRadius, isDark, themeColors.surface, style]
  );

  return (
    <ShimmerPlaceholder
      LinearGradient={LinearGradient}
      shimmerWidthPercent={1}
      shimmerColors={shimmerColors}
      style={containerStyle}
    />
  );
};

type SkeletonCircleProps = {
  size: number;
  style?: StyleProp<ViewStyle>;
};

export const SkeletonCircle = ({ size, style }: SkeletonCircleProps) => (
  <SkeletonRect
    width={size}
    height={size}
    borderRadius={size / 2}
    style={style}
  />
);

type SkeletonSpacerProps = {
  width?: number;
  height?: number;
};

export const SkeletonSpacer = ({ width, height }: SkeletonSpacerProps) => (
  <View style={{ width, height }} />
);

export default ShimmerPlaceholder;
