import { StyleSheet } from "react-native";
import { moderateScale } from "react-native-size-matters";
import { fontSizes, fonts } from "@/shared/constants";

export const styles = StyleSheet.create({
  errorText: {
    color: "red",
    fontSize: fontSizes.small,
    fontFamily: fonts.subTitle,
    marginTop: moderateScale(0),
  },
});
