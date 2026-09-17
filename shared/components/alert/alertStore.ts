import { create } from "zustand";
import type { ReactNode } from "react";

export type AlertType = "success" | "error" | "warning" | "info";
export type AlertButtonStyle = "default" | "cancel" | "destructive";

export type AlertButton = {
  text: string;
  onPress?: () => void | Promise<void>;
  style?: AlertButtonStyle;
};

export type AlertOptions = {
  title: string;
  message?: string;
  type?: AlertType;
  /** Overrides the default type accent (e.g. primary for image picker). */
  accentColor?: string;
  buttons?: AlertButton[];
  icon?: ReactNode;
  /** When true, hides the default type icon (e.g. action-sheet style alerts). */
  hideIcon?: boolean;
  autoCloseMs?: number;
  vibrate?: boolean;
  onDismiss?: () => void;
};

type AlertStore = {
  isVisible: boolean;
  options: AlertOptions | null;
  timeoutId: ReturnType<typeof setTimeout> | null;
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
  clearAlert: () => void;
  resetAlert: () => void;
};

const DEFAULT_AUTO_CLOSE_BY_TYPE: Partial<Record<AlertType, number>> = {
  success: 2200,
  info: 2600,
};

export const useAlertStore = create<AlertStore>((set, get) => ({
  isVisible: false,
  options: null,
  timeoutId: null,
  showAlert: (options) => {
    const currentTimeout = get().timeoutId;
    if (currentTimeout) {
      clearTimeout(currentTimeout);
    }

    const nextType = options.type ?? "info";
    const hasActionButtons = (options.buttons?.length ?? 0) > 0;
    const autoCloseMs =
      options.autoCloseMs ??
      (hasActionButtons
        ? null
        : (DEFAULT_AUTO_CLOSE_BY_TYPE[nextType] ?? null));

    set({
      isVisible: true,
      options: {
        ...options,
        type: nextType,
      },
      timeoutId: null,
    });

    if (autoCloseMs && autoCloseMs > 0) {
      const timeoutId = setTimeout(() => {
        get().hideAlert();
      }, autoCloseMs);
      set({ timeoutId });
    }
  },
  hideAlert: () => {
    const currentTimeout = get().timeoutId;
    if (currentTimeout) {
      clearTimeout(currentTimeout);
    }
    set({
      isVisible: false,
      timeoutId: null,
    });
  },
  clearAlert: () => {
    const currentTimeout = get().timeoutId;
    if (currentTimeout) {
      clearTimeout(currentTimeout);
    }
    set({
      isVisible: false,
      options: null,
      timeoutId: null,
    });
  },
  resetAlert: () => {
    const onDismiss = get().options?.onDismiss;
    get().clearAlert();
    onDismiss?.();
  },
}));
