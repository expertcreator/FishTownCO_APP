import { StyleSheet } from "react-native";
import { moderateScale } from "react-native-size-matters";
import { fontSizes, fonts } from "@/shared/constants";

export default StyleSheet.create({
  fieldContainer: { marginBottom: moderateScale(12) },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(15),
    borderRadius: moderateScale(8),
    fontSize: fontSizes.p,
    fontFamily: fonts.subTitle,
  },
  errorInput: { borderColor: "red" },
  errorText: {
    color: "red",
    marginTop: moderateScale(4),
    fontSize: fontSizes.small,
    fontFamily: fonts.subTitle,
  },
  toggleBtn: {
    position: "absolute",
    right: moderateScale(12),
    top: moderateScale(0),
    bottom: moderateScale(0),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 0,
    paddingHorizontal: moderateScale(6),
  },
});
