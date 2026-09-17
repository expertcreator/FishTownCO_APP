import { fonts, fontSizes } from "@/shared/constants";
import { moderateScale } from "@/shared/imports";
import { useColors } from "@/shared/theme";
import { StyleSheet } from "react-native";

export const getStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: {
      marginHorizontal: moderateScale(16),
      paddingVertical: moderateScale(12),
      paddingHorizontal: moderateScale(12),
      backgroundColor: colors.surface,
      borderRadius: moderateScale(12),
      shadowColor: "#000000",
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    header: {
      fontFamily: fonts.title,
      fontSize: fontSizes.p,
      fontWeight: "500",
      color: colors.text,
      textAlign: "center",
      marginBottom: moderateScale(10),
    },
    scrollView: {
      flexGrow: 0,
    },
    datesRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: moderateScale(8),
      paddingHorizontal: moderateScale(4),
    },
    dateItem: {
      marginRight: moderateScale(4),
    },
    dateBox: {
      borderRadius: moderateScale(10),
      paddingVertical: moderateScale(8),
      paddingHorizontal: moderateScale(8),
      alignItems: "center",
      backgroundColor: colors.background,
      minWidth: moderateScale(10),
    },
    dateDay: {
      fontFamily: fonts.subTitle,
      fontSize: fontSizes.small,
      fontWeight: "500",
      color: colors.textSecondary,
      marginBottom: moderateScale(2),
    },
    selectedText: {
      color: colors.whitePure,
    },
    disabledText: {
      color: colors.textSecondary,
      opacity: 0.75,
    },
    disabledItem: {
      opacity: 0.85,
    },
    disabledBox: {
      backgroundColor: colors.surface,
      opacity: 0.9,
    },
  });
