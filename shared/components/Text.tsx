import { Text, type TextProps } from "react-native";

/**
 * Shared text primitive, same role as Foori `AppText`.
 * @param props - React Native text props
 * @returns Text element
 */
export default function AppText(props: TextProps) {
  return <Text {...props} />;
}
