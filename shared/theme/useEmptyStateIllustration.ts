import type { ImageSourcePropType } from "react-native";
import { useTheme } from "./ThemeContext";

const emptyStateLight = require("@/assets/images/no-order.png");
const emptyStateDark = require("@/assets/images/no-order-black.png");

/** Empty / no-data illustrations: light theme vs dark (black-background art). */
export function useEmptyStateIllustration(): ImageSourcePropType {
  const { isDark } = useTheme();
  return isDark ? emptyStateDark : emptyStateLight;
}
