import { ReactNode } from "react";
import type {
  ImageSourcePropType,
  ImageStyle,
  StyleProp,
  TextStyle,
  ViewStyle,
} from "react-native";

export type EmptyStateProps = {
  icon?: ReactNode;
  image?: ImageSourcePropType; // Image source (e.g., require('./image.png'))
  imageStyle?: StyleProp<ImageStyle>;
  iconName?: string; // Icon name for icons (used if no image provided)
  iconLibrary?: "feather" | "ionicons"; // Icon library to use
  /** Layout variant. `inline` skips default container/icon paddings. */
  variant?: "default" | "inline";
  title: string;
  description?: string;
  containerStyle?: StyleProp<ViewStyle>;
  imageContainerStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  descriptionStyle?: StyleProp<TextStyle>;
};
