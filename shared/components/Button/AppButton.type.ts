import type { StyleProp, TextStyle, ViewStyle } from "react-native";

type IconProps = {
  color?: string;
  size?: number;
};

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "transparent"
  | "ghost";

export type AppButtonProps = {
  title?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  icon?: React.ComponentType<IconProps>;
  iconProps?: IconProps;
  iconPosition?: "left" | "right" | "center";
  rounded?: boolean;
  /** Full pill shape (uses brand radius); does not force half-width like `rounded`. */
  pill?: boolean;
  width?: number;
  height?: number | "auto";
  backgroundColor?: string;
  opacity?: number;
  fontSize?: number;
  color?: string;
  fontWeight?:
    | "100"
    | "200"
    | "300"
    | "400"
    | "500"
    | "600"
    | "700"
    | "800"
    | "900";
  children?: React.ReactNode;
  loading?: boolean;
  loaderColor?: string;
  accessibilityLabel?: string;
  disabled?: boolean;
  variant?: ButtonVariant;
  borderColor?: string;
};
