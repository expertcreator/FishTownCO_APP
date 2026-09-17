import { StyleSheet } from "react-native";
import { moderateScale } from "@/shared/imports";
import { useColors } from "@/shared/theme";

export const getStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    dateInputContainer: {
      marginHorizontal: moderateScale(5),
      marginTop: moderateScale(0),
      marginBottom: moderateScale(8),
      // Shadow / elevation
    },
    dateInput: {
      backgroundColor: colors.white,
      borderRadius: moderateScale(10),
      height: moderateScale(45),
    },
    calendarContainer: {
      paddingHorizontal: moderateScale(20),
    },
    buttonContainer: {
      flexDirection: "row",
      gap: moderateScale(12),
      marginVertical: moderateScale(30),
    },
    clearButton: {
      height: moderateScale(40),
      borderRadius: moderateScale(20),
      justifyContent: "center",
      paddingHorizontal: moderateScale(35),
    },
    applyButton: {
      flex: 1,
      height: moderateScale(40),
      borderRadius: moderateScale(20),
      justifyContent: "center",
    },
  });
