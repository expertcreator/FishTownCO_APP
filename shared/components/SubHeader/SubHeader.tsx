import { AppText } from "@/shared/components";
import { colors } from "@/shared/constants";
import { useTranslation } from "@/shared/translations";
import type { ReactNode } from "react";
import {
  type TextStyle,
  TouchableOpacity,
  type ViewStyle,
  View,
} from "react-native";
import { styles } from "./SubHeader.style";

export type SubHeaderProps = {
  title: string | ReactNode;
  viewAll?: string | ReactNode;
  onPressViewAll?: () => void;
  containerStyle?: ViewStyle;
  titleStyle?: TextStyle;
  viewAllStyle?: TextStyle;
  showViewAll?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  alignment?: "left" | "center" | "right";
  titleColor?: string;
  viewAllColor?: string;
};

export default function SubHeader(props: SubHeaderProps) {
  const {
    title,
    viewAll,
    onPressViewAll,
    containerStyle,
    titleStyle,
    viewAllStyle,
    showViewAll = true,
    iconLeft,
    iconRight,
    alignment = "left",
    titleColor,
    viewAllColor,
  } = props;
  const { isRTL } = useTranslation();

  const renderTitle = () => {
    if (typeof title === "string") {
      return (
        <AppText
          style={[
            styles.title,
            { color: titleColor || colors.primary },
            isRTL && { textAlign: "right" as const },
            titleStyle,
          ]}
        >
          {title}
        </AppText>
      );
    }
    return title;
  };

  const renderViewAll = () => {
    if (!(viewAll && showViewAll)) {
      return null;
    }

    const content =
      typeof viewAll === "string" ? (
        <AppText
          style={[
            styles.viewAll,
            { color: viewAllColor || colors.primary },
            viewAllStyle,
          ]}
        >
          {viewAll}
        </AppText>
      ) : (
        viewAll
      );

    if (onPressViewAll) {
      return (
        <TouchableOpacity activeOpacity={0.7} onPress={onPressViewAll}>
          {content}
        </TouchableOpacity>
      );
    }

    return content;
  };

  return (
    <View
      style={[
        styles.container,
        {
          justifyContent: alignment === "center" ? "center" : "space-between",
          flexDirection: isRTL ? "row-reverse" : "row",
        },
        containerStyle,
      ]}
    >
      <View style={styles.leftSection}>
        {iconLeft && <View style={styles.iconLeftContainer}>{iconLeft}</View>}
        {renderTitle()}
      </View>

      <View style={styles.rightSection}>
        {renderViewAll()}
        {iconRight && <View>{iconRight}</View>}
      </View>
    </View>
  );
}
