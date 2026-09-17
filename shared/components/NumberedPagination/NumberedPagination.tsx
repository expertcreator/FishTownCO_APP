import { Ionicons } from "@expo/vector-icons";
import {
  Pressable,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { moderateScale } from "@/shared/imports";
import { useMemo } from "react";
import { useIsTablet } from "@/shared/hooks";
import { useColors } from "@/shared/theme";
import { useTranslation } from "@/shared/translations";
import AppText from "../Text";
import { createNumberedPaginationStyles } from "./NumberedPagination.style";

export type NumberedPaginationProps = {
  page: number;
  totalPages: number;
  pageNumbers: number[];
  canGoPrevious: boolean;
  canGoNext: boolean;
  rangeStart?: number;
  rangeEnd?: number;
  totalItems?: number;
  onPageChange: (page: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  /** Optional root style (e.g. bottom inset). */
  style?: StyleProp<ViewStyle>;
};

/**
 * Numbered page controls with optional “Showing X–Y of Z” summary.
 * @param props - Pagination props
 * @returns Pagination element, or null when `totalPages` ≤ 1
 */
const NumberedPagination = ({
  page,
  totalPages,
  pageNumbers,
  canGoPrevious,
  canGoNext,
  rangeStart = 0,
  rangeEnd = 0,
  totalItems = 0,
  onPageChange,
  onPrevious,
  onNext,
  style,
}: NumberedPaginationProps) => {
  const colors = useColors();
  const isTablet = useIsTablet();
  const { t, isRTL } = useTranslation();
  const styles = useMemo(
    () => createNumberedPaginationStyles(colors, isTablet),
    [colors, isTablet]
  );
  const chevronSize = isTablet ? 14 : moderateScale(18);

  if (totalPages <= 1) {
    return null;
  }

  const previousIcon = isRTL ? "chevron-forward" : "chevron-back";
  const nextIcon = isRTL ? "chevron-back" : "chevron-forward";

  return (
    <View style={[styles.container, style]}>
      {totalItems > 0 ? (
        <AppText style={styles.summary}>
          {t("pagination-showing", "Showing {start}–{end} of {total}", {
            start: rangeStart,
            end: rangeEnd,
            total: totalItems,
          })}
        </AppText>
      ) : null}

      <View style={styles.row}>
        <Pressable
          onPress={onPrevious}
          disabled={!canGoPrevious}
          style={[styles.navButton, !canGoPrevious && styles.navButtonDisabled]}
          accessibilityRole="button"
          accessibilityLabel={t("pagination-previous", "Previous")}
        >
          <Ionicons
            name={previousIcon}
            size={chevronSize}
            color={colors.text}
          />
        </Pressable>

        {pageNumbers.map((pageNumber) => {
          const isActive = pageNumber === page;
          return (
            <Pressable
              key={pageNumber}
              onPress={() => onPageChange(pageNumber)}
              style={[styles.pageButton, isActive && styles.pageButtonActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`Page ${pageNumber}`}
            >
              <AppText
                style={[
                  styles.pageButtonText,
                  isActive && styles.pageButtonTextActive,
                ]}
              >
                {String(pageNumber)}
              </AppText>
            </Pressable>
          );
        })}

        <Pressable
          onPress={onNext}
          disabled={!canGoNext}
          style={[styles.navButton, !canGoNext && styles.navButtonDisabled]}
          accessibilityRole="button"
          accessibilityLabel={t("pagination-next", "Next")}
        >
          <Ionicons
            name={nextIcon}
            size={chevronSize}
            color={colors.text}
          />
        </Pressable>
      </View>
    </View>
  );
};

export default NumberedPagination;
