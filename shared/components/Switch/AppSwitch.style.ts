import { Platform, StyleSheet } from "react-native";
import { moderateScale } from "react-native-size-matters";

/** iOS `Switch` is larger than Android; scale down for consistent form-row sizing. */
const SWITCH_SCALE = Platform.select({
  ios: 0.88,
  android: 1,
  default: 1,
});

export const appSwitchStyles = StyleSheet.create({
  outer: {
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transform: [{ scaleX: SWITCH_SCALE }, { scaleY: SWITCH_SCALE }],
  },
});

/** Shared label + switch row layout (matches Create Product). */
export const appSwitchRowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: moderateScale(12),
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
    gap: moderateScale(4),
  },
});
