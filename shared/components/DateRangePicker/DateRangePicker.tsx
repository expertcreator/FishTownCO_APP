import { useEffect, useState } from "react";
import { View } from "react-native";
import { useTranslation } from "@/shared/translations/useTranslation";
import AppBottomSheet from "../BottomSheet";
import AppButton from "../Button";
import { colors as constantColors } from "@/shared/constants";
import { Calendar } from "react-native-calendars";
import { getStyles } from "./DateRangePicker.style";
import { Feather } from "@expo/vector-icons";
import type { DateRangePickerProps } from "./DateRangePicker.type";
import { useColors } from "@/shared/theme";

type MarkedDate = {
  startingDay?: boolean;
  endingDay?: boolean;
  color: string;
  textColor: string;
};

type MarkedDates = Record<string, MarkedDate>;

const buildMarkedDates = (
  startDate: string | null,
  endDate: string | null,
  themeColors: ReturnType<typeof useColors>
): MarkedDates => {
  if (!(startDate && endDate)) {
    if (startDate) {
      return {
        [startDate]: {
          startingDay: true,
          endingDay: true,
          color: constantColors.primaryRed,
          textColor: themeColors.white,
        },
      };
    }
    return {};
  }

  const range: MarkedDates = {};
  let current = startDate;

  while (current && current <= endDate) {
    if (current === startDate && current === endDate) {
      range[current] = {
        startingDay: true,
        endingDay: true,
        color: constantColors.primaryRed,
        textColor: themeColors.white,
      };
    } else if (current === startDate) {
      range[current] = {
        startingDay: true,
        color: constantColors.primaryRed,
        textColor: themeColors.white,
      };
    } else if (current === endDate) {
      range[current] = {
        endingDay: true,
        color: constantColors.primaryRed,
        textColor: themeColors.white,
      };
    } else {
      range[current] = {
        color: constantColors.primaryRedLight, // lighter primary red for in-between dates
        textColor: themeColors.white, // keep text white for all selected dates
      };
    }

    // Increment current by 1 day
    const currentDateObj = new Date(current);
    currentDateObj.setDate(currentDateObj.getDate() + 1);
    const nextYear = currentDateObj.getFullYear();
    const nextMonth = (currentDateObj.getMonth() + 1)
      .toString()
      .padStart(2, "0");
    const nextDay = currentDateObj.getDate().toString().padStart(2, "0");
    current = `${nextYear}-${nextMonth}-${nextDay}`;
  }

  return range;
};

const DateRangePicker = ({
  value,
  onChange,
  isVisible = false,
  onClose,
}: DateRangePickerProps) => {
  const { t } = useTranslation();
  const themeColors = useColors();
  const styles = getStyles(themeColors);
  const { startDate, endDate } = value;

  const [tempStartDate, setTempStartDate] = useState<string | null>(startDate);
  const [tempEndDate, setTempEndDate] = useState<string | null>(endDate);
  const [tempMarkedDates, setTempMarkedDates] = useState<MarkedDates>({});

  // Update temp dates when value prop changes
  useEffect(() => {
    setTempStartDate(value.startDate);
    setTempEndDate(value.endDate);
  }, [value.startDate, value.endDate]);

  const handleDayPress = (day: { dateString: string }) => {
    const dateStr = day.dateString; // "YYYY-MM-DD"

    // If no start date or both start & end are already set, reset the range
    if (!tempStartDate || tempEndDate) {
      setTempStartDate(dateStr);
      setTempEndDate(null);
      setTempMarkedDates({
        [dateStr]: {
          startingDay: true,
          endingDay: true,
          color: constantColors.primaryRed,
          textColor: themeColors.white,
        },
      });
      return;
    }

    // Determine the actual start and end dates (handle inverted selection)
    // If selected date is before tempStartDate, swap them
    const actualStartDate = dateStr < tempStartDate ? dateStr : tempStartDate;
    const actualEndDate = dateStr < tempStartDate ? tempStartDate : dateStr;

    setTempStartDate(actualStartDate);
    setTempEndDate(actualEndDate);
    setTempMarkedDates(
      buildMarkedDates(actualStartDate, actualEndDate, themeColors)
    );
  };

  const handleApplyFilter = () => {
    onChange({
      startDate: tempStartDate,
      endDate: tempEndDate,
    });
    if (onClose) {
      onClose();
    }
  };

  const handleClearFilter = () => {
    onChange({
      startDate: null,
      endDate: null,
    });
    if (onClose) {
      onClose();
    }

    setTempStartDate(null);
    setTempEndDate(null);
    setTempMarkedDates({});
  };

  // Format date range display text

  return (
    <>
      {/* Calendar Bottom Sheet - full width */}
      <AppBottomSheet
        isVisible={isVisible}
        showDragIndicator={false}
        onClose={onClose}
        horizontalMargin={0}
      >
        <View style={styles.calendarContainer}>
          <Calendar
            markingType="period"
            markedDates={tempMarkedDates}
            onDayPress={handleDayPress}
            theme={{
              selectedDayBackgroundColor: constantColors.primaryRed,
              selectedDayTextColor: themeColors.white,
              arrowColor: constantColors.primaryRed,
              backgroundColor: themeColors.white,
              calendarBackground: themeColors.white,
              textSectionTitleColor: themeColors.text,
              dayTextColor: themeColors.text,
              todayTextColor: constantColors.primaryRed,
              textDisabledColor: themeColors.textSecondary,
            }}
            renderArrow={(direction) => (
              <Feather
                name={direction === "left" ? "chevron-left" : "chevron-right"}
                size={24}
                color={constantColors.primaryRed}
              />
            )}
          />
          <View style={styles.buttonContainer}>
            <AppButton
              title={t("clear", "Clear")}
              onPress={handleClearFilter}
              variant="outline"
              borderColor={constantColors.primary}
              color={constantColors.primary}
              backgroundColor={themeColors.white}
              style={styles.clearButton}
            />
            <AppButton
              title={t("apply", "Apply")}
              onPress={handleApplyFilter}
              variant="primary"
              backgroundColor={constantColors.primary}
              style={styles.applyButton}
            />
          </View>
        </View>
      </AppBottomSheet>
    </>
  );
};

export default DateRangePicker;
