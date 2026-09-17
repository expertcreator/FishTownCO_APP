import { Platform, Switch, View } from "react-native";
import { baseColors } from "../../constants";
import { appSwitchStyles } from "./AppSwitch.style";
import type { AppSwitchProps } from "./AppSwitch.type";

/** Fixed track/thumb colors so toggles match across light and dark screens. */
const SWITCH_TRACK_OFF = "#E5E7EB";

export function AppSwitch({ style, ...switchProps }: AppSwitchProps) {
  return (
    <View style={[appSwitchStyles.outer, style]}>
      <Switch
        trackColor={{ false: SWITCH_TRACK_OFF, true: baseColors.primary }}
        thumbColor={Platform.OS === "android" ? baseColors.whitePure : undefined}
        ios_backgroundColor={SWITCH_TRACK_OFF}
        {...switchProps}
      />
    </View>
  );
}
