import { colors } from "@/shared/constants";
import { SHEET_MODAL_HEADER_TOP_SPACING } from "@/shared/constants/sheetModalTypography";
import { StyleSheet } from "react-native";
import { moderateScale } from "react-native-size-matters";

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheetContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    minHeight: moderateScale(200), // Ensure minimum height for content
  },
  sheetConstrained: {
    overflow: "hidden",
  },
  sheetWithDragIndicator: {
    paddingTop: moderateScale(8),
  },
  sheetWithoutDragIndicator: {
    paddingTop: SHEET_MODAL_HEADER_TOP_SPACING,
  },
  dragIndicator: {
    width: moderateScale(80),
    height: moderateScale(4),
    backgroundColor: colors.primary,
    borderRadius: moderateScale(5),
    alignSelf: "center",
    marginBottom: moderateScale(8),
  },
  content: {
    flexShrink: 1,
    minHeight: 0,
  },
});
