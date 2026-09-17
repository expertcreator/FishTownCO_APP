import type { TextStyle, ViewStyle } from "react-native";
import { moderateScale } from "react-native-size-matters";
import fonts from "./fonts";
import fontSizes from "./fontSizes";

/** Consistent top spacing applied by AppBottomSheet when the drag indicator is hidden. */
export const SHEET_MODAL_HEADER_TOP_SPACING = moderateScale(12);

/** Canonical typography for header titles in bottom sheets and modals. */
export function getSheetModalTitleTypography(): Pick<
  TextStyle,
  "fontFamily" | "fontSize" | "fontWeight" | "lineHeight"
> {
  return {
    fontFamily: fonts.heading,
    fontSize: fontSizes.p,
    lineHeight: moderateScale(20),
  };
}

/** Standard top padding for modal header containers. */
export function getSheetModalHeaderContainerStyle(): Pick<
  ViewStyle,
  "paddingTop"
> {
  return {
    paddingTop: SHEET_MODAL_HEADER_TOP_SPACING,
  };
}
