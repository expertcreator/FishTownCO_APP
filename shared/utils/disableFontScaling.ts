import { Text, TextInput } from "react-native";

type FontScalingComponent = {
  defaultProps?: {
    allowFontScaling?: boolean;
  };
};

const disableFontScaling = (Component: FontScalingComponent) => {
  Component.defaultProps = {
    ...Component.defaultProps,
    allowFontScaling: false,
  };
};

disableFontScaling(Text as unknown as FontScalingComponent);
disableFontScaling(TextInput as unknown as FontScalingComponent);
