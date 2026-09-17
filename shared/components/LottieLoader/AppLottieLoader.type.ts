import type LottieView from "lottie-react-native";
import type { ViewStyle } from "react-native";

export type LottieLoaderProps = {
  source: LottieView["props"]["source"]; // Type-safe Lottie source
  style?: ViewStyle; // Optional container style
  loop?: boolean; // Should animation loop
  autoPlay?: boolean; // Auto start animation
  size?: number; // Size of the animation
};
