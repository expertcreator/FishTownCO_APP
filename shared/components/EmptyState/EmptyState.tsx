import { moderateScale } from "@/shared/imports";
import { useColors } from "@/shared/theme/ThemeContext";
import { Feather, Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useMemo } from "react";
import { Image, View } from "react-native";
import AppText from "../Text";
import { styles } from "./EmptyState.style";
import type { EmptyStateProps } from "./EmptyState.type";

type FeatherIconName = ComponentProps<typeof Feather>["name"];
type IoniconsIconName = ComponentProps<typeof Ionicons>["name"];

const EmptyState = ({
  icon,
  image,
  imageStyle,
  iconName = "shopping-bag",
  iconLibrary = "feather",
  variant = "default",
  title,
  description,
  containerStyle,
  imageContainerStyle,
  titleStyle,
  descriptionStyle,
}: EmptyStateProps) => {
  const colors = useColors();
  const textStyles = useMemo(
    () => ({
      title: [styles.title, { color: colors.text }],
      description: [styles.description, { color: colors.textSecondary }],
    }),
    [colors.text, colors.textSecondary]
  );

  const renderContent = () => {
    if (icon) {
      return icon;
    }

    if (image) {
      return (
        <View style={[styles.imageContainer, imageContainerStyle]}>
          <Image
            source={image}
            style={imageStyle ?? styles.illustrationImage}
            resizeMode="contain"
          />
        </View>
      );
    }

    if (iconLibrary === "ionicons") {
      return (
        <Ionicons
          name={iconName as IoniconsIconName}
          size={moderateScale(40)}
          color={colors.primary}
        />
      );
    }

    return (
      <Feather
        name={iconName as FeatherIconName}
        size={moderateScale(40)}
        color={colors.primary}
      />
    );
  };

  const usesInlineLayout = variant === "inline";

  return (
    <View style={[!usesInlineLayout && styles.container, containerStyle]}>
      {image ? renderContent() : <View style={styles.iconContainer}>{renderContent()}</View>}
      <AppText
        style={[
          textStyles.title,
          image ? styles.imageTitle : undefined,
          titleStyle,
        ]}
      >
        {title}
      </AppText>
      {description ? (
        <AppText style={[textStyles.description, descriptionStyle]}>
          {description}
        </AppText>
      ) : null}
    </View>
  );
};

export default EmptyState;
