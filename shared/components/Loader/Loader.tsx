import { BlurView } from "expo-blur";
import { ActivityIndicator, View } from "react-native";
import { colors } from "../../constants";
import { styles } from "./Loader.style";
import type { LoaderProps } from "./Loader.type";

export default function Loader({
  visible,
  mode = "fullscreen",
  size = "large",
  color = colors.primary,
  backgroundColor = "rgba(0, 0, 0, 0.5)",
  blur = false,
  blurIntensity = 20,
}: LoaderProps) {
  if (!visible) {
    return null;
  }

  // Inline mode - just return the spinner without overlay
  if (mode === "inline") {
    return <ActivityIndicator size={size} color={color} />;
  }

  // Fullscreen mode with optional blur
  const overlayStyle = [styles.loadingOverlay, !blur && { backgroundColor }];

  const content = <ActivityIndicator size={size} color={color} />;

  if (blur) {
    return (
      <BlurView intensity={blurIntensity} style={overlayStyle}>
        {content}
      </BlurView>
    );
  }

  return <View style={overlayStyle}>{content}</View>;
}
