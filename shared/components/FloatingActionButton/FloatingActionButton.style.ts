import { StyleSheet } from "react-native";
import { moderateScale } from "@/shared/imports";
import { fonts, fontSizes } from "@/shared/constants";
import { useColors } from "@/shared/theme";

export const useFloatingActionButtonStyles = (
  size: number,
  bottomOffset: number,
  end?: number,
  start?: number
) => {
  const colors = useColors();

  return StyleSheet.create({
    button: {
      position: "absolute",
      ...(end != null ? { end: moderateScale(end) } : {}),
      ...(start != null ? { start: moderateScale(start) } : {}),
      bottom: bottomOffset,
      width: moderateScale(size),
      height: moderateScale(size),
      borderRadius: moderateScale(size / 2),
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.shadow,
      shadowOpacity: 0.22,
      shadowRadius: moderateScale(10),
      shadowOffset: { width: 0, height: moderateScale(4) },
      elevation: 12,
      zIndex: 1000,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    badge: {
      position: "absolute",
      top: moderateScale(-2),
      end: moderateScale(-2),
      minWidth: moderateScale(20),
      height: moderateScale(20),
      borderRadius: moderateScale(10),
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: moderateScale(4),
    },
    badgeText: {
      fontSize: fontSizes.tiny,
      fontFamily: fonts.heading,
      color: colors.primary,
    },
  });
};
