import type React from "react";
import { Pressable, TextInput, View } from "react-native";
import { colors, iconSizes } from "../../constants";
import { styles } from "./AppTextInput.style";
import type { AppTextInputProps } from "./AppTextInput.type";

const AppTextInput: React.FC<AppTextInputProps> = ({
  value,
  onChangeText,
  placeholder,
  style,
  containerStyle,
  secureTextEntry,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  iconSize = iconSizes.xl,
  iconColor = colors.black,
  leftIconProps,
  rightIconProps,
  onLeftIconPress,
  onRightIconPress,
  leftIconAccessibilityLabel,
  rightIconAccessibilityLabel,
  variant = "default",
  ...rest
}) => {
  const containerVariant = (() => {
    switch (variant) {
      case "borderless":
        return {
          borderWidth: 0,
          backgroundColor: "transparent",
          paddingHorizontal: 0,
          paddingVertical: 0,
        };
      case "underline":
        return {
          borderWidth: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.gray,
          backgroundColor: "transparent",
        };
      default:
        return {};
    }
  })();

  return (
    <View style={[styles.container, containerVariant, containerStyle]}>
      {LeftIcon && (
        <Pressable
          style={styles.iconLeft}
          onPress={onLeftIconPress}
          disabled={!onLeftIconPress}
          accessibilityRole="button"
          accessibilityLabel={leftIconAccessibilityLabel || "Left icon"}
        >
          <LeftIcon color={iconColor} size={iconSize} {...leftIconProps} />
        </Pressable>
      )}

      <TextInput
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        style={[styles.input, style]}
        value={value}
        {...rest}
        allowFontScaling={false}
      />

      {RightIcon && (
        <Pressable
          style={styles.iconRight}
          onPress={onRightIconPress}
          disabled={!onRightIconPress}
          accessibilityRole="button"
          accessibilityLabel={rightIconAccessibilityLabel || "Right icon"}
        >
          <RightIcon color={iconColor} size={iconSize} {...rightIconProps} />
        </Pressable>
      )}
    </View>
  );
};

export default AppTextInput;
