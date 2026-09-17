import type { TextStyle } from "react-native";
import fonts from "./fonts";

/** Canonical "View All" link typography (Customer / Rider / POS). */
export function getViewAllTypography(): Pick<
  TextStyle,
  "fontFamily" | "fontSize" | "fontWeight"
> {
  return {
    fontFamily: fonts.title,
    fontSize: 15,
    fontWeight: "600",
  };
}
