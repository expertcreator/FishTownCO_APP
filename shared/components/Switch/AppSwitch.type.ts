import type { StyleProp, SwitchProps, ViewStyle } from "react-native";

/** Colors are fixed in `AppSwitch` so toggles look identical in light/dark mode on every screen. */
export type AppSwitchProps = Omit<
  SwitchProps,
  "trackColor" | "thumbColor" | "ios_backgroundColor"
> & {
  /** Wrapper style (layout around the scaled switch). */
  style?: StyleProp<ViewStyle>;
};
