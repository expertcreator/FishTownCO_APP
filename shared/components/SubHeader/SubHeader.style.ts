import { colors, fonts, fontSizes, getViewAllTypography } from "@/shared/constants";
import { moderateScale } from "@/shared/imports";
import { StyleSheet } from "react-native";

const viewAllTypography = getViewAllTypography();

export const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(16),
    marginBottom: moderateScale(14),
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
  },
  iconLeftContainer: {
    marginRight: moderateScale(8),
  },
  title: {
    fontSize: fontSizes.h5,
    fontFamily: fonts.heading,
    color: colors.primary,
  },
  viewAll: {
    ...viewAllTypography,
    color: colors.primary,
  },
});
