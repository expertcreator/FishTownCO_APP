import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useColors, type ThemeColors } from "@/ui/theme";
import AppText from "./Text";

type PrimaryButtonProps = {
  label: string;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
};

/**
 * Orange primary CTA, same role as Foori `AppButton`.
 * @param props - Button props
 * @param props.label - Button label
 * @param props.onPress - Press handler
 * @param props.icon - Optional trailing icon
 * @param props.style - Optional style
 * @param props.disabled - Disabled state
 * @returns Button element
 */
export function PrimaryButton({
  label,
  onPress,
  icon = "arrow-forward",
  style,
  disabled,
}: PrimaryButtonProps) {
  const colors = useColors();
  const styles = getStyles(colors);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.primary, disabled && styles.disabled, style]}
    >
      <AppText style={styles.primaryText}>{label}</AppText>
      {icon ? <Ionicons name={icon} size={18} color={colors.white} /> : null}
    </Pressable>
  );
}

type OutlineButtonProps = {
  label: string;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
};

/**
 * White outline social/secondary button.
 * @param props - Button props
 * @param props.label - Button label
 * @param props.onPress - Press handler
 * @param props.icon - Optional leading icon
 * @param props.style - Optional style
 * @returns Button element
 */
export function OutlineButton({ label, onPress, icon, style }: OutlineButtonProps) {
  const colors = useColors();
  const styles = getStyles(colors);

  return (
    <Pressable onPress={onPress} style={[styles.outline, style]}>
      {icon ? <Ionicons name={icon} size={18} color={colors.navy} /> : null}
      <AppText style={styles.outlineText}>{label}</AppText>
    </Pressable>
  );
}

type TextLinkProps = {
  children: ReactNode;
  onPress?: () => void;
  align?: "left" | "center" | "right";
};

/**
 * Teal text link used for auth secondary actions.
 * @param props - Link props
 * @param props.children - Link content
 * @param props.onPress - Press handler
 * @param props.align - Text alignment
 * @returns Link element
 */
export function TextLink({ children, onPress, align = "left" }: TextLinkProps) {
  const colors = useColors();
  const styles = getStyles(colors);

  return (
    <Pressable onPress={onPress}>
      <AppText style={[styles.link, { textAlign: align }]}>{children}</AppText>
    </Pressable>
  );
}

type CardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * White rounded content card.
 * @param props - Card props
 * @param props.children - Card content
 * @param props.style - Optional style
 * @returns Card element
 */
export function Card({ children, style }: CardProps) {
  const colors = useColors();
  const styles = getStyles(colors);

  return <View style={[styles.card, style]}>{children}</View>;
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
  primary: {
    backgroundColor: colors.orange,
    borderRadius: 14,
    minHeight: 54,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  outline: {
    backgroundColor: colors.card,
    borderRadius: 14,
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  outlineText: {
    color: colors.navy,
    fontSize: 15,
    fontWeight: "600",
  },
  link: {
    color: colors.teal,
    fontSize: 14,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabled: { opacity: 0.5 },
});
}
