import type {
  ImageSource as ExpoImageSource,
  ImageContentFit,
  ImageProps as ExpoImageProps,
} from "expo-image";
import type {
  ImageSourcePropType,
  ImageStyle,
  StyleProp,
  DimensionValue,
} from "react-native";

export type AppImageProps = {
  // Accept both expo-image and react-native sources (number from require, { uri }, etc.)
  source: ExpoImageSource | ImageSourcePropType;
  placeholder?: ExpoImageSource | ImageSourcePropType;
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ImageStyle>;
  resizeMode?: ImageContentFit; // Expo Image contentFit values
  borderWidth?: number;
  borderColor?: string;
  priority?: ExpoImageProps["priority"];
  cachePolicy?: ExpoImageProps["cachePolicy"];
  transition?: ExpoImageProps["transition"];
  recyclingKey?: ExpoImageProps["recyclingKey"];
  placeholderContentFit?: ExpoImageProps["placeholderContentFit"];
  onError?: ExpoImageProps["onError"];
};
