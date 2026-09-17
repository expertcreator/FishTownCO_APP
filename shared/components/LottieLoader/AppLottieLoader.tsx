import LottieView from "lottie-react-native";
import React from "react";
import { View } from "react-native";
import { styles } from "./AppLottieLoader.style";
import type { LottieLoaderProps } from "./AppLottieLoader.type";

const LottieLoader: React.FC<LottieLoaderProps> = ({
  source,
  style,
  loop = true,
  autoPlay = true,
  size = 100,
}) => (
  <View style={[styles.container, style]}>
    <LottieView
      source={source}
      autoPlay={autoPlay}
      loop={loop}
      style={{ width: size, height: size }}
    />
  </View>
);

export default LottieLoader;
