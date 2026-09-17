import { Ionicons } from "@expo/vector-icons";
import {
  StyleSheet,
  TouchableOpacity,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { moderateScale } from "react-native-size-matters";
import { useIsTablet } from "@/shared/hooks";
import { useColors } from "@/shared/theme";
import { useTranslation } from "@/shared/translations";

type SheetCloseButtonProps = {
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Pin to top-end corner of a relative parent (e.g. sheet header). */
  absolute?: boolean;
};

/** Fixed tablet hit target — avoids moderateScale inflation on large screens. */
const TABLET_CLOSE_SIZE = 28;
const TABLET_ICON_SIZE = 16;

const SheetCloseButton = ({
  onPress,
  disabled = false,
  style,
  absolute = false,
}: SheetCloseButtonProps) => {
  const colors = useColors();
  const { t } = useTranslation();
  const isTablet = useIsTablet();
  const hit = isTablet ? TABLET_CLOSE_SIZE : moderateScale(28);
  const iconSize = isTablet ? TABLET_ICON_SIZE : moderateScale(16);
  const hitSlop = isTablet ? 6 : moderateScale(8);

  return (
    <TouchableOpacity
      style={[
        styles.closeButton,
        {
          width: hit,
          height: hit,
          borderRadius: hit / 2,
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        absolute
          ? isTablet
            ? styles.closeButtonAbsoluteTablet
            : styles.closeButtonAbsolute
          : null,
        disabled ? styles.closeButtonDisabled : null,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={t("close")}
      hitSlop={{
        top: hitSlop,
        bottom: hitSlop,
        left: hitSlop,
        right: hitSlop,
      }}
    >
      <Ionicons name="close" size={iconSize} color={colors.textSecondary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  closeButton: {
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonAbsolute: {
    position: "absolute",
    top: moderateScale(2),
    end: moderateScale(12),
    zIndex: 2,
  },
  closeButtonAbsoluteTablet: {
    position: "absolute",
    top: 2,
    end: 12,
    zIndex: 2,
  },
  closeButtonDisabled: {
    opacity: 0.5,
  },
});

export default SheetCloseButton;
