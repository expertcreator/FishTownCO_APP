import { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/shared/components";
import {
  fonts,
  fontSizes,
  getSheetModalTitleTypography,
} from "@/shared/constants";
import { useIsTablet } from "@/shared/hooks";
import { useColors } from "@/shared/theme";
import { moderateScale } from "@/shared/imports/utils";
import {
  useAlertStore,
  type AlertButtonStyle,
  type AlertType,
} from "./alertStore";

const ICON_BY_TYPE: Record<AlertType, keyof typeof Ionicons.glyphMap> = {
  success: "checkmark-circle",
  error: "close-circle",
  warning: "warning",
  info: "information-circle",
};

/**
 * Landscape-tablet alert density. Kept local so this shared module does not
 * depend on any app `features/` tree.
 */
const TABLET_ALERT = {
  maxWidth: 380,
  iconSize: 24,
  iconBox: 44,
  titleSize: 20,
  bodySize: 18,
  buttonHeight: 44,
  radius: 16,
  buttonRadius: 12,
  spaceSm: 8,
  spaceMd: 12,
  spaceXl: 18,
  spaceXxl: 24,
} as const;

const PHONE_ICON_SIZE = moderateScale(24);

const DEFAULT_BUTTON_TEXT = "OK";
const FADE_DURATION = 170;
const SCALE_DURATION = 220;

type TypeTheme = {
  accent: string;
  iconBackground: string;
  iconText: string;
};

const getTypeTheme = (
  type: AlertType,
  typeColors: Record<AlertType, string>
): TypeTheme => {
  const accent = typeColors[type];
  return {
    accent,
    iconBackground: `${accent}1F`,
    iconText: accent,
  };
};

const getButtonBackgroundColor = ({
  style,
  alertType,
  accentColor,
  cardColor,
  destructiveColor,
}: {
  style: AlertButtonStyle | undefined;
  alertType: AlertType;
  accentColor: string;
  cardColor: string;
  destructiveColor: string;
}) => {
  if (style === "destructive") {
    const base = alertType === "warning" ? accentColor : destructiveColor;
    return `${base}1A`;
  }
  if (style === "cancel") {
    return cardColor;
  }
  return `${accentColor}1A`;
};

const getButtonTextColor = ({
  style,
  alertType,
  accentColor,
  textColor,
  destructiveColor,
}: {
  style: AlertButtonStyle | undefined;
  alertType: AlertType;
  accentColor: string;
  textColor: string;
  destructiveColor: string;
}) => {
  if (style === "destructive") {
    return alertType === "warning" ? accentColor : destructiveColor;
  }
  if (style === "cancel") {
    return textColor;
  }
  return accentColor;
};

const AlertModal = () => {
  const colors = useColors();
  const isTablet = useIsTablet();
  const styles = useMemo(() => createAlertModalStyles(isTablet), [isTablet]);
  const iconSize = isTablet ? TABLET_ALERT.iconSize : PHONE_ICON_SIZE;
  const isVisible = useAlertStore((state) => state.isVisible);
  const options = useAlertStore((state) => state.options);
  const resetAlert = useAlertStore((state) => state.resetAlert);
  const clearAlert = useAlertStore((state) => state.clearAlert);
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  const alertType = options?.type ?? "info";
  const typeColors = useMemo(
    () => ({
      success: colors.green,
      error: colors.primary,
      warning: colors.primary,
      info: colors.secondary,
    }),
    [colors.green, colors.primary, colors.secondary]
  );
  const typeTheme = useMemo(() => {
    const theme = getTypeTheme(alertType, typeColors);
    if (options?.accentColor) {
      return {
        accent: options.accentColor,
        iconBackground: `${options.accentColor}1F`,
        iconText: options.accentColor,
      };
    }
    return theme;
  }, [alertType, options?.accentColor, typeColors]);
  const buttons =
    options?.buttons && options.buttons.length > 0
      ? options.buttons
      : [{ text: DEFAULT_BUTTON_TEXT }];
  const shouldStackButtons = buttons.length > 2;

  useEffect(() => {
    if (isVisible) {
      const shouldVibrate = options?.vibrate ?? alertType !== "info";
      if (shouldVibrate) {
        Vibration.vibrate(12);
      }

      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: FADE_DURATION,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 70,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    opacityAnim.setValue(0);
    scaleAnim.setValue(0.92);
  }, [alertType, isVisible, opacityAnim, options?.vibrate, scaleAnim]);

  const handleHide = (invokeDismiss = true) => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: FADE_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: SCALE_DURATION,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (!finished) {
        return;
      }
      if (invokeDismiss) {
        resetAlert();
        return;
      }
      clearAlert();
    });
  };

  const handleButtonPress = async (
    onPress?: () => void | Promise<void>
  ): Promise<void> => {
    handleHide(false);
    try {
      await onPress?.();
    } catch {
      // Consumer callbacks should handle their own errors.
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Pressable style={styles.overlayPressable} onPress={() => handleHide()}>
        <Animated.View
          style={[
            styles.overlay,
            { opacity: opacityAnim, backgroundColor: colors.overlay },
          ]}
        />
      </Pressable>

      <View style={styles.centeredContainer} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.card,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
              backgroundColor: colors.card,
              borderColor: colors.border,
              shadowColor: colors.shadow,
            },
          ]}
        >
          {options?.hideIcon ? null : (
            <View style={styles.iconSection}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: typeTheme.iconBackground },
                ]}
              >
                {options?.icon ? (
                  <View style={styles.iconGlyphWrapper}>{options.icon}</View>
                ) : (
                  <Ionicons
                    name={ICON_BY_TYPE[alertType]}
                    size={iconSize}
                    color={typeTheme.iconText}
                    style={styles.iconGlyph}
                    {...(Platform.OS === "android" && {
                      includeFontPadding: false,
                    })}
                  />
                )}
              </View>
            </View>
          )}

          <AppText
            style={[
              styles.title,
              isTablet
                ? {
                  fontFamily: fonts.heading,
                  fontSize: TABLET_ALERT.titleSize,
                  lineHeight: Math.round(TABLET_ALERT.titleSize * 1.25),
                }
                : getSheetModalTitleTypography(),
              { color: colors.primary },
            ]}
          >
            {options?.title}
          </AppText>
          {!!options?.message && (
            <AppText style={[styles.message, { color: colors.textSecondary }]}>
              {options.message}
            </AppText>
          )}

          <View
            style={[
              styles.actionsRow,
              shouldStackButtons && styles.actionsColumn,
            ]}
          >
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={`${button.text}-${index}`}
                onPress={() => {
                  handleButtonPress(button.onPress).catch(() => {
                    // noop
                  });
                }}
                style={[
                  styles.button,
                  shouldStackButtons && styles.buttonFullWidth,
                  {
                    backgroundColor: getButtonBackgroundColor({
                      style: button.style,
                      alertType,
                      accentColor: typeTheme.accent,
                      cardColor: colors.card,
                      destructiveColor: colors.red,
                    }),
                    borderColor:
                      button.style === "cancel" ? colors.border : "transparent",
                  },
                ]}
                activeOpacity={0.85}
              >
                <AppText
                  style={[
                    styles.buttonText,
                    {
                      color: getButtonTextColor({
                        style: button.style,
                        alertType,
                        accentColor: typeTheme.accent,
                        textColor: colors.text,
                        destructiveColor: colors.red,
                      }),
                    },
                  ]}
                >
                  {button.text}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const createAlertModalStyles = (isTablet: boolean) => {
  const iconSize = isTablet ? TABLET_ALERT.iconSize : PHONE_ICON_SIZE;
  const iconBox = isTablet ? TABLET_ALERT.iconBox : moderateScale(42);

  return StyleSheet.create({
    overlayPressable: {
      ...StyleSheet.absoluteFill,
    },
    overlay: {
      ...StyleSheet.absoluteFill,
    },
    centeredContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: isTablet ? TABLET_ALERT.spaceXxl : moderateScale(20),
    },
    card: {
      width: isTablet ? TABLET_ALERT.maxWidth : "100%",
      maxWidth: isTablet ? TABLET_ALERT.maxWidth : moderateScale(340),
      alignItems: "center",
      borderRadius: isTablet ? TABLET_ALERT.radius : moderateScale(22),
      borderWidth: 1,
      paddingHorizontal: isTablet ? TABLET_ALERT.spaceXl : moderateScale(18),
      paddingVertical: isTablet ? TABLET_ALERT.spaceXl : moderateScale(18),
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.24,
      shadowRadius: 14,
      elevation: 8,
    },
    iconSection: {
      width: "100%",
      alignItems: "center",
      marginBottom: isTablet ? TABLET_ALERT.spaceMd : moderateScale(12),
    },
    iconContainer: {
      width: iconBox,
      height: iconBox,
      borderRadius: iconBox / 2,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    iconGlyphWrapper: {
      width: iconSize,
      height: iconSize,
      alignItems: "center",
      justifyContent: "center",
    },
    iconGlyph: {
      width: iconSize,
      height: iconSize,
      lineHeight: iconSize,
      textAlign: "center",
    },
    title: {
      alignSelf: "stretch",
      textAlign: "center",
      marginBottom: isTablet ? TABLET_ALERT.spaceSm : moderateScale(8),
    },
    message: {
      alignSelf: "stretch",
      textAlign: "center",
      fontSize: isTablet ? TABLET_ALERT.bodySize : fontSizes.p,
      fontFamily: fonts.subTitle,
      lineHeight: isTablet
        ? Math.round(TABLET_ALERT.bodySize * 1.4)
        : fontSizes.p * 1.45,
    },
    actionsRow: {
      alignSelf: "stretch",
      flexDirection: "row",
      columnGap: isTablet ? TABLET_ALERT.spaceMd : moderateScale(10),
      marginTop: isTablet ? TABLET_ALERT.spaceXl : moderateScale(18),
    },
    actionsColumn: {
      flexDirection: "column",
      rowGap: isTablet ? TABLET_ALERT.spaceMd : moderateScale(10),
    },
    button: {
      flex: 1,
      minHeight: isTablet ? TABLET_ALERT.buttonHeight : moderateScale(40),
      borderRadius: isTablet ? TABLET_ALERT.buttonRadius : moderateScale(12),
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: isTablet ? TABLET_ALERT.spaceMd : moderateScale(10),
      paddingVertical: isTablet ? TABLET_ALERT.spaceSm : moderateScale(8),
    },
    buttonFullWidth: {
      flex: undefined,
      width: "100%",
    },
    buttonText: {
      fontSize: isTablet ? TABLET_ALERT.bodySize : fontSizes.p,
      fontFamily: fonts.button,
      textAlign: "center",
    },
  });
};

export default AlertModal;
