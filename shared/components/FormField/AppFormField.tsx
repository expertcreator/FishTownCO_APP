import { type ReactElement, cloneElement, isValidElement } from "react";
import { Controller } from "react-hook-form";
import { View } from "react-native";
import AppButton from "../Button";
import AppText from "../Text/AppText";
import AppTextInput from "../TextInput";
import styles from "./AppFormField.style";
import { AppFormFieldProps } from "./AppFormField.type";

import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "../../constants";

export default function AppFormField({
  control,
  name,
  placeholder,
  keyboardType = "default",
  secureTextEntry = false,
  showPassword,
  toggleShow,
  error,
  containerStyle,
  inputStyle,
  errorTextStyle,
  toggleBtnStyle,
  CustomToggleButton,
  // Standalone props
  value,
  onChangeText,
  onBlur,
}: AppFormFieldProps) {
  const effectiveSecureTextEntry = secureTextEntry && !showPassword;
  // If control and name are provided, use react-hook-form
  if (control && name) {
    return (
      <View style={[styles.fieldContainer, containerStyle]}>
        <Controller
          control={control}
          name={name}
          render={({
            field: { value: fieldValue, onChange, onBlur: fieldOnBlur },
          }) => (
            <View style={{ position: "relative" }}>
              <AppTextInput
                placeholder={placeholder}
                value={fieldValue}
                onChangeText={onChange}
                onBlur={fieldOnBlur}
                keyboardType={keyboardType}
                secureTextEntry={effectiveSecureTextEntry}
                style={[styles.input, error && styles.errorInput, inputStyle]}
              />

              {/* Toggle button */}
              {toggleShow &&
                (CustomToggleButton ? (
                  isValidElement(CustomToggleButton) ? (
                    cloneElement(
                      CustomToggleButton as ReactElement<{
                        onPress?: () => void;
                      }>,
                      { onPress: toggleShow }
                    )
                  ) : (
                    CustomToggleButton
                  )
                ) : (
                  <AppButton
                    onPress={toggleShow}
                    style={[styles.toggleBtn, toggleBtnStyle]}
                  >
                    <MaterialIcons
                      name={showPassword ? "visibility-off" : "visibility"}
                      size={24}
                      color={colors.gray}
                    />
                  </AppButton>
                ))}
            </View>
          )}
        />
        {error && (
          <AppText style={[styles.errorText, errorTextStyle]}>
            {error.message}
          </AppText>
        )}
      </View>
    );
  }

  // Standalone usage without react-hook-form
  return (
    <View style={[styles.fieldContainer, containerStyle]}>
      <View style={{ position: "relative" }}>
        <AppTextInput
          placeholder={placeholder}
          value={value || ""}
          onChangeText={onChangeText || (() => {})}
          onBlur={onBlur}
          keyboardType={keyboardType}
          secureTextEntry={effectiveSecureTextEntry}
          style={[styles.input, error && styles.errorInput, inputStyle]}
        />

        {/* Toggle button */}
        {toggleShow &&
          (CustomToggleButton ? (
            isValidElement(CustomToggleButton) ? (
              cloneElement(
                CustomToggleButton as ReactElement<{ onPress?: () => void }>,
                { onPress: toggleShow }
              )
            ) : (
              CustomToggleButton
            )
          ) : (
            <AppButton
              onPress={toggleShow}
              style={[styles.toggleBtn, toggleBtnStyle]}
            >
              <MaterialIcons
                name={showPassword ? "visibility-off" : "visibility"}
                size={24}
                color={colors.gray}
              />
            </AppButton>
          ))}
      </View>
      {error && (
        <AppText style={[styles.errorText, errorTextStyle]}>
          {error.message}
        </AppText>
      )}
    </View>
  );
}
