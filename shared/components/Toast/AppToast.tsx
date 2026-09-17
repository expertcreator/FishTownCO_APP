import type { Locale } from "@/shared/translations/resources";
import { getDirection } from "@/shared/translations/resources";
import i18n from "@/shared/utils/i18n";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  Pressable,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { moderateScale } from "react-native-size-matters";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast, { type ToastConfigParams } from "react-native-toast-message";
import { toastStyles, TOAST_TONE_COLORS } from "./AppToast.styles";
import type {
  ShowToastOptions,
  ToastifyConfig,
  ToastThemeOverride,
  ToastTone,
} from "./AppToast.types";
import { presentToastWithOptionalSellSheetLayer } from "./sellSheetToastBridge";

type Props = {
  config?: ToastifyConfig;
};

const DEFAULT_TOAST_DURATION = 5000; // ms

const TOAST_TEXT_LINE_PROPS = {
  text1NumberOfLines: 3,
  text2NumberOfLines: 2,
} as const;

const TOAST_ICONS: Record<ToastTone, keyof typeof Ionicons.glyphMap> = {
  success: "checkmark-circle",
  error: "close-circle",
  info: "information-circle",
  warn: "warning",
};

type ModernToastProps = ToastConfigParams<Record<string, unknown>> & {
  tone: ToastTone;
  theme?: ToastThemeOverride;
  containerStyle?: StyleProp<ViewStyle>;
  text1NumberOfLines?: number;
  text2NumberOfLines?: number;
};

const getRTLTextStyles = (): TextStyle => {
  const currentLanguage = i18n.language as Locale;
  const direction = getDirection(currentLanguage);
  const isRTL = direction === "rtl";

  return {
    textAlign: isRTL ? "right" : "left",
    writingDirection: isRTL ? "rtl" : "ltr",
  };
};

const isRTLLayout = (): boolean => {
  const currentLanguage = i18n.language as Locale;
  return getDirection(currentLanguage) === "rtl";
};

const resolveToneColors = (tone: ToastTone, theme?: ToastThemeOverride) => {
  const base = TOAST_TONE_COLORS[tone];
  const override = theme?.tones?.[tone];
  return {
    accent: override?.accent ?? base.accent,
    icon: override?.icon ?? base.icon,
    iconBackground: override?.iconBackground ?? base.iconBackground,
  };
};

const ModernToast: React.FC<ModernToastProps> = ({
  text1,
  text2,
  text1Style,
  text2Style,
  text1NumberOfLines = 3,
  text2NumberOfLines = 2,
  onPress,
  props,
  tone,
  theme,
  containerStyle,
}) => {
  const rtl = isRTLLayout();
  const rtlText = getRTLTextStyles();
  const toneColors = resolveToneColors(tone, theme);
  const callStyle =
    props && typeof props === "object" && "style" in props
      ? (props.style as StyleProp<ViewStyle>)
      : undefined;

  return (
    <View style={toastStyles.wrapper} pointerEvents="box-none">
      <Pressable
        accessibilityRole="alert"
        onPress={onPress}
        style={[
          toastStyles.card,
          {
            backgroundColor: theme?.backgroundColor ?? "#FFFFFF",
            borderColor: theme?.borderColor ?? "rgba(15, 23, 42, 0.06)",
            shadowColor: theme?.shadowColor ?? "#0F172A",
            flexDirection: rtl ? "row-reverse" : "row",
          },
          containerStyle,
          callStyle,
        ]}
      >
        <View
          style={[
            toastStyles.accentBar,
            rtl ? toastStyles.accentBarEnd : toastStyles.accentBarStart,
            { backgroundColor: toneColors.accent },
          ]}
        />
        <View
          style={[
            toastStyles.iconWrap,
            { backgroundColor: toneColors.iconBackground },
          ]}
        >
          <Ionicons
            name={TOAST_ICONS[tone]}
            size={moderateScale(20)}
            color={toneColors.icon}
          />
        </View>
        <View style={[toastStyles.content, rtl && { alignItems: "flex-end" }]}>
          {text1 ? (
            <Text
              style={[
                toastStyles.title,
                { color: theme?.textColor ?? "#0F172A" },
                rtlText,
                text1Style,
              ]}
              numberOfLines={text1NumberOfLines}
            >
              {text1}
            </Text>
          ) : null}
          {text2 ? (
            <Text
              style={[
                toastStyles.subtitle,
                { color: theme?.textSecondaryColor ?? "#64748B" },
                rtlText,
                text2Style,
              ]}
              numberOfLines={text2NumberOfLines}
            >
              {text2}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </View>
  );
};

/** Build toast render config; brands can pass theme without replacing the layout. */
export const createToastConfig = (options?: {
  theme?: ToastThemeOverride;
  style?: StyleProp<ViewStyle>;
}) => ({
  success: (params: ToastConfigParams<Record<string, unknown>>) => (
    <ModernToast
      {...params}
      {...TOAST_TEXT_LINE_PROPS}
      tone="success"
      theme={options?.theme}
      containerStyle={options?.style}
    />
  ),
  error: (params: ToastConfigParams<Record<string, unknown>>) => (
    <ModernToast
      {...params}
      {...TOAST_TEXT_LINE_PROPS}
      tone="error"
      theme={options?.theme}
      containerStyle={options?.style}
    />
  ),
  info: (params: ToastConfigParams<Record<string, unknown>>) => (
    <ModernToast
      {...params}
      {...TOAST_TEXT_LINE_PROPS}
      tone="info"
      theme={options?.theme}
      containerStyle={options?.style}
    />
  ),
  warn: (params: ToastConfigParams<Record<string, unknown>>) => (
    <ModernToast
      {...params}
      {...TOAST_TEXT_LINE_PROPS}
      tone="warn"
      theme={options?.theme}
      containerStyle={options?.style}
    />
  ),
});

export const toastConfig = createToastConfig();

/** Global provider mounted in app `_layout.tsx`. */
export const ToastifyProvider: React.FC<Props> = ({ config }) => {
  const insets = useSafeAreaInsets();

  const topOffset = config?.topOffset ?? insets.top + 12;
  const bottomOffset = config?.bottomOffset ?? insets.bottom + 32;

  const resolvedConfig = useMemo(
    () =>
      createToastConfig({
        theme: config?.theme,
        style: config?.style,
      }),
    [config?.theme, config?.style]
  );

  return (
    <Toast
      config={resolvedConfig}
      position={config?.position || "top"}
      visibilityTime={config?.visibilityTime ?? DEFAULT_TOAST_DURATION}
      autoHide={config?.autoHide !== false}
      topOffset={topOffset}
      bottomOffset={bottomOffset}
    />
  );
};

const showToast = (
  type: ToastTone | "info",
  message: string,
  options?: ShowToastOptions
) => {
  if (presentToastWithOptionalSellSheetLayer(type, message, options)) {
    return;
  }
  const rtlStyles = getRTLTextStyles();
  Toast.show({
    type,
    text1: message,
    position: options?.position || "top",
    visibilityTime: options?.visibilityTime ?? DEFAULT_TOAST_DURATION,
    autoHide: options?.autoHide !== false,
    text1Style: [rtlStyles, options?.textStyle],
    props: options?.style ? { style: options.style } : undefined,
    ...TOAST_TEXT_LINE_PROPS,
  });
};

/** Typed methods — same call sites as before; visuals come from `toastConfig`. */
export const Toastify = {
  success: (message: string, options?: ShowToastOptions) => {
    showToast("success", message, options);
  },

  error: (message: string, options?: ShowToastOptions) => {
    showToast("error", message, options);
  },

  info: (message: string, options?: ShowToastOptions) => {
    showToast("info", message, options);
  },

  warn: (message: string, options?: ShowToastOptions) => {
    showToast("warn", message, options);
  },

  show: (message: string, options?: ShowToastOptions) => {
    showToast("info", message, options);
  },
};
