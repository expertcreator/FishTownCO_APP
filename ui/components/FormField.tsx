import { Ionicons } from "@expo/vector-icons";
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import type { TextInputProps } from "react-native";
import { Field } from "./Field";

type FormFieldProps<T extends FieldValues> = Omit<
  TextInputProps,
  "value" | "onChangeText"
> & {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  secureToggle?: boolean;
};

/**
 * Form field wired to react-hook-form, same role as Foori `AppFloatingLabelFormField`.
 * @param props - Field props
 * @param props.control - Form control from `useForm`
 * @param props.name - Field name in the schema
 * @param props.label - Uppercase field label
 * @param props.icon - Optional leading icon
 * @param props.secureToggle - Show the password eye toggle
 * @returns Controlled field with its validation error
 */
export function FormField<T extends FieldValues>({
  control,
  name,
  label,
  icon,
  secureToggle,
  ...rest
}: FormFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState }) => (
        <Field
          {...rest}
          label={label}
          icon={icon}
          secureToggle={secureToggle}
          value={typeof value === "string" ? value : ""}
          onChangeText={onChange}
          onBlur={onBlur}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}
