import type React from "react";
import { StyleSheet, Text, type TextStyle } from "react-native";
import { textAndroidSafe } from "@/shared/constants";
import { useColors } from "@/shared/theme";
import { useI18nStore } from "@/shared/translations/store";
import {
  getTextFromChildren,
  resolveFontFamilyForText,
} from "@/shared/utils/resolveTextFont";
import { styles } from "./AppText.styles";
import type { AppTextProps } from "./AppText.types";

const AppText: React.FC<AppTextProps> = ({
  children,
  style,
  color,
  fontSize,
  fontWeight,
  textAlign,
  numberOfLines,
  adjustsFontSizeToFit,
  ellipsizeMode,
  minimumFontScale,
  onTextLayout,
}) => {
  const themeColors = useColors();
  const uiLanguage = useI18nStore((state) => state.language);

  const flattenedStyle = StyleSheet.flatten([
    styles.text,
    { color: color ?? themeColors.text },
    style,
    {
      ...(fontSize !== undefined && { fontSize }),
      ...(fontWeight !== undefined && { fontWeight }),
      ...(textAlign !== undefined && { textAlign }),
    },
  ]) as TextStyle;

  const textContent = getTextFromChildren(children);
  const resolvedFontFamily = resolveFontFamilyForText(
    flattenedStyle.fontFamily,
    textContent,
    uiLanguage
  );

  return (
    <Text
      allowFontScaling={false}
      style={[
        styles.text,
        { color: color ?? themeColors.text },
        style,
        textAndroidSafe,
        {
          ...(fontSize !== undefined && { fontSize }),
          ...(fontWeight !== undefined && { fontWeight }),
          ...(textAlign !== undefined && { textAlign }),
          ...(resolvedFontFamily && { fontFamily: resolvedFontFamily }),
        },
      ]}
      numberOfLines={numberOfLines}
      adjustsFontSizeToFit={adjustsFontSizeToFit}
      ellipsizeMode={ellipsizeMode}
      minimumFontScale={minimumFontScale}
      onTextLayout={onTextLayout}
    >
      {children}
    </Text>
  );
};

export default AppText;
