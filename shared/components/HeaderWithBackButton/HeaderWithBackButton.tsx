import { View, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/shared/theme";
import { useTranslation } from "@/shared/translations";
import { fonts, fontSizes } from "@/shared/constants";
import { useIsTablet } from "@/shared/hooks";
import AppText from "@/shared/components/Text";
import type { HeaderWithBackButtonProps } from "./HeaderWithBackButton.type";

/** Compact landscape-tablet header. Local — no app `features/` import. */
const TABLET_HEADER = {
  titleSize: 20,
  iconSize: 22,
  gap: 8,
} as const;

export const HeaderWithBackButton = ({
  titleKey,
  fallback,
  style,
}: HeaderWithBackButtonProps) => {
  const themeColors = useColors();
  const { t, isRTL } = useTranslation();
  const isTablet = useIsTablet();
  const styles = getStyles(themeColors, isRTL, isTablet);

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        onPress={handleBack}
        accessibilityRole="button"
        accessibilityLabel={t("common.go-back", "Go back")}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons
          name={isRTL ? "arrow-forward" : "arrow-back"}
          size={isTablet ? TABLET_HEADER.iconSize : 24}
          color={themeColors.text}
        />
      </TouchableOpacity>
      <AppText style={styles.title}>{t(titleKey, fallback)}</AppText>
    </View>
  );
};

const getStyles = (
  colors: ReturnType<typeof useColors>,
  isRTL: boolean,
  isTablet: boolean
) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      gap: isTablet ? TABLET_HEADER.gap : 8,
    },
    title: {
      fontFamily: fonts.heading,
      fontSize: isTablet
        ? TABLET_HEADER.titleSize
        : isRTL
          ? fontSizes.small
          : fontSizes.h3,
      fontWeight: "600",
      color: colors.text,
    },
  });
