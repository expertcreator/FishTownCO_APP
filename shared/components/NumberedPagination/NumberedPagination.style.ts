import { fonts, fontSizes } from "@/shared/constants";
import { moderateScale } from "@/shared/imports";
import type { useColors } from "@/shared/theme";
import { StyleSheet } from "react-native";

/**
 * Builds numbered-pagination styles for phone and tablet.
 * @param colors - Theme colors from `useColors`
 * @param isTablet - When true, uses raw sizes instead of `moderateScale`
 * @returns StyleSheet for `NumberedPagination`
 */
export const createNumberedPaginationStyles = (
  colors: ReturnType<typeof useColors>,
  isTablet: boolean,
) => {
  const sz = (n: number) => (isTablet ? n : moderateScale(n));
  const btn = isTablet ? 26 : moderateScale(32);
  const pageBtn = isTablet ? 26 : moderateScale(30);

  return StyleSheet.create({
    container: {
      paddingVertical: sz(8),
      paddingHorizontal: sz(2),
      alignItems: "center",
      alignSelf: "stretch",
      gap: isTablet ? 2 : moderateScale(4),
      width: "100%",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "center",
      flexWrap: "nowrap",
      gap: isTablet ? 4 : moderateScale(4),
      width: "100%",
    },
    navButton: {
      width: btn,
      height: btn,
      borderRadius: isTablet ? 6 : moderateScale(8),
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    navButtonDisabled: {
      opacity: 0.4,
    },
    pageButton: {
      minWidth: pageBtn,
      height: pageBtn,
      paddingHorizontal: isTablet ? 4 : moderateScale(4),
      borderRadius: isTablet ? 6 : moderateScale(8),
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      flexShrink: 0,
    },
    pageButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    pageButtonText: {
      fontSize: isTablet ? fontSizes.tiny : fontSizes.small,
      fontFamily: fonts.title,
      color: colors.text,
    },
    pageButtonTextActive: {
      color: colors.white,
      fontFamily: fonts.heading,
    },
    summary: {
      fontSize: fontSizes.tiny,
      fontFamily: fonts.subTitle,
      color: colors.textSecondary,
      textAlign: "center",
      alignSelf: "stretch",
      width: "100%",
    },
  });
};
