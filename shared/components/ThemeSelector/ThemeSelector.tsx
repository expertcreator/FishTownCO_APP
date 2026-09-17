import React, { useMemo } from "react";
import { TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Path } from "react-native-svg";
import { useTheme, useColors, type ThemePreference } from "@/shared/theme";
import AppText from "@/shared/components/Text";
import { moderateScale } from "@/shared/imports";
import { colors as appColors } from "@/shared/constants";
import { useIsTablet } from "@/shared/hooks";
import { useTranslation } from "@/shared/translations";
import {
  getPreferenceStyles,
  getSegmentedStyles,
  getStyles,
} from "./ThemeSelector.style";
import type {
  ThemeSegmentIcon,
  ThemeSelectorProps,
} from "./ThemeSelector.type";

const THEME_SEGMENT_SELECTED_ICON = "#111827";

const SEGMENTED_TEXT_OPTIONS: {
  preference: ThemePreference;
  labelKey: string;
  accessibilityLabel: string;
}[] = [
    {
      preference: "light",
      labelKey: "profile-flow.theme-segment-light",
      accessibilityLabel: "Light theme",
    },
    {
      preference: "system",
      labelKey: "profile-flow.theme-segment-auto",
      accessibilityLabel: "Auto theme",
    },
    {
      preference: "dark",
      labelKey: "profile-flow.theme-segment-dark",
      accessibilityLabel: "Dark theme",
    },
  ];

const PREFERENCE_ICON_OPTIONS = [
  {
    value: "light" as const,
    labelKey: "profile-flow.theme-segment-light",
    icon: "sunny" as const,
  },
  {
    value: "system" as const,
    labelKey: "profile-flow.theme-segment-auto",
    icon: "auto" as const,
  },
  {
    value: "dark" as const,
    labelKey: "profile-flow.theme-segment-dark",
    icon: "moon" as const,
  },
] satisfies {
  value: ThemePreference;
  labelKey: string;
  icon: ThemeSegmentIcon;
}[];

function ThemeAutoIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle
        cx="12"
        cy="12"
        r="9"
        stroke={color}
        strokeWidth="1.8"
        fill="none"
      />
      <Path d="M 12 3 A 9 9 0 0 1 12 21 Z" fill={color} />
    </Svg>
  );
}

function ThemeSegmentIconView({
  icon,
  size,
  color,
}: {
  icon: ThemeSegmentIcon;
  size: number;
  color: string;
}) {
  if (icon === "auto") {
    return <ThemeAutoIcon size={size} color={color} />;
  }
  return <Ionicons name={icon} size={size} color={color} />;
}

function getNextThemeLabel(isSystem: boolean, isDark: boolean): string {
  if (isSystem) {
    return "Auto Theme";
  }
  if (isDark) {
    return "Light Mode";
  }
  return "Dark Mode";
}

function getThemeToggleIconName(
  isSystem: boolean,
  isDark: boolean
): "phone-portrait-outline" | "sunny" | "moon" {
  if (isSystem) {
    return "phone-portrait-outline";
  }
  if (isDark) {
    return "sunny";
  }
  return "moon";
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  variant = "default",
  style,
}) => {
  const { toggleTheme, isDark, themePreference, setThemePreference } =
    useTheme();
  const colors = useColors();
  const isTablet = useIsTablet();
  const { t, language } = useTranslation();

  const styles = getStyles(colors, isTablet);
  const segmentedStyles = useMemo(
    () => getSegmentedStyles(colors, language),
    [colors, language]
  );
  const preferenceStyles = useMemo(
    () => getPreferenceStyles(colors, isTablet),
    [colors, isTablet]
  );

  const isSystem = themePreference === "system";
  const nextThemeLabel = getNextThemeLabel(isSystem, isDark);
  const toggleIconName = getThemeToggleIconName(isSystem, isDark);
  const handleRestoreAuto = () => setThemePreference("system");

  if (variant === "preference") {
    return (
      <View
        style={[preferenceStyles.bar, style]}
        accessibilityRole="radiogroup"
        accessibilityLabel={t("theme")}
      >
        {PREFERENCE_ICON_OPTIONS.map(({ value, labelKey, icon }) => {
          const selected = themePreference === value;
          const iconColor = selected
            ? THEME_SEGMENT_SELECTED_ICON
            : colors.whitePure;

          return (
            <TouchableOpacity
              key={value}
              style={preferenceStyles.segment}
              activeOpacity={0.85}
              onPress={() => setThemePreference(value)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={t(labelKey)}
            >
              <View
                style={[
                  preferenceStyles.segmentIndicator,
                  selected && preferenceStyles.segmentSelected,
                ]}
              >
                <ThemeSegmentIconView
                  icon={icon}
                  size={isTablet ? 15 : moderateScale(14)}
                  color={iconColor}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  if (variant === "segmented") {
    return (
      <View
        style={[segmentedStyles.track, style]}
        accessibilityRole="radiogroup"
        accessibilityLabel="Theme"
      >
        {SEGMENTED_TEXT_OPTIONS.map((option) => {
          const isSelected = themePreference === option.preference;
          const label = t(option.labelKey);

          return (
            <TouchableOpacity
              key={option.preference}
              style={segmentedStyles.segment}
              onPress={() => setThemePreference(option.preference)}
              activeOpacity={0.85}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={option.accessibilityLabel}
            >
              <View
                style={[
                  segmentedStyles.segmentInner,
                  isSelected && segmentedStyles.segmentActive,
                ]}
              >
                <AppText
                  style={[
                    segmentedStyles.segmentText,
                    isSelected
                      ? segmentedStyles.segmentActiveText
                      : segmentedStyles.segmentInactiveText,
                  ]}
                  numberOfLines={1}
                >
                  {label}
                </AppText>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  if (variant === "toggle") {
    return (
      <View
        style={[styles.toggleTrack, style]}
        accessibilityRole="radiogroup"
        accessibilityHint="Long press either segment to follow the system theme"
      >
        <TouchableOpacity
          style={styles.toggleSegment}
          onPress={() => {
            if (isDark) {
              toggleTheme();
            }
          }}
          onLongPress={handleRestoreAuto}
          activeOpacity={0.85}
          accessibilityRole="radio"
          accessibilityState={{ selected: !isDark }}
          accessibilityLabel="Light theme"
        >
          {isDark ? (
            <View style={styles.toggleSegmentInactive}>
              <Ionicons
                name="sunny"
                size={isTablet ? 14 : moderateScale(13)}
                color={colors.text}
              />
            </View>
          ) : (
            <LinearGradient
              colors={[appColors.primary1, appColors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.toggleSegmentInner}
            >
              <Ionicons
                name="sunny"
                size={isTablet ? 14 : moderateScale(13)}
                color={colors.whitePure}
              />
            </LinearGradient>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.toggleSegment}
          onPress={() => {
            if (!isDark) {
              toggleTheme();
            }
          }}
          onLongPress={handleRestoreAuto}
          activeOpacity={0.85}
          accessibilityRole="radio"
          accessibilityState={{ selected: isDark }}
          accessibilityLabel="Dark theme"
        >
          {isDark ? (
            <LinearGradient
              colors={[appColors.primary1, appColors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.toggleSegmentInner}
            >
              <Ionicons
                name="moon"
                size={isTablet ? 14 : moderateScale(13)}
                color={colors.whitePure}
              />
            </LinearGradient>
          ) : (
            <View style={styles.toggleSegmentInactive}>
              <Ionicons
                name="moon"
                size={isTablet ? 14 : moderateScale(13)}
                color={colors.text}
              />
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  if (variant === "compact") {
    return (
      <TouchableOpacity
        style={[styles.compactContainer, style]}
        onPress={toggleTheme}
        onLongPress={handleRestoreAuto}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={
          isDark ? "Switch to light mode" : "Switch to dark mode"
        }
        accessibilityHint="Long press to follow the system theme"
      >
        <Ionicons
          name={toggleIconName}
          size={moderateScale(13)}
          color={colors.text}
        />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={toggleTheme}
      onLongPress={handleRestoreAuto}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={
        isDark ? "Switch to light mode" : "Switch to dark mode"
      }
      accessibilityHint="Long press to follow the system theme"
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name={toggleIconName}
          size={moderateScale(22)}
          color={colors.text}
        />
      </View>
      <AppText style={styles.text}>{nextThemeLabel}</AppText>
      <Ionicons
        name="chevron-forward"
        size={moderateScale(13)}
        color={colors.textSecondary}
      />
    </TouchableOpacity>
  );
};

export default ThemeSelector;
