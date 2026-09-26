import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  Pressable,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast, { type ToastConfigParams } from "react-native-toast-message";
import { toastStyles, TOAST_TONE_COLORS } from "./AppToast.styles";
import type {
  ShowToastOptions,
  ToastifyConfig,
  ToastThemeOverride,
  ToastTone,
} from "./AppToast.types";

type Props = {
  config?: ToastifyConfig;
};

const DEFAULT_TOAST_DURATION = 5000;

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
};

/**
 * Renders one Foori-style toast card for a given tone.
 * @param props - Toast render params plus tone/theme
 * @returns Toast card element
 */
function ModernToast({
  text1,
  text2,
  text1Style,
  text2Style,
  onPress,
  props,
  tone,
  theme,
  containerStyle,
}: ModernToastProps) {
  const toneColors = TOAST_TONE_COLORS[tone];
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
          },
          containerStyle,
          callStyle,
        ]}
      >
        <View
          style={[toastStyles.accentBar, { backgroundColor: toneColors.accent }]}
        />
        <View
          style={[
            toastStyles.iconWrap,
            { backgroundColor: toneColors.iconBackground },
          ]}
        >
          <Ionicons name={TOAST_ICONS[tone]} size={20} color={toneColors.icon} />
        </View>
        <View style={toastStyles.content}>
          {text1 ? (
            <Text
              style={[
                toastStyles.title,
                { color: theme?.textColor ?? "#0F172A" },
                text1Style,
              ]}
              numberOfLines={3}
            >
              {text1}
            </Text>
          ) : null}
          {text2 ? (
            <Text
              style={[
                toastStyles.subtitle,
                { color: theme?.textSecondaryColor ?? "#64748B" },
                text2Style,
              ]}
              numberOfLines={2}
            >
              {text2}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}

/**
 * Builds toast render config for react-native-toast-message.
 * @param options - Optional theme and container style
 * @returns Toast type → renderer map
 */
export function createToastConfig(options?: {
  theme?: ToastThemeOverride;
  style?: StyleProp<ViewStyle>;
}) {
  return {
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
  };
}

export const toastConfig = createToastConfig();

/**
 * Global toast host mounted in the root layout (same role as Foori `ToastifyProvider`).
 * @param props - Provider props
 * @param props.config - Optional toast defaults
 * @returns Toast host element
 */
export function ToastifyProvider({ config }: Props) {
  const insets = useSafeAreaInsets();
  const topOffset = config?.topOffset ?? insets.top + 12;
  const bottomOffset = config?.bottomOffset ?? insets.bottom + 32;

  const resolvedConfig = useMemo(
    () => createToastConfig({ theme: config?.theme }),
    [config?.theme]
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
}

/**
 * Shows a toast of the given tone.
 * @param type - Toast tone
 * @param message - Primary message
 * @param options - Optional presentation options
 * @returns void
 */
function showToast(
  type: ToastTone,
  message: string,
  options?: ShowToastOptions
) {
  Toast.show({
    type,
    text1: message,
    position: options?.position || "top",
    visibilityTime: options?.visibilityTime ?? DEFAULT_TOAST_DURATION,
    autoHide: options?.autoHide !== false,
    text1Style: options?.textStyle,
    props: options?.style ? { style: options.style } : undefined,
    ...TOAST_TEXT_LINE_PROPS,
  });
}

/** Typed toast helpers — same call sites as Foori customer app. */
export const Toastify = {
  /**
   * Shows a success toast.
   * @param message - Message text
   * @param options - Optional presentation options
   * @returns void
   */
  success: (message: string, options?: ShowToastOptions) => {
    showToast("success", message, options);
  },
  /**
   * Shows an error toast.
   * @param message - Message text
   * @param options - Optional presentation options
   * @returns void
   */
  error: (message: string, options?: ShowToastOptions) => {
    showToast("error", message, options);
  },
  /**
   * Shows an info toast.
   * @param message - Message text
   * @param options - Optional presentation options
   * @returns void
   */
  info: (message: string, options?: ShowToastOptions) => {
    showToast("info", message, options);
  },
  /**
   * Shows a warning toast.
   * @param message - Message text
   * @param options - Optional presentation options
   * @returns void
   */
  warn: (message: string, options?: ShowToastOptions) => {
    showToast("warn", message, options);
  },
  /**
   * Shows a generic (info) toast.
   * @param message - Message text
   * @param options - Optional presentation options
   * @returns void
   */
  show: (message: string, options?: ShowToastOptions) => {
    showToast("info", message, options);
  },
};
