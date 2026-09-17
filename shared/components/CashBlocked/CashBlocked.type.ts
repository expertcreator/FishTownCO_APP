import type { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

export type CashBlockedProps = {
  iconName?: ComponentProps<typeof MaterialCommunityIcons>["name"];
  title: string;
  description: string;
  subDescription: string;
  subDescriptionTitle?: string;
  primaryButtonTitle: string;
  onPrimaryPress: () => void;
  secondaryButtonTitle?: string;
  onSecondaryPress?: () => void;
  secondaryButtonLoading?: boolean;
  secondaryButtonDisabled?: boolean;
};
