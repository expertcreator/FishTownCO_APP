import type { ReactNode } from "react";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { Card } from "./Buttons";

type FormCardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Standard white form card with consistent field spacing (prototype forms).
 * @param props - Card props
 * @param props.children - Form fields and actions
 * @param props.style - Optional style overrides
 * @returns Form card element
 */
export function FormCard({ children, style }: FormCardProps) {
  return <Card style={[styles.card, style]}>{children}</Card>;
}

const styles = StyleSheet.create({
  card: { gap: 14 },
});
