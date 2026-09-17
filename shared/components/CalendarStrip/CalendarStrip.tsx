import { useMemo } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { useColors } from "@/shared/theme";
import AppText from "../Text";
import { getStyles } from "./CalendarStrip.style";

export type CalendarItem = {
  day: string;
  label: string;
  month?: string;
  iso?: string;
};

type CalendarStripProps = {
  title: string;
  month?: string;
  items: CalendarItem[];
  value: string; // ISO date string (YYYY-MM-DD) or day string for backward compatibility
  onChange: (value: string) => void; // Returns ISO date or day string
};

export default function CalendarStrip({
  title,
  month,
  items,
  value,
  onChange,
}: CalendarStripProps) {
  const themeColors = useColors();
  const styles = useMemo(() => getStyles(themeColors), [themeColors]);
  // Get today's date at midnight for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if a date is in the past
  const isPastDate = (isoDate: string | undefined): boolean => {
    if (!isoDate) {
      return false; // If no ISO date, can't determine if it's past
    }
    const itemDate = new Date(isoDate);
    itemDate.setHours(0, 0, 0, 0);
    return itemDate < today;
  };

  return (
    <View style={styles.container}>
      <AppText style={styles.header}>{title}</AppText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.datesRow}
        style={styles.scrollView}
      >
        {items.map((item) => {
          // Support both ISO date and day string for backward compatibility
          const isActive =
            item.iso === value || (!item.iso && item.day === value);
          const isDisabled = isPastDate(item.iso);
          // Use item's month if provided, otherwise fall back to prop month
          const displayMonth = item.month ?? month ?? "";
          const Content = (
            <>
              {displayMonth && (
                <AppText
                  style={[
                    styles.dateDay,
                    isActive && styles.selectedText,
                    isDisabled && styles.disabledText,
                  ]}
                >
                  {displayMonth}
                </AppText>
              )}
              <AppText
                style={[
                  styles.dateDay,
                  isActive && styles.selectedText,
                  isDisabled && styles.disabledText,
                ]}
              >
                {item.day}
              </AppText>
              <AppText
                style={[
                  styles.dateDay,
                  isActive && styles.selectedText,
                  isDisabled && styles.disabledText,
                ]}
              >
                {item.label}
              </AppText>
            </>
          );
          return (
            <TouchableOpacity
              key={item.iso ?? item.day}
              activeOpacity={0.85}
              onPress={() => {
                if (!isDisabled) {
                  onChange(item.iso ?? item.day);
                }
              }}
              disabled={isDisabled}
              style={[styles.dateItem, isDisabled && styles.disabledItem]}
            >
              {isActive ? (
                <LinearGradient
                  colors={[themeColors.primary1, themeColors.primaryRed]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.dateBox}
                >
                  {Content}
                </LinearGradient>
              ) : (
                <View
                  style={[styles.dateBox, isDisabled && styles.disabledBox]}
                >
                  {Content}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
