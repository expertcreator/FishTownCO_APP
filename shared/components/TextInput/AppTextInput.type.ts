import type {
  StyleProp,
  TextInputProps,
  TextStyle,
  ViewStyle,
} from "react-native";

type IconProps = {
  color?: string;
  size?: number;
};

export interface AppTextInputProps extends TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  secureTextEntry?: boolean;
  leftIcon?: React.ComponentType<IconProps>;
  rightIcon?: React.ComponentType<IconProps>;
  iconSize?: number;
  iconColor?: string;
  leftIconProps?: IconProps;
  rightIconProps?: IconProps;
  /** Optional click handlers for icons */
  onLeftIconPress?: () => void;
  onRightIconPress?: () => void;
  /** Accessibility labels for icons */
  leftIconAccessibilityLabel?: string;
  rightIconAccessibilityLabel?: string;
  /** Visual variant for container */
  variant?: "default" | "borderless" | "underline";
}
