import { fonts, fontSizes } from "@/shared/constants";
import { useColors } from "@/shared/theme/ThemeContext";
import { StyleSheet } from "react-native";
import { moderateScale } from "react-native-size-matters";

export const getStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: {
      // Default container styles
    },
    horizontalContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    verticalContainer: {
      flexDirection: "column",
    },
    item: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: moderateScale(12),
      // paddingHorizontal: moderateScale(16),
    },
    itemContent: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    iconLabelContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    icon: {
      backgroundColor: colors.surface,
      // Default icon styles - can be overridden
    },
    labelContainer: {
      flex: 1,
    },
    label: {
      fontSize: fontSizes.p,
      color: colors.black,
      fontWeight: "500",
      fontFamily: fonts.title,
    },
    radioButtonContainer: {
      // Container for radio button
    },
    radioButton: {
      backgroundColor: "green",

      width: moderateScale(20),
      height: moderateScale(20),
      borderRadius: moderateScale(10),
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
    },
    radioButtonSelected: {
      width: moderateScale(10),
      height: moderateScale(10),
      borderRadius: moderateScale(5),
    },
    disabled: {
      opacity: 0.5,
    },
  });
