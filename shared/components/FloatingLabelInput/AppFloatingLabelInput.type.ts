import React from "react";
import { TextInputProps, TextStyle, ViewStyle } from "react-native";

export type CustomLabelStyles = {
  fontSizeFocused?: number;
  fontSizeBlurred?: number;
  colorFocused?: string;
  colorBlurred?: string;
  topFocused?: number;
  topBlurred?: number;
  leftFocused?: number;
  leftBlurred?: number;
};

export interface FloatingInputProps
  extends Omit<TextInputProps, "secureTextEntry"> {
  label: string;
  isPassword?: boolean;
  togglePassword?: boolean;
  onTogglePassword?: (show: boolean) => void;
  mask?: (value: string) => string;
  maxLength?: number;
  showCountdown?: boolean;
  countdownLabel?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  customLabelStyles?: CustomLabelStyles;
  leftComponent?: React.ReactNode;
  rightComponent?: React.ReactNode;
  hint?: string;
  hintTextColor?: string;
  darkTheme?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  labelBackgroundColor?: string;
  errorMarginTop?: number;
  placeholderHint?: string;
}
