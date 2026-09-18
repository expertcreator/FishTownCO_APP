import type { ReactNode } from "react";
import { KeyboardProvider } from "react-native-keyboard-controller";

type SafeKeyboardProviderProps = {
  children: ReactNode;
};

/**
 * Root keyboard provider, same role as Foori `SafeKeyboardProvider`.
 * @param props - Provider props
 * @param props.children - App tree that uses keyboard-aware screens
 * @returns Keyboard provider element
 */
export function SafeKeyboardProvider({ children }: SafeKeyboardProviderProps) {
  return (
    <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
      {children}
    </KeyboardProvider>
  );
}
