import type { Control, FieldPath, FieldValues } from "react-hook-form";
import type { TextStyle } from "react-native";
import type { FloatingInputProps } from "../FloatingLabelInput";

export interface FloatingLabelFormFieldProps<
  T extends FieldValues = FieldValues,
> extends Omit<FloatingInputProps, "value" | "onChangeText" | "onBlur"> {
  control: Control<T>;
  name: FieldPath<T>;
  error?: { message?: string };
  errorTextStyle?: TextStyle;
  gapWhenNoError?: number;
  gapAfterError?: number;
}
