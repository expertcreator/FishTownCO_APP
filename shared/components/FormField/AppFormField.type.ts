import { ReactNode } from "react";
import { Control, FieldError, FieldValues } from "react-hook-form";
import { StyleProp, TextStyle, ViewStyle } from "react-native";

export type AppFormFieldProps = {
  control?: Control<FieldValues>;
  name?: string;
  placeholder: string;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  secureTextEntry?: boolean;
  showPassword?: boolean;
  toggleShow?: () => void;
  error?: FieldError | undefined;

  // Standalone usage props
  value?: string;
  onChangeText?: (text: string) => void;
  onBlur?: () => void;

  // Optional custom styles
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  errorTextStyle?: StyleProp<TextStyle>;
  toggleBtnStyle?: StyleProp<ViewStyle>;
  CustomToggleButton?: ReactNode; // user can pass their own toggle button
};
