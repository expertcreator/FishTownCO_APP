import { useTranslation } from "@/shared/translations";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  type TextStyle,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { moderateScale } from "react-native-size-matters";
import { colors, fontSizes } from "../../constants";
import { useFloatingLabelInputStyles, TABLET_INPUT } from "./AppFloatingLabelInput.style";
import { FloatingInputProps } from "./AppFloatingLabelInput.type";

import { fonts } from "@/shared/constants";
import { useIsTablet } from "@/shared/hooks";
import { useColors } from "@/shared/theme/ThemeContext";
import type { Locale } from "@/shared/translations/resources";
import { getDirection } from "@/shared/translations/resources";
import Tooltip from "react-native-walkthrough-tooltip";

const AppFloatingLabelInput = ({
  label,
  isPassword,
  onTogglePassword,
  mask,
  maxLength,
  showCountdown,
  countdownLabel,
  containerStyle,
  inputStyle,
  customLabelStyles = {},
  leftComponent,
  rightComponent,
  hintTextColor,
  darkTheme,
  hasError = false,
  errorMessage,
  value = "",
  onChangeText,
  errorMarginTop,
  placeholderHint,
  labelBackgroundColor,
  ...rest
}: FloatingInputProps) => {
  const {
    textAlign: textAlignProp,
    selectionColor: selectionColorProp,
    multiline: isMultiline,
    onContentSizeChange: onContentSizeChangeProp,
    ...textInputRest
  } = rest;
  const { i18n } = useTranslation();
  const isTablet = useIsTablet();
  const multilineMinHeight = isTablet
    ? TABLET_INPUT.multilineMin
    : moderateScale(72);
  const [multilineHeight, setMultilineHeight] = useState(multilineMinHeight);
  // Safely map i18n.language to supported locale, defaulting to 'en'
  const locale: Locale =
    i18n.language === "ar" ||
      i18n.language === "en" ||
      i18n.language === "ur" ||
      i18n.language === "rmu"
      ? i18n.language
      : "en";
  const direction = getDirection(locale);
  const isRTL = direction === "rtl";
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [secureText, setSecureText] = useState(true);
  const previousValueRef = useRef<string>(value);
  const color = useColors();

  // Label animation config
  const topBlurred =
    customLabelStyles.topBlurred ??
    (isRTL
      ? isTablet
        ? Platform.OS === "ios"
          ? -10
          : 0
        : moderateScale(Platform.OS === "ios" ? -10 : 0)
      : isTablet
        ? 0
        : moderateScale(0));
  const topFocused =
    customLabelStyles.topFocused ??
    (isTablet ? (isRTL ? -22 : -16) : moderateScale(isRTL ? -24 : -17));
  const fontSizeBlurred =
    customLabelStyles.fontSizeBlurred ??
    (isTablet ? TABLET_INPUT.fontSize : moderateScale(14));
  const fontSizeFocused =
    customLabelStyles.fontSizeFocused ??
    (isTablet ? TABLET_INPUT.smallSize : moderateScale(10));
  const leftBlurred = customLabelStyles.leftBlurred ?? 0;
  const colorBlurred = customLabelStyles.colorBlurred ?? color.gray;
  const colorFocused = customLabelStyles.colorFocused ?? color.text;

  // Shared values
  const top = useSharedValue(value ? topFocused : topBlurred);
  const fontSize = useSharedValue(value ? fontSizeFocused : fontSizeBlurred);
  const colorProgress = useSharedValue(value ? 1 : 0);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  // Animate label
  const animateLabel = useCallback(
    (focus: boolean) => {
      const shouldFloat = focus || (value && value.length > 0);
      top.value = withTiming(shouldFloat ? topFocused : topBlurred);
      fontSize.value = withTiming(
        shouldFloat ? fontSizeFocused : fontSizeBlurred
      );
      colorProgress.value = withTiming(shouldFloat ? 1 : 0);
    },
    [
      value,
      topFocused,
      topBlurred,
      fontSizeFocused,
      fontSizeBlurred,
      top,
      fontSize,
      colorProgress,
    ]
  );

  useEffect(() => {
    animateLabel(isFocused);
  }, [isFocused, animateLabel]);

  useEffect(() => {
    if (!isMultiline) {
      return;
    }
    if (!value) {
      setMultilineHeight(multilineMinHeight);
    }
  }, [isMultiline, multilineMinHeight, value]);

  // Animated styles
  const animatedLabelStyle = useAnimatedStyle(() => ({
    fontSize: fontSize.value,
    color: interpolateColor(
      colorProgress.value,
      [0, 1],
      [colorBlurred, colorFocused]
    ),
    fontWeight: colorProgress.value > 0.5 ? "600" : "400",
  }));

  const animatedWrapperStyle = useAnimatedStyle(() => ({
    position: "absolute",
    top: top.value,
    zIndex: 10,
    paddingHorizontal: 4,
    backgroundColor: labelBackgroundColor ?? color.background, // cut-out background
  }));

  const handleTextChange = (text: string) => {
    previousValueRef.current = value;
    onChangeText?.(mask ? mask(text) : text);
  };

  const toggleSecureText = () => {
    setSecureText(!secureText);
    onTogglePassword?.(!secureText);
  };

  const styles = useFloatingLabelInputStyles();

  const flattenedInputStyle = useMemo(() => {
    const layers: TextStyle[] = [styles.input, inputStyle ?? {}];
    if (textAlignProp != null) {
      layers.push({ textAlign: textAlignProp });
    }
    return StyleSheet.flatten(layers) as TextStyle;
  }, [styles.input, inputStyle, textAlignProp]);
  const anchorLabelRight = useMemo(
    () =>
      flattenedInputStyle.textAlign === "right" ||
      flattenedInputStyle.writingDirection === "rtl",
    [flattenedInputStyle.textAlign, flattenedInputStyle.writingDirection]
  );

  const labelMaxWidth = isRTL || anchorLabelRight ? "95%" : "80%";

  return (
    <View>
      <TouchableWithoutFeedback onPress={() => inputRef.current?.focus()}>
        <View
          style={[
            styles.container,
            isMultiline && styles.multilineContainer,
            containerStyle,
            hasError && styles.errorContainer,
          ]}
        >
          {leftComponent && (
            <View style={styles.iconLeft}>{leftComponent}</View>
          )}

          <View
            style={[
              { flex: 1, flexDirection: "row" },
              isMultiline && styles.multilineInputRow,
            ]}
          >
            {label && (
              <Animated.View
                style={[
                  animatedWrapperStyle,
                  anchorLabelRight
                    ? {
                      right: 0,
                      alignItems: "flex-end",
                    }
                    : {
                      left: leftBlurred,
                      alignItems: "flex-start",
                    },
                  { maxWidth: labelMaxWidth, overflow: "visible" },
                ]}
              >
                <Animated.Text
                  allowFontScaling={false}
                  style={[
                    animatedLabelStyle,
                    {
                      flexShrink: 0,
                      textAlign: anchorLabelRight ? "right" : "left",
                      writingDirection: anchorLabelRight ? "rtl" : "ltr",
                    },
                  ]}
                >
                  {label}
                  {placeholderHint && !isFocused && !value && (
                    <Text
                      style={{
                        color: color.gray,
                        fontWeight: "400",
                        writingDirection: anchorLabelRight ? "rtl" : "ltr",
                      }}
                    >
                      {" "}
                      {placeholderHint}
                    </Text>
                  )}
                </Animated.Text>
              </Animated.View>
            )}

            <TextInput
              ref={inputRef}
              value={value}
              {...textInputRest}
              multiline={isMultiline}
              {...(textAlignProp != null ? { textAlign: textAlignProp } : {})}
              onFocus={(e) => {
                setIsFocused(true);
                textInputRest.onFocus?.(e);
              }}
              onBlur={(e) => {
                setIsFocused(false);
                textInputRest.onBlur?.(e);
              }}
              onContentSizeChange={(e) => {
                if (isMultiline) {
                  setMultilineHeight(
                    Math.max(
                      multilineMinHeight,
                      e.nativeEvent.contentSize.height
                    )
                  );
                }
                onContentSizeChangeProp?.(e);
              }}
              secureTextEntry={isPassword ? secureText : false}
              onChangeText={handleTextChange}
              maxLength={maxLength}
              placeholder=""
              placeholderTextColor={hintTextColor ?? colors.gray}
              underlineColorAndroid="transparent"
              style={[
                styles.input,
                isMultiline && styles.multilineInput,
                isMultiline && { height: multilineHeight },
                inputStyle,
              ]}
              selectionColor={selectionColorProp ?? color.primary}
              allowFontScaling={false}
            />
            {hasError && (
              <Tooltip
                isVisible={tooltipVisible}
                showChildInTooltip={false}
                content={
                  <View
                    style={{ flexDirection: isRTL ? "row-reverse" : "row" }}
                  >
                    <Text
                      style={{
                        color: colors.white,
                        fontSize: fontSizes.p,
                        fontFamily: fonts.subTitle,
                        textAlign: isRTL ? "right" : "left",
                      }}
                    >
                      {errorMessage}
                    </Text>
                  </View>
                }
                placement="top"
                onClose={() => setTooltipVisible(false)}
                backgroundColor="transparent"
                contentStyle={{
                  backgroundColor: colors.red,
                  padding: moderateScale(8),
                  borderRadius: moderateScale(6),
                  flexDirection: isRTL ? "row-reverse" : "row",
                }}
              >
                <TouchableOpacity onPress={() => setTooltipVisible(true)}>
                  <Ionicons
                    name="alert-circle"
                    size={isTablet ? TABLET_INPUT.icon : moderateScale(20)}
                    color={colors.red}
                  />
                </TouchableOpacity>
              </Tooltip>
            )}
          </View>

          {rightComponent && (
            <View style={styles.iconRight}>{rightComponent}</View>
          )}

          {isPassword && (
            <TouchableOpacity
              onPress={toggleSecureText}
              style={styles.passwordToggle}
            >
              <MaterialCommunityIcons
                name={secureText ? "eye" : "eye-off"}
                size={isTablet ? TABLET_INPUT.icon : moderateScale(20)}
                color="rgba(133, 133, 133, 1)"
              />
            </TouchableOpacity>
          )}

          {showCountdown && maxLength && (
            <Text allowFontScaling={false} style={styles.countdown}>
              {maxLength - (value ? value.length : 0)} {countdownLabel || ""}
            </Text>
          )}
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};

export default AppFloatingLabelInput;
