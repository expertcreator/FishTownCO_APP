import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { AppSwitch } from "./AppSwitch";
import { appSwitchRowStyles } from "./AppSwitch.style";
import type { AppSwitchProps } from "./AppSwitch.type";

export type AppSwitchRowProps = AppSwitchProps & {
  children: ReactNode;
  rowStyle?: StyleProp<ViewStyle>;
  textBlockStyle?: StyleProp<ViewStyle>;
};

/** Label/hint on the left, `AppSwitch` on the right — same layout as Create Product. */
const AppSwitchRow = ({
  children,
  rowStyle,
  textBlockStyle,
  style,
  ...switchProps
}: AppSwitchRowProps) => (
  <View style={[appSwitchRowStyles.row, rowStyle]}>
    <View style={[appSwitchRowStyles.textBlock, textBlockStyle]}>{children}</View>
    <AppSwitch style={style} {...switchProps} />
  </View>
);

export default AppSwitchRow;
