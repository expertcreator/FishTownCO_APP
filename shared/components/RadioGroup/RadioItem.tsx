import AppButton from "@/shared/components/Button/AppButton";
import AppText from "@/shared/components/Text/AppText";
import { useColors } from "@/shared/theme";
import { useTranslation } from "@/shared/translations/useTranslation";
import { useMemo } from "react";
import type { FlexAlignType } from "react-native";
import { View } from "react-native";
import { moderateScale } from "react-native-size-matters";
import { getStyles } from "./RadioGroup.style";
import type { RadioItemProps } from "./RadioGroup.type";

// Validation helper for FlexAlignType
const isValidFlexAlign = (value: string): value is FlexAlignType =>
  ["flex-start", "flex-end", "center", "stretch", "baseline"].includes(value);

const RadioItem = <T,>({
  option,
  isSelected,
  onPress,
  style,
  activeColor,
  inactiveColor,
  size = 20,
  contentStyle,
  renderIcon,
  renderLabel,
  renderRadioButton,
  contentDirection = "row",
  contentAlignment = "center",
  iconStyle,
  labelStyle,
  radioButtonStyle,
  iconLabelSpacing = 12,
  contentRadioSpacing = 16,
  isDisabled = false,
  labelColor,
}: RadioItemProps<T>) => {
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const resolvedActive = activeColor ?? colors.primary;
  const resolvedInactive = inactiveColor ?? colors.border;
  const { isRTL } = useTranslation();
  const radioSize = moderateScale(size);
  const innerSize = radioSize * 0.5; // Use scaled size for consistent proportions
  // Validate contentAlignment
  const validAlignment: FlexAlignType = isValidFlexAlign(contentAlignment)
    ? contentAlignment
    : "center";

  return (
    <AppButton
      style={[styles.item, isDisabled && styles.disabled, style]}
      onPress={onPress}
      disabled={isDisabled}
      opacity={0.7}
    >
      <View
        style={[
          styles.itemContent,
          contentStyle,
          {
            flexDirection: isRTL ? "row-reverse" : contentDirection,
            alignItems: validAlignment,
            gap: moderateScale(contentRadioSpacing),
          },
        ]}
      >
        {/* Icon */}
        {option.icon && (
          <View style={[styles.icon, iconStyle]}>
            {renderIcon ? renderIcon(option.icon, isSelected) : option.icon}
          </View>
        )}

        {/* Label */}
        <View
          style={[
            styles.labelContainer,
            labelStyle,
            {
              flex: 1,
              marginLeft:
                !isRTL && option.icon ? moderateScale(iconLabelSpacing) : 0,
              marginRight:
                isRTL && option.icon ? moderateScale(iconLabelSpacing) : 0,
            },
          ]}
        >
          {renderLabel ? (
            renderLabel(option.label, isSelected)
          ) : (
            <AppText
              style={[
                styles.label,
                { textAlign: isRTL ? "right" : "left" },
                labelColor ? { color: labelColor } : undefined,
              ]}
            >
              {option.label}
            </AppText>
          )}
        </View>

        {/* Radio Button */}
        <View style={[styles.radioButtonContainer, radioButtonStyle]}>
          {renderRadioButton ? (
            renderRadioButton(isSelected, size)
          ) : (
            <View
              style={[
                styles.radioButton,
                {
                  width: radioSize,
                  height: radioSize,
                  borderRadius: radioSize / 2,
                  borderColor: isSelected ? resolvedActive : resolvedInactive,
                },
              ]}
            >
              {isSelected && (
                <View
                  style={[
                    styles.radioButtonSelected,
                    {
                      width: innerSize,
                      height: innerSize,
                      borderRadius: innerSize / 2,
                      backgroundColor: resolvedActive,
                    },
                  ]}
                />
              )}
            </View>
          )}
        </View>
      </View>
    </AppButton>
  );
};

export default RadioItem;
