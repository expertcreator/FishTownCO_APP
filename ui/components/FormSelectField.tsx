import { Ionicons } from "@expo/vector-icons";
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { SelectField } from "./SelectField";

type FormSelectFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  placeholder: string;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  onPress: () => void;
};

/**
 * react-hook-form select field wrapper around `SelectField`.
 * @param props - Form select props
 * @param props.control - Form control from `useForm`
 * @param props.name - Field name in the schema
 * @param props.label - Uppercase field label
 * @param props.placeholder - Placeholder when empty
 * @param props.icon - Optional leading icon
 * @param props.loading - Busy state for the select row
 * @param props.onPress - Opens the picker
 * @returns Controlled select field with validation error
 */
export function FormSelectField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  icon,
  loading,
  onPress,
}: FormSelectFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value }, fieldState }) => (
        <SelectField
          label={label}
          value={typeof value === "string" ? value : ""}
          placeholder={placeholder}
          icon={icon}
          loading={loading}
          error={fieldState.error?.message}
          onPress={onPress}
        />
      )}
    />
  );
}
