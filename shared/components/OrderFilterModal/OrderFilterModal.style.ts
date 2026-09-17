import {
  colors as constantColors,
  fonts,
  fontSizes,
  getSheetModalHeaderContainerStyle,
  getSheetModalTitleTypography,
} from "@/shared/constants";
import { moderateScale } from "@/shared/imports";
import { StyleSheet } from "react-native";
import { useColors } from "@/shared/theme";

export const getStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: moderateScale(18),
      paddingBottom: moderateScale(12),
      ...getSheetModalHeaderContainerStyle(),
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: moderateScale(8),
      marginBottom: moderateScale(5),
    },
    title: {
      ...getSheetModalTitleTypography(),
      color: colors.primary,
      flex: 1,
    },
    subTitle: {
      fontSize: fontSizes.p,
      fontFamily: fonts.subTitle,
      color: colors.textSecondary,
      marginBottom: moderateScale(20),
    },
    presetContainer: {
      marginBottom: moderateScale(30),
      marginHorizontal: -moderateScale(18),
    },
    presetContainerContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: moderateScale(8),
      paddingHorizontal: moderateScale(18),
    },
    presetButton: {
      flexShrink: 0,
      backgroundColor: colors.card,
      borderRadius: moderateScale(8),
      height: moderateScale(35),
      paddingHorizontal: moderateScale(12),
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    presetButtonActive: {
      backgroundColor: constantColors.primaryRed,
    },
    presetButtonText: {
      fontSize: fontSizes.p,
      fontFamily: fonts.subTitle,
      color: colors.textSecondary,
    },
    presetButtonTextActive: {
      color: colors.white,
    },
    dateRangeContainer: {
      marginBottom: moderateScale(20),
    },
    customDateInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: moderateScale(8),
      backgroundColor: colors.card,
      minHeight: moderateScale(35),
    },
    customDateInputText: {
      color: colors.textSecondary,
      fontSize: fontSizes.p,
      fontFamily: fonts.subTitle,
    },
    customDateInputTextFilled: {
      color: colors.text,
    },
    buttonContainer: {
      flexDirection: "row",
      gap: moderateScale(12),
      marginTop: moderateScale(10),
      marginBottom: moderateScale(20),
    },
    resetButton: {
      flexShrink: 0,
      borderWidth: 0.7,
      borderColor: constantColors.primaryRed,
      backgroundColor: colors.white,
      height: moderateScale(45),
      justifyContent: "center",
      borderRadius: moderateScale(36),
      paddingHorizontal: moderateScale(20),
      minWidth: moderateScale(96),
    },
    resetButtonText: {
      color: constantColors.primaryRed,
      fontSize: fontSizes.h6,
      fontFamily: fonts.button,
    },
    confirmButton: {
      flex: 1,
      height: moderateScale(45),
      justifyContent: "center",
    },
    confirmButtonText: {
      fontSize: fontSizes.p,
      fontFamily: fonts.button,
    },
  });
