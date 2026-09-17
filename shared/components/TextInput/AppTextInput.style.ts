import { StyleSheet } from "react-native";
import { moderateScale } from "react-native-size-matters";
import { colors, fontSizes, fonts } from "../../constants";

export const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.gray,
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    backgroundColor: colors.white,
  },
  input: {
    flex: 1,
    fontSize: fontSizes.p,
    fontFamily: fonts.subTitle,
    color: colors.black,
    paddingVertical: 0,
  },
  iconLeft: {
    marginRight: moderateScale(8),
  },
  iconRight: {
    marginLeft: moderateScale(8),
  },
});
