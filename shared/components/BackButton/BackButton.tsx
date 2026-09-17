import { useColors } from "@/shared/theme/ThemeContext";
import i18n, { getDirection, Language } from "@/shared/translations";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import { TouchableOpacity } from "react-native";
import { moderateScale } from "react-native-size-matters";
import { getStyles } from "./BackButton.style";
import type { BackButtonProps } from "./BackButton.type";

export const BackButton = ({
  onPress,
  style,
  iconColor,
  backgroundColor,
  size = 40,
  icon,
}: BackButtonProps) => {
  const direction = getDirection(i18n.language as Language);
  const isRTL = direction === "rtl";
  const colors = useColors();
  const navigation = useNavigation();
  const styles = getStyles(size, backgroundColor ?? colors.white);

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handlePress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      {icon ? (
        icon
      ) : (
        <Ionicons
          name={isRTL ? "arrow-forward" : "arrow-back"}
          size={moderateScale(size * 0.5)}
          color={iconColor ?? colors.black}
        />
      )}
    </TouchableOpacity>
  );
};
