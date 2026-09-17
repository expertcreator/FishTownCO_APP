import { colors } from "@/shared/constants";
import { useColors } from "@/shared/theme/ThemeContext";
import { useIsTablet } from "@/shared/hooks";
import { LinearGradient } from "expo-linear-gradient";
import {
  ScrollView,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { useEffect, useMemo, useRef } from "react";
import AppText from "../Text";
import {
  getStyles,
  type SegmentedControlVariant,
} from "./SegmentControl.style";

export type SegmentedOption = {
  key: string;
  label: string;
};

type SegmentedControlProps = {
  options: SegmentedOption[];
  value: string;
  onChange: (key: string) => void;
  containerStyle?: ViewStyle;
  activeTextStyle?: TextStyle;
  inactiveTextStyle?: TextStyle;
  gradientColors?: readonly [string, string, ...string[]];
  /** When true, tabs are horizontally scrollable with equal-width items. */
  scrollable?: boolean;
  /** `pill` (default) for filled segments; `underline` for compact tab bar. */
  variant?: SegmentedControlVariant;
};

export default function SegmentControl({
  options,
  value,
  onChange,
  containerStyle,
  activeTextStyle,
  inactiveTextStyle,
  gradientColors = [colors.primary1, colors.primaryRed] as const,
  scrollable = false,
  variant = "pill",
}: SegmentedControlProps) {
  const themeColors = useColors();
  const isTablet = useIsTablet();
  const styles = getStyles(themeColors, variant, isTablet);
  const isUnderline = variant === "underline";

  const scrollRef = useRef<ScrollView | null>(null);
  const layoutByKeyRef = useRef<Record<string, { x: number; width: number }>>(
    {}
  );
  const contentWidthRef = useRef(0);

  const activeKey = value;
  const activeIndex = useMemo(
    () => options.findIndex((o) => o.key === activeKey),
    [options, activeKey]
  );

  useEffect(() => {
    if (!scrollable) {
      return;
    }
    if (!scrollRef.current) {
      return;
    }
    if (activeIndex < 0) {
      return;
    }

    const layout = layoutByKeyRef.current[activeKey];
    if (!layout) {
      return;
    }

    const leftPadding = styles.scrollContent?.paddingHorizontal ?? 0;
    const rightPadding = leftPadding;
    const extraPeek = 12;
    const targetX = Math.max(0, layout.x - leftPadding - extraPeek);

    const isLast = activeIndex === options.length - 1;
    const lastBias = isLast ? layout.width : 0;
    const maxX = Math.max(0, contentWidthRef.current - rightPadding);

    scrollRef.current.scrollTo({
      x: Math.min(targetX + lastBias, maxX),
      y: 0,
      animated: true,
    });
  }, [
    scrollable,
    activeKey,
    activeIndex,
    options.length,
    styles.scrollContent,
  ]);

  const renderOptionContent = (label: string, isActive: boolean) => {
    if (isUnderline) {
      return (
        <AppText
          style={[
            isActive
              ? styles.activeTextUnderline
              : styles.inactiveTextUnderline,
            isActive ? activeTextStyle : inactiveTextStyle,
          ]}
        >
          {label}
        </AppText>
      );
    }
    if (isActive) {
      return (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.activePill}
        >
          <AppText style={[styles.activeText, activeTextStyle]}>
            {label}
          </AppText>
        </LinearGradient>
      );
    }
    return (
      <View style={styles.inactivePill}>
        <AppText style={[styles.inactiveText, inactiveTextStyle]}>
          {label}
        </AppText>
      </View>
    );
  };

  const content = (
    <>
      {options.map((opt) => {
        const isActive = opt.key === value;
        return (
          <TouchableOpacity
            key={opt.key}
            activeOpacity={0.85}
            style={[
              styles.itemContainer,
              isUnderline && styles.itemContainerUnderline,
              isUnderline &&
                isActive &&
                styles.itemContainerUnderlineActive,
              scrollable ? styles.itemContainerScrollable : undefined,
            ]}
            onPress={() => onChange(opt.key)}
            onLayout={(event) => {
              if (!scrollable) {
                return;
              }
              const { x, width } = event.nativeEvent.layout;
              layoutByKeyRef.current[opt.key] = { x, width };
            }}
          >
            {renderOptionContent(opt.label, isActive)}
          </TouchableOpacity>
        );
      })}
    </>
  );

  return (
    <View
      style={[
        styles.wrapper,
        scrollable ? styles.wrapperScrollable : undefined,
        containerStyle,
      ]}
    >
      {scrollable ? (
        <ScrollView
          ref={(node) => {
            scrollRef.current = node;
          }}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          onContentSizeChange={(width) => {
            contentWidthRef.current = width;
          }}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </View>
  );
}
