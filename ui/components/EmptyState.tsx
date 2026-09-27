import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useColors, type ThemeColors } from "@/ui/theme";
import { Card, PrimaryButton } from "./Buttons";
import AppText from "./Text";

type EmptyStateProps = {
  /** Ionicons glyph shown in the icon tile. */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Primary empty-state title. */
  title: string;
  /** Supporting description under the title. */
  body: string;
  /** Optional CTA label; omit to hide the button. */
  actionLabel?: string;
  /** Optional CTA leading icon. */
  actionIcon?: keyof typeof Ionicons.glyphMap | null;
  /** CTA press handler (required when `actionLabel` is set). */
  onActionPress?: () => void;
  /** Optional style for the outer card. */
  style?: StyleProp<ViewStyle>;
  /** Optional custom content under the body (overrides the default CTA). */
  children?: ReactNode;
};

/**
 * Shared empty-state card used across list screens (Safety, Crew, Vessel, etc.).
 * Shows an icon tile, title, body, and an optional primary action.
 * @param props - Empty state props
 * @param props.icon - Leading Ionicons name
 * @param props.title - Empty title
 * @param props.body - Supporting message
 * @param props.actionLabel - Optional CTA label
 * @param props.actionIcon - Optional CTA icon (`null` hides it)
 * @param props.onActionPress - CTA press handler
 * @param props.style - Optional card style
 * @param props.children - Optional custom footer content
 * @returns Empty state card element
 */
export function EmptyState({
  icon = "file-tray-outline",
  title,
  body,
  actionLabel,
  actionIcon = "add",
  onActionPress,
  style,
  children,
}: EmptyStateProps) {
  const colors = useColors();
  const styles = getStyles(colors);
  const showAction = Boolean(actionLabel?.trim() && onActionPress);

  return (
    <Card style={[styles.card, style]}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={30} color={colors.teal} />
      </View>
      <AppText style={styles.title}>{title}</AppText>
      <AppText style={styles.body}>{body}</AppText>
      {children}
      {!children && showAction ? (
        <PrimaryButton
          label={actionLabel!}
          icon={actionIcon}
          iconPosition="leading"
          onPress={onActionPress}
          style={styles.cta}
        />
      ) : null}
    </Card>
  );
}

/**
 * Builds empty-state styles for the active palette.
 * @param colors - Active theme colors
 * @returns Style sheet
 */
function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      alignItems: "center",
      paddingVertical: 28,
      paddingHorizontal: 20,
      gap: 8,
      marginTop: 8,
      borderRadius: 16,
    },
    iconWrap: {
      width: 56,
      height: 56,
      borderRadius: 16,
      backgroundColor: colors.softTeal,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    title: {
      color: colors.navy,
      fontSize: 17,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.4,
      textAlign: "center",
    },
    body: {
      color: colors.muted,
      fontSize: 12,
      textAlign: "center",
      maxWidth: 260,
      lineHeight: 18,
    },
    cta: {
      marginTop: 10,
      alignSelf: "stretch",
      minHeight: 44,
      borderRadius: 12,
    },
  });
}
