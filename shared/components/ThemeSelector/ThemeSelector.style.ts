import { Platform, StyleSheet } from "react-native";
import { moderateScale } from "@/shared/imports";
import { fontSizes, fonts } from "@/shared/constants";
import { hexToRgba } from "@/shared/constants/colors";
import type { useColors } from "@/shared/theme";

const SEGMENT_LINE_HEIGHT = moderateScale(14);
const SEGMENT_MIN_HEIGHT = moderateScale(22);

/** Wider track for Arabic-script labels (Urdu/Arabic) so text stays one size and aligned. */
export const getSegmentedTrackWidth = (language: string) =>
  language === "ur" || language === "ar"
    ? moderateScale(168)
    : moderateScale(120);

export const getSegmentedStyles = (
  colors: ReturnType<typeof useColors>,
  language: string
) =>
  StyleSheet.create({
    track: {
      flexDirection: "row",
      width: getSegmentedTrackWidth(language),
      borderWidth: 0.5,
      borderRadius: moderateScale(6),
      borderColor: colors.whitePure,
      backgroundColor: "transparent",
      padding: moderateScale(2),
      alignSelf: "flex-end",
    },
    segment: {
      flex: 1,
      overflow: "hidden",
      minWidth: 0,
    },
    segmentInner: {
      minHeight: SEGMENT_MIN_HEIGHT,
      paddingVertical: moderateScale(4),
      paddingHorizontal: moderateScale(2),
      alignItems: "center",
      justifyContent: "center",
      borderRadius: moderateScale(6),
    },
    segmentActive: {
      backgroundColor: colors.whitePure,
    },
    segmentText: {
      fontSize: fontSizes.tiny,
      fontFamily: fonts.button,
      lineHeight: SEGMENT_LINE_HEIGHT,
      textAlign: "center",
      ...(Platform.OS === "android" && { includeFontPadding: false }),
    },
    segmentActiveText: {
      color: colors.primary,
    },
    segmentInactiveText: {
      color: colors.whitePure,
    },
  });

/**
 * Compact light/auto/dark icon bar (header chrome).
 * Tablet uses fixed compact px so moderateScale does not inflate the control.
 * @param colors - Theme colors
 * @param isTablet - Landscape tablet
 */
export const getPreferenceStyles = (
  colors: ReturnType<typeof useColors>,
  isTablet = false
) => {
  /** Tablet: slightly denser than phone moderateScale, still ≥44pt row feel. */
  const hit = isTablet ? 28 : moderateScale(24);
  const pad = isTablet ? 3 : moderateScale(3);
  const gap = isTablet ? 2 : moderateScale(2);
  const radius = isTablet ? 16 : moderateScale(18);
  const indicatorRadius = isTablet ? 14 : moderateScale(12);

  return StyleSheet.create({
    bar: {
      flexDirection: "row",
      alignItems: "center",
      gap,
      borderRadius: radius,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: hexToRgba(colors.whitePure, 0.35),
      padding: pad,
    },
    segment: {
      justifyContent: "center",
      alignItems: "center",
    },
    segmentIndicator: {
      width: hit,
      height: hit,
      borderRadius: indicatorRadius,
      overflow: "hidden",
      justifyContent: "center",
      alignItems: "center",
    },
    segmentSelected: {
      backgroundColor: hexToRgba(colors.whitePure, 0.92),
      borderRadius: indicatorRadius,
    },
  });
};

export const getStyles = (
  colors: ReturnType<typeof useColors>,
  isTablet = false,
) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: moderateScale(12),
      paddingHorizontal: moderateScale(16),
      backgroundColor: colors.surface,
      borderRadius: moderateScale(8),
      marginVertical: moderateScale(4),
    },
    compactContainer: {
      padding: moderateScale(8),
      borderRadius: moderateScale(20),
      backgroundColor: colors.surface,
      justifyContent: "center",
      alignItems: "center",
    },
    toggleTrack: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      borderRadius: isTablet ? 100 : moderateScale(100),
      padding: isTablet ? 1 : moderateScale(1),
      borderWidth: 1,
      borderColor: colors.border,
      width: isTablet ? 68 : moderateScale(76),
      alignSelf: "flex-start",
    },
    toggleSegment: {
      flex: 1,
      minWidth: isTablet ? 32 : moderateScale(36),
      borderRadius: isTablet ? 100 : moderateScale(100),
      overflow: "hidden",
    },
    toggleSegmentInner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: isTablet ? 4 : moderateScale(3),
      paddingHorizontal: isTablet ? 4 : moderateScale(5),
      borderRadius: isTablet ? 100 : moderateScale(100),
    },
    toggleSegmentInactive: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: isTablet ? 4 : moderateScale(3),
      paddingHorizontal: isTablet ? 4 : moderateScale(5),
      borderRadius: isTablet ? 100 : moderateScale(100),
      backgroundColor: "transparent",
    },
    iconContainer: {
      marginRight: moderateScale(12),
    },
    text: {
      flex: 1,
      fontSize: fontSizes.small,
      fontFamily: fonts.button,
      color: colors.text,
    },
  });
