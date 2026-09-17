import { Image, type ImageContentFit } from "expo-image";
import React, { useMemo } from "react";
import type { ImageStyle } from "react-native";
import { styles } from "./AppImage.style";
import type { AppImageProps } from "./AppImage.type";

function resolveRecyclingKey(
  source: AppImageProps["source"],
  recyclingKey?: string | null
): string | null | undefined {
  if (recyclingKey != null) {
    return recyclingKey;
  }
  if (typeof source === "object" && source != null && "uri" in source) {
    const uri = (source as { uri?: string }).uri;
    return uri?.trim() ? uri : undefined;
  }
  return;
}

const AppImage: React.FC<AppImageProps> = ({
  source,
  width,
  height,
  borderRadius = 0,
  style,
  resizeMode = "cover",
  borderWidth = 0,
  borderColor = "transparent",
  placeholder,
  priority,
  cachePolicy = "memory-disk",
  transition = 0,
  recyclingKey,
  placeholderContentFit,
  ...props
}) => {
  const imageStyle: ImageStyle = {
    width,
    height,
    borderRadius,
    borderWidth,
    borderColor,
  };
  const contentFit: ImageContentFit = resizeMode as ImageContentFit;
  const resolvedPlaceholderContentFit = placeholderContentFit ?? contentFit;
  const resolvedRecyclingKey = useMemo(
    () => resolveRecyclingKey(source, recyclingKey),
    [source, recyclingKey]
  );

  return (
    <Image
      source={source}
      style={[styles.image, imageStyle, style]}
      contentFit={contentFit}
      placeholder={placeholder}
      placeholderContentFit={resolvedPlaceholderContentFit}
      cachePolicy={cachePolicy}
      transition={transition}
      priority={priority}
      recyclingKey={resolvedRecyclingKey}
      {...props}
    />
  );
};

export default AppImage;
