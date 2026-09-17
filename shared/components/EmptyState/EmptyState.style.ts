import { fonts, fontSizes } from "@/shared/constants";
import { StyleSheet } from "react-native";
import { moderateScale } from "@/shared/imports";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: moderateScale(60),
    paddingHorizontal: moderateScale(20),
  },
  iconContainer: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(40),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: moderateScale(5),
  },
  imageContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  illustrationImage: {
    width: moderateScale(200),
    height: moderateScale(140),
  },
  image: {
    width: moderateScale(200),
    height: moderateScale(140),
  },
  title: {
    paddingTop: 12,
    fontSize: fontSizes.p,
    fontFamily: fonts.heading,
    marginBottom: moderateScale(8),
    textAlign: "center",
  },
  imageTitle: {
    paddingTop: 0,
    marginTop: 0,
  },
  description: {
    fontSize: fontSizes.small,
    fontFamily: fonts.subTitle,
    textAlign: "center",
  },
});
