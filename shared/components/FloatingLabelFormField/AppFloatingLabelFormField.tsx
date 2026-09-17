import { Controller, FieldValues } from "react-hook-form";
import { View } from "react-native";
import { moderateScale } from "react-native-size-matters";
import { AppFloatingLabelInput } from "../FloatingLabelInput";
import { FloatingLabelFormFieldProps } from "./AppFloatingLabelFormField.type";

function FloatingLabelFormField<T extends FieldValues = FieldValues>({
  control,
  name,
  error,
  errorTextStyle,
  gapWhenNoError = 16,
  gapAfterError = 12,
  ...floatingInputProps
}: FloatingLabelFormFieldProps<T>) {
  return (
    <View
      style={{
        marginBottom: moderateScale(
          error?.message ? gapAfterError : gapWhenNoError
        ),
      }}
    >
      <Controller
        control={control}
        name={name}
        render={({ field: { value, onChange, onBlur } }) => (
          <AppFloatingLabelInput
            {...floatingInputProps}
            value={value ?? ""}
            onChangeText={onChange}
            onBlur={onBlur}
            hasError={!!error}
            errorMessage={error?.message}
          />
        )}
      />
    </View>
  );
}

export default FloatingLabelFormField;
