import React from "react";
import { ViewStyle } from "react-native";

export type RadioOption<T = string> = {
  value: T;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
};

export type RadioGroupProps<T = string> = {
  /**
   * Array of radio options
   */
  options: RadioOption<T>[];
  /**
   * Currently selected value
   */
  value?: T;
  /**
   * Callback when selection changes
   */
  onValueChange?: (value: T) => void;
  /**
   * Direction of the radio group
   * @default "vertical"
   */
  direction?: "vertical" | "horizontal";
  /**
   * Custom style for the container
   */
  style?: ViewStyle;
  /**
   * Custom style for individual radio items
   */
  itemStyle?: ViewStyle;
  /**
   * Whether the radio group is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Color for the selected state
   * @default colors.primary
   */
  activeColor?: string;
  /**
   * Color for the unselected state
   * @default colors.lightGray
   */
  inactiveColor?: string;
  /**
   * Size of the radio button
   * @default 20
   */
  size?: number;
  /**
   * Custom style for the radio item content container
   */
  contentStyle?: ViewStyle;
  /**
   * Custom render function for the icon
   */
  renderIcon?: (icon: React.ReactNode, isSelected: boolean) => React.ReactNode;
  /**
   * Custom render function for the label
   */
  renderLabel?: (label: string, isSelected: boolean) => React.ReactNode;
  /**
   * Custom render function for the radio button
   */
  renderRadioButton?: (isSelected: boolean, size: number) => React.ReactNode;

  /**
   * Layout direction for the item content
   */
  contentDirection?: "row" | "column";

  /**
   * Alignment for the item content
   */
  contentAlignment?:
    | "flex-start"
    | "center"
    | "flex-end"
    | "space-between"
    | "space-around";

  /**
   * Custom style for the icon container
   */
  iconStyle?: ViewStyle;
  /**
   * Custom style for the label
   */
  labelStyle?: ViewStyle;
  /**
   * Custom style for the radio button container
   */
  radioButtonStyle?: ViewStyle;
  /**
   * Spacing between icon and label
   */
  iconLabelSpacing?: number;
  /**
   * Spacing between content and radio button
   */
  contentRadioSpacing?: number;
  /**
   * Color for the label text
   */
  labelColor?: string;
};

export type RadioItemProps<T = string> = {
  /**
   * Radio option data
   */
  option: RadioOption<T>;
  /**
   * Whether this item is selected
   */
  isSelected: boolean;
  /**
   * Callback when this item is pressed
   */
  onPress: () => void;
  /**
   * Whether this item is disabled (combines group-level and item-level disabled states)
   */
  isDisabled?: boolean;
  /**
   * Custom style for the item
   */
  style?: ViewStyle;
  /**
   * Color for the selected state
   */
  activeColor?: string;
  /**
   * Color for the unselected state
   */
  inactiveColor?: string;
  /**
   * Size of the radio button
   */
  size?: number;
  /**
   * Custom style for the radio item content container
   */
  contentStyle?: ViewStyle;
  /**
   * Custom render function for the icon
   */
  renderIcon?: (icon: React.ReactNode, isSelected: boolean) => React.ReactNode;
  /**
   * Custom render function for the label
   */
  renderLabel?: (label: string, isSelected: boolean) => React.ReactNode;
  /**
   * Custom render function for the radio button
   */
  renderRadioButton?: (isSelected: boolean, size: number) => React.ReactNode;

  /**
   * Layout direction for the item content
   */
  contentDirection?: "row" | "column";

  /**
   * Alignment for the item content
   */
  contentAlignment?:
    | "flex-start"
    | "center"
    | "flex-end"
    | "space-between"
    | "space-around";

  /**
   * Custom style for the icon container
   */
  iconStyle?: ViewStyle;
  /**
   * Custom style for the label
   */
  labelStyle?: ViewStyle;
  /**
   * Custom style for the radio button container
   */
  radioButtonStyle?: ViewStyle;
  /**
   * Spacing between icon and label
   */
  iconLabelSpacing?: number;
  /**
   * Spacing between content and radio button
   */
  contentRadioSpacing?: number;
  /**
   * Color for the label text
   */
  labelColor?: string;
};
