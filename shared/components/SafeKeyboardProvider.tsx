import type { ComponentType, ReactNode } from "react";
import { TurboModuleRegistry } from "react-native";

type Props = { children: ReactNode };

const Passthrough: ComponentType<{ children: ReactNode }> = ({ children }) => (
  <>{children}</>
);

function isKeyboardControllerNativeLinked(): boolean {
  try {
    const mod = TurboModuleRegistry.get("KeyboardController") as
      | { getConstants?: () => unknown }
      | null
      | undefined;
    return mod != null && typeof mod.getConstants === "function";
  } catch {
    return false;
  }
}

function getKeyboardProviderOrPassthrough(): ComponentType<{
  children: ReactNode;
}> {
  if (!isKeyboardControllerNativeLinked()) {
    return Passthrough;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("react-native-keyboard-controller") as {
      KeyboardProvider?: ComponentType<{ children: ReactNode }>;
    };
    return mod.KeyboardProvider ?? Passthrough;
  } catch {
    return Passthrough;
  }
}

const KeyboardProviderRoot = getKeyboardProviderOrPassthrough();

export function SafeKeyboardProvider({ children }: Props) {
  return <KeyboardProviderRoot>{children}</KeyboardProviderRoot>;
}
