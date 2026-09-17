import AppButton from "@/shared/components/Button";
import AppBottomSheet from "@/shared/components/BottomSheet";
import { SheetCloseButton } from "@/shared/components";
import type { DateRange } from "@/shared/components/DateRangePicker/DateRangePicker.type";
import { GradientButton } from "@/features/auth/components";
import AppText from "@/shared/components/Text/AppText";
import AppTextInput from "@/shared/components/TextInput";
import { fontSizes, colors as constantColors } from "@/shared/constants";
import { useColors } from "@/shared/theme";
import { useTranslation } from "@/shared/translations";
import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { StyleSheet, ScrollView, TouchableOpacity, View } from "react-native";
import { getStyles } from "./OrderFilterModal.style";

const CalendarIcon = ({ color, size }: { color?: string; size?: number }) => {
  const themeColors = useColors();
  return (
    <Feather
      name="calendar"
      size={size || 20}
      color={color || themeColors.textSecondary}
    />
  );
};

type PresetButtonProps = {
  label: string;
  isActive: boolean;
  onPress: () => void;
  styles: ReturnType<typeof getStyles>;
};

const PresetButton: React.FC<PresetButtonProps> = ({
  label,
  isActive,
  onPress,
  styles,
}) => (
  <TouchableOpacity
    style={[styles.presetButton, isActive && styles.presetButtonActive]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <AppText
      style={[
        styles.presetButtonText,
        isActive && styles.presetButtonTextActive,
      ]}
      numberOfLines={1}
    >
      {label}
    </AppText>
  </TouchableOpacity>
);

const getPresetDates = (days: number): DateRange => {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (days - 1));
  startDate.setHours(0, 0, 0, 0);

  return {
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
  };
};

export type OrderFilterModalProps = {
  isVisible: boolean;
  onClose?: () => void;
  onConfirm?: (dateRange: DateRange) => void;
  onReset?: () => void;
  currentDateRange: DateRange;
  onOpenDatePicker?: () => void;
};

const OrderFilterModal: React.FC<OrderFilterModalProps> = ({
  isVisible,
  onClose,
  onConfirm,
  onReset,
  currentDateRange,
  onOpenDatePicker,
}) => {
  const { t, i18n } = useTranslation();
  const themeColors = useColors();
  const styles = getStyles(themeColors);
  const [tempDateRange, setTempDateRange] =
    useState<DateRange>(currentDateRange);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  useEffect(() => {
    if (isVisible) {
      setTempDateRange(currentDateRange);
      const { startDate, endDate } = currentDateRange;

      if (startDate && endDate) {
        const presets: { key: string; range: DateRange }[] = [
          { key: "2days", range: getPresetDates(2) },
          { key: "5days", range: getPresetDates(5) },
          { key: "7days", range: getPresetDates(7) },
        ];

        const matched = presets.find(
          (p) => p.range.startDate === startDate && p.range.endDate === endDate
        );

        setSelectedPreset(matched ? matched.key : null);
      } else {
        setSelectedPreset(null);
      }
    }
  }, [isVisible, currentDateRange]);

  const handlePresetSelect = (days: number, presetName: string) => {
    const dates = getPresetDates(days);
    setTempDateRange(dates);
    setSelectedPreset(presetName);
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm(tempDateRange);
    }
    if (onClose) {
      onClose();
    }
  };

  const handleReset = () => {
    setTempDateRange({ startDate: null, endDate: null });
    setSelectedPreset(null);
    if (onReset) {
      onReset();
    }
    if (onClose) {
      onClose();
    }
  };
  const handleDateInputPress = () => {
    if (onOpenDatePicker) {
      onOpenDatePicker();
    }
  };
  return (
    <AppBottomSheet
      isVisible={isVisible}
      showDragIndicator={false}
      onClose={onClose}
      enablePanDownToClose={true}
      disableBackdropClose={false}
      horizontalMargin={0}
    >
      <View style={styles.container}>
        <View style={styles.titleRow}>
          <AppText style={styles.title}>{t("ordersDelivery.filter-title")}</AppText>
          <SheetCloseButton onPress={() => onClose?.()} />
        </View>

        <AppText style={styles.subTitle}>{t("ordersDelivery.filter-subtitle")}</AppText>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          bounces={false}
          style={styles.presetContainer}
          contentContainerStyle={styles.presetContainerContent}
        >
          <PresetButton
            label={t("ordersDelivery.last-2-days")}
            isActive={selectedPreset === "2days"}
            onPress={() => handlePresetSelect(2, "2days")}
            styles={styles}
          />
          <PresetButton
            label={t("ordersDelivery.last-5-days")}
            isActive={selectedPreset === "5days"}
            onPress={() => handlePresetSelect(5, "5days")}
            styles={styles}
          />
          <PresetButton
            label={t("ordersDelivery.last-7-days")}
            isActive={selectedPreset === "7days"}
            onPress={() => handlePresetSelect(7, "7days")}
            styles={styles}
          />
        </ScrollView>

        <View style={styles.dateRangeContainer}>
          <TouchableOpacity activeOpacity={0.7} onPress={handleDateInputPress}>
            <AppTextInput
              value={
                tempDateRange.startDate && tempDateRange.endDate
                  ? `${tempDateRange.startDate} - ${tempDateRange.endDate}`
                  : t("ordersDelivery.date-range-placeholder", "Select date range")
              }
              editable={false}
              onChangeText={() => {}}
              leftIcon={CalendarIcon}
              iconColor={themeColors.textSecondary}
              pointerEvents="none"
              placeholder={t(
                "orders.date-range-placeholder",
                "Select date range"
              )}
              containerStyle={styles.customDateInput}
              style={[
                styles.customDateInputText,
                tempDateRange.startDate &&
                  tempDateRange.endDate &&
                  styles.customDateInputTextFilled,
              ]}
              placeholderTextColor={themeColors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          <AppButton
            title={t("shifts.reset")}
            onPress={handleReset}
            style={styles.resetButton}
            textStyle={styles.resetButtonText}
            color={constantColors.primaryRed}
          />
          <GradientButton
            title={t("ordersDelivery.apply-filter")}
            onPress={handleConfirm}
            style={styles.confirmButton}
            textStyle={StyleSheet.flatten([
              styles.confirmButtonText,
              {
                fontSize: i18n.language?.startsWith("en")
                  ? fontSizes.h6
                  : fontSizes.small,
              },
            ])}
          />
        </View>
      </View>
    </AppBottomSheet>
  );
};

export default OrderFilterModal;
