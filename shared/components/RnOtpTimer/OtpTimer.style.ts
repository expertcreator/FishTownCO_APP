import { fonts, fontSizes } from "@/shared/constants";
import colors from "@/shared/constants/colors";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  textRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  labelText: {
    color: colors.primary,
    fontSize: fontSizes.p,
    fontFamily: fonts.subTitle,
    fontWeight: "600",
  },
  timerText: {
    color: colors.gray,
    fontSize: fontSizes.p,
    fontFamily: fonts.subTitle,
  },
  disabled: {
    opacity: 0.6,
  },
});
