import { useMemo } from "react";
import { View } from "react-native";
import { useColors } from "@/shared/theme";
import { getStyles } from "./RadioGroup.style";
import type { RadioGroupProps } from "./RadioGroup.type";
import RadioItem from "./RadioItem";

const RadioGroup = <T,>({
  options,
  value,
  onValueChange,
  direction = "vertical",
  style,
  itemStyle,
  disabled = false,
  activeColor,
  inactiveColor,
  size,
  contentStyle,
  renderIcon,
  renderLabel,
  renderRadioButton,
  contentDirection,
  contentAlignment,
  iconStyle,
  labelStyle,
  radioButtonStyle,
  iconLabelSpacing,
  contentRadioSpacing,
  labelColor,
}: RadioGroupProps<T>) => {
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const handleItemPress = (optionValue: T) => {
    if (!disabled && onValueChange) {
      onValueChange(optionValue);
    }
  };

  // Pass through styles without RTL adjustments (handled in RadioItem)
  const adjustedIconStyle = iconStyle;
  const adjustedRadioButtonStyle = radioButtonStyle;

  return (
    <View
      style={[
        styles.container,
        direction === "horizontal"
          ? styles.horizontalContainer
          : styles.verticalContainer,
        style,
      ]}
    >
      {options.map((option) => {
        const isItemDisabled = disabled || option.disabled;
        return (
          <RadioItem
            key={String(option.value)}
            option={option}
            isSelected={value === option.value}
            onPress={() => handleItemPress(option.value)}
            style={itemStyle}
            activeColor={activeColor}
            inactiveColor={inactiveColor}
            size={size}
            contentStyle={contentStyle}
            renderIcon={renderIcon}
            renderLabel={renderLabel}
            renderRadioButton={renderRadioButton}
            contentAlignment={contentAlignment}
            iconStyle={adjustedIconStyle}
            labelStyle={labelStyle}
            radioButtonStyle={adjustedRadioButtonStyle}
            iconLabelSpacing={iconLabelSpacing}
            contentRadioSpacing={contentRadioSpacing}
            isDisabled={isItemDisabled}
            labelColor={labelColor}
          />
        );
      })}
    </View>
  );
};

export default RadioGroup;
