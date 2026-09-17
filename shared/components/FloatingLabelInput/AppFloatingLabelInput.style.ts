import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { moderateScale } from "react-native-size-matters";
import { colors, fontSizes, fonts } from "../../constants";
import { useIsTablet } from "@/shared/hooks";
import { useColors } from "@/shared/theme/ThemeContext";

/**
 * Compact landscape-tablet input density. Local so this shared module does
 * not depend on any app `features/` tree. Phone still uses moderateScale.
 */
export const TABLET_INPUT = {
  height: 44,
  radius: 8,
  padLeft: 12,
  padRight: 10,
  fontSize: 16,
  smallSize: 13,
  icon: 22,
  multilineMin: 88,
  multilinePadTop: 12,
  multilinePadBottom: 8,
} as const;

export const useFloatingLabelInputStyles = () => {
  const color = useColors();
  const isTablet = useIsTablet();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: "row",
          alignItems: "center",
          borderWidth: isTablet ? 0.7 : moderateScale(0.7),
          borderColor: color.black,
          borderRadius: isTablet ? TABLET_INPUT.radius : moderateScale(8),
          paddingLeft: isTablet ? TABLET_INPUT.padLeft : moderateScale(10),
          paddingRight: isTablet ? TABLET_INPUT.padRight : moderateScale(8),
          paddingTop: 0,
          paddingBottom: 0,
          marginVertical: 0,
          width: "100%",
          height: isTablet ? TABLET_INPUT.height : moderateScale(40),
        },
        multilineContainer: {
          height: undefined,
          minHeight: isTablet ? TABLET_INPUT.multilineMin : moderateScale(100),
          alignItems: "flex-start",
          paddingTop: isTablet
            ? TABLET_INPUT.multilinePadTop
            : moderateScale(14),
          paddingBottom: isTablet
            ? TABLET_INPUT.multilinePadBottom
            : moderateScale(10),
        },
        errorContainer: {
          borderColor: colors.red,
        },
        input: {
          flex: 1,
          paddingVertical: isTablet ? 0 : moderateScale(0),
          color: color.text,
          fontSize: isTablet ? TABLET_INPUT.fontSize : fontSizes.p,
          fontFamily: fonts.subTitle,
          paddingLeft: 0,
          paddingRight: 0,
          marginLeft: 0,
          textAlign: "left",
          textAlignVertical: "center",
        },
        multilineInput: {
          textAlignVertical: "top",
          minHeight: isTablet ? 72 : moderateScale(72),
          paddingTop: isTablet ? 2 : moderateScale(2),
        },
        multilineInputRow: {
          alignItems: "flex-start",
        },
        passwordToggle: {
          padding: isTablet ? 2 : moderateScale(2),
          justifyContent: "center",
          alignItems: "center",
        },
        icon: {
          width: isTablet ? TABLET_INPUT.icon : moderateScale(24),
          height: isTablet ? TABLET_INPUT.icon : moderateScale(24),
        },
        countdown: {
          fontSize: isTablet ? TABLET_INPUT.smallSize : fontSizes.small,
          fontFamily: fonts.subTitle,
          color: colors.gray,
          marginLeft: isTablet ? 5 : moderateScale(5),
        },
        iconLeft: {
          marginRight: isTablet ? 8 : moderateScale(8),
        },
        iconRight: {
          marginLeft: isTablet ? 8 : moderateScale(8),
        },
      }),
    [color.black, color.text, isTablet]
  );
};
