import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors, type ThemeColors } from "@/ui/theme";
import { useTranslation } from "@/ui/translations";
import { PrimaryButton } from "./Buttons";
import AppText from "./Text";

type DatePickerModalProps = {
  visible: boolean;
  initialDate?: Date | null;
  minDate?: Date;
  maxDate?: Date;
  title?: string;
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
 * Formats a Date for the sheet subtitle (e.g. 27 Sep 2026).
 * @param date - Selected date
 * @returns Short display label
 */
function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Fishtownco bottom-sheet calendar picker matching OptionsPickerModal chrome
 * and prototype cream / navy / teal / orange tokens.
 * @param props - Modal props
 * @param props.visible - Whether the modal is shown
 * @param props.initialDate - Date shown when opened
 * @param props.minDate - Optional minimum selectable date
 * @param props.maxDate - Optional maximum selectable date
 * @param props.title - Optional sheet title
 * @param props.onClose - Dismiss without saving
 * @param props.onConfirm - Confirm selected date
 * @returns Date picker modal
 */
export function DatePickerModal({
  visible,
  initialDate,
  minDate,
  maxDate,
  title,
  onClose,
  onConfirm,
}: DatePickerModalProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = getStyles(colors);
  const [tempDate, setTempDate] = useState<Date>(initialDate || new Date());

  useEffect(() => {
    if (visible) {
      setTempDate(initialDate || new Date());
    }
  }, [visible, initialDate]);

  const selectedKey = formatDateForCalendar(tempDate);
  const markedDates = useMemo(
    () => ({
      [selectedKey]: {
        selected: true,
        selectedColor: colors.orange,
        selectedTextColor: colors.white,
      },
    }),
    [colors.orange, colors.white, selectedKey]
  );

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
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerText}>
              <AppText style={styles.title}>
                {title ?? t("common.select-date")}
              </AppText>
              <AppText style={styles.subtitle}>
                {formatDisplayDate(tempDate)}
              </AppText>
            </View>
            <Pressable
              onPress={handleClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={t("common.close")}
              style={({ pressed }) => [
                styles.closeBtn,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="close" size={22} color={colors.navy} />
            </Pressable>
          </View>

          <View style={styles.calendarCard}>
            <Calendar
              current={selectedKey}
              onDayPress={(day: { dateString: string }) => {
                setTempDate(new Date(`${day.dateString}T12:00:00`));
              }}
              markedDates={markedDates}
              minDate={minDate ? formatDateForCalendar(minDate) : undefined}
              maxDate={maxDate ? formatDateForCalendar(maxDate) : undefined}
              enableSwipeMonths
              hideExtraDays
              firstDay={1}
              theme={{
                calendarBackground: colors.card,
                textSectionTitleColor: colors.muted,
                textSectionTitleDisabledColor: colors.dotInactive,
                dayTextColor: colors.navy,
                textDisabledColor: colors.dotInactive,
                todayTextColor: colors.teal,
                todayBackgroundColor: colors.softTeal,
                selectedDayBackgroundColor: colors.orange,
                selectedDayTextColor: colors.white,
                monthTextColor: colors.navy,
                textMonthFontWeight: "800",
                textMonthFontSize: 17,
                textDayHeaderFontWeight: "700",
                textDayHeaderFontSize: 12,
                textDayFontWeight: "600",
                textDayFontSize: 15,
                arrowColor: colors.teal,
                stylesheet: {
                  calendar: {
                    header: {
                      marginBottom: 8,
                    },
                  },
                },
              }}
              style={styles.calendar}
            />
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={handleClose}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.cancelBtn,
                pressed && styles.pressed,
              ]}
            >
              <AppText style={styles.cancelText}>{t("common.cancel")}</AppText>
            </Pressable>
            <PrimaryButton
              label={t("common.done")}
              icon="checkmark"
              iconPosition="leading"
              onPress={handleConfirm}
              style={styles.confirmBtn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Builds date-picker styles for the active Fishtownco palette.
 * @param colors - Active theme colors
 * @returns Style sheet
 */
function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(13,44,65,0.45)",
    },
    backdrop: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    sheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      paddingHorizontal: 16,
      maxHeight: "88%",
    },
    handle: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginTop: 10,
      marginBottom: 8,
    },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      paddingHorizontal: 4,
      paddingBottom: 12,
      gap: 12,
    },
    headerText: {
      flex: 1,
      gap: 4,
    },
    title: {
      color: colors.navy,
      fontSize: 18,
      fontWeight: "800",
      letterSpacing: 0.2,
    },
    subtitle: {
      color: colors.teal,
      fontSize: 14,
      fontWeight: "700",
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    calendarCard: {
      backgroundColor: colors.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 8,
      paddingTop: 8,
      paddingBottom: 4,
      overflow: "hidden",
    },
    calendar: {
      borderRadius: 16,
    },
    actions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: 14,
    },
    cancelBtn: {
      minHeight: 52,
      paddingHorizontal: 18,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
    },
    cancelText: {
      color: colors.navy,
      fontSize: 15,
      fontWeight: "700",
    },
    confirmBtn: {
      flex: 1,
    },
    pressed: { opacity: 0.85 },
  });
}
