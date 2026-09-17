import { StyleSheet } from "react-native";
import { moderateScale } from "react-native-size-matters";

export const getStyles = (size: number, backgroundColor: string) =>
  StyleSheet.create({
    container: {
      width: moderateScale(size),
      height: moderateScale(size),
      borderRadius: moderateScale(size / 2),
      backgroundColor,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 3,
    },
  });
