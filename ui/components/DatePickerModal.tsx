import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { useColors, type ThemeColors } from "@/ui/theme";
import AppText from "./Text";

type DatePickerModalProps = {
  visible: boolean;
  initialDate?: Date | null;
  minDate?: Date;
  maxDate?: Date;
  onClose: () => void;
  onConfirm: (date: Date) => void;
};

/**
 * Formats a Date as `YYYY-MM-DD` for react-native-calendars.
 * @param date - Date to format
 * @returns Calendar date string, or empty when null
 */
function formatDateForCalendar(date: Date | null | undefined): string {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Foori-style calendar date picker modal (Cancel / Done + Calendar).
 * @param props - Modal props
 * @param props.visible - Whether the modal is shown
 * @param props.initialDate - Date shown when opened
 * @param props.minDate - Optional minimum selectable date
 * @param props.maxDate - Optional maximum selectable date
 * @param props.onClose - Dismiss without saving
 * @param props.onConfirm - Confirm selected date
 * @returns Date picker modal
 */
export function DatePickerModal({
  visible,
  initialDate,
  minDate,
  maxDate,
  onClose,
  onConfirm,
}: DatePickerModalProps) {
  const colors = useColors();
  const styles = getStyles(colors);
  const [tempDate, setTempDate] = useState<Date>(initialDate || new Date());

  useEffect(() => {
    if (visible) {
      setTempDate(initialDate || new Date());
    }
  }, [visible, initialDate]);

  /**
   * Confirms the temporary selection and closes the modal.
   * @returns void
   */
  const handleConfirm = () => {
    onConfirm(tempDate);
    onClose();
  };

  /**
   * Resets temp date and closes without confirming.
   * @returns void
   */
  const handleClose = () => {
    setTempDate(initialDate || new Date());
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent={false}
    >
      <View style={styles.modalOverlay}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.modalOverlayBackdrop} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Pressable
              onPress={handleClose}
              style={({ pressed }) => [pressed && styles.pressed]}
            >
              <AppText style={styles.modalButtonText}>Cancel</AppText>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              style={({ pressed }) => [pressed && styles.pressed]}
            >
              <AppText style={styles.modalButtonText}>Done</AppText>
            </Pressable>
          </View>
          <View style={styles.calendarContainer}>
            <Calendar
              current={formatDateForCalendar(tempDate)}
              onDayPress={(day: { dateString: string }) => {
                setTempDate(new Date(`${day.dateString}T12:00:00`));
              }}
              markedDates={{
                [formatDateForCalendar(tempDate)]: {
                  selected: true,
                  selectedColor: colors.teal,
                },
              }}
              minDate={minDate ? formatDateForCalendar(minDate) : undefined}
              maxDate={maxDate ? formatDateForCalendar(maxDate) : undefined}
              theme={{
                todayTextColor: colors.teal,
                arrowColor: colors.teal,
                selectedDayBackgroundColor: colors.teal,
                selectedDayTextColor: colors.white,
                monthTextColor: colors.navy,
                textSectionTitleColor: colors.muted,
                dayTextColor: colors.navy,
                calendarBackground: colors.card,
              }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Builds date-picker styles for the active palette.
 * @param colors - Active theme colors
 * @returns Style sheet
 */
function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    modalOverlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalOverlayBackdrop: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 20,
      width: "90%",
      maxWidth: 400,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    modalButtonText: {
      color: colors.teal,
      fontSize: 16,
      fontWeight: "700",
    },
    calendarContainer: {
      minHeight: 350,
    },
    pressed: { opacity: 0.7 },
  });
}
