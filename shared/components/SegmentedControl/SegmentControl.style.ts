import { fonts, fontSizes } from "@/shared/constants";
import { moderateScale } from "@/shared/imports";
import { useColors } from "@/shared/theme/ThemeContext";
import { StyleSheet } from "react-native";

export type SegmentedControlVariant = "pill" | "underline";

export const getStyles = (
  colors: ReturnType<typeof useColors>,
  variant: SegmentedControlVariant = "pill",
  isTablet = false
) => {
  const isUnderline = variant === "underline";

  return StyleSheet.create({
    wrapper: {
      flexDirection: "row",
      backgroundColor: isUnderline ? "transparent" : colors.surface,
      borderRadius: moderateScale(isUnderline ? 0 : 12),
      borderWidth: isUnderline ? 0 : StyleSheet.hairlineWidth,
      borderColor: colors.border,
      borderBottomWidth: isUnderline ? StyleSheet.hairlineWidth : undefined,
      borderBottomColor: isUnderline ? colors.border : undefined,
      padding: moderateScale(isUnderline ? 0 : 3),
    },
    wrapperScrollable: {
      overflow: "visible",
    },
    scrollContent: {
      flexDirection: "row",
      paddingHorizontal: 0,
    },
    itemContainer: {
      flex: 1,
    },
    itemContainerUnderline: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: isTablet ? 12 : moderateScale(8),
      paddingHorizontal: isTablet ? 16 : moderateScale(12),
      borderBottomWidth: isTablet ? 2 : moderateScale(2),
      borderBottomColor: "transparent",
      marginBottom: isUnderline ? -StyleSheet.hairlineWidth : 0,
    },
    itemContainerUnderlineActive: {
      borderBottomColor: colors.primary,
    },
    itemContainerScrollable: {
      flexGrow: 0,
      flexShrink: 0,
    },
    activePill: {
      minHeight: moderateScale(36),
      paddingVertical: moderateScale(8),
      paddingHorizontal: moderateScale(12),
      borderRadius: moderateScale(9),
      alignItems: "center",
      justifyContent: "center",
    },
    inactivePill: {
      minHeight: moderateScale(36),
      paddingVertical: moderateScale(8),
      paddingHorizontal: moderateScale(12),
      borderRadius: moderateScale(9),
      alignItems: "center",
      justifyContent: "center",
    },
    activeText: {
      color: colors.white,
      fontSize: fontSizes.p,
      fontFamily: fonts.title,
    },
    inactiveText: {
      color: colors.textSecondary,
      fontSize: fontSizes.p,
      fontFamily: fonts.subTitle,
    },
    activeTextUnderline: {
      color: colors.primary,
      fontSize: fontSizes.small,
      fontFamily: fonts.heading,
    },
    inactiveTextUnderline: {
      color: colors.textSecondary,
      fontSize: fontSizes.small,
      fontFamily: fonts.subTitle,
    },
  });
};
