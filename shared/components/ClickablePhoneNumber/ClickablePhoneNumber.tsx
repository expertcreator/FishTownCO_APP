import { useCallback } from "react";
import { Pressable } from "react-native";
import AppText from "../Text";
import type { ClickablePhoneNumberProps } from "./ClickablePhoneNumber.type";
import { getPhoneDialUri, openPhoneDialer } from "./phoneDialer";

const ClickablePhoneNumber = ({
  phoneNumber,
  fallback = "—",
  textStyle,
  numberOfLines = 2,
  accessibilityLabel,
}: ClickablePhoneNumberProps) => {
  const displayValue = phoneNumber?.trim() || fallback;
  const dialUri = phoneNumber ? getPhoneDialUri(phoneNumber) : null;
  const isCallable = dialUri != null;

  const handlePress = useCallback(async () => {
    if (!phoneNumber) {
      return;
    }

    await openPhoneDialer(phoneNumber);
  }, [phoneNumber]);

  if (!isCallable) {
    return (
      <AppText style={textStyle} numberOfLines={numberOfLines}>
        {displayValue}
      </AppText>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="link"
      accessibilityLabel={accessibilityLabel ?? displayValue}
      accessibilityHint="Opens the phone dialer"
      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
      style={({ pressed }) => [
        { alignSelf: "flex-start", maxWidth: "100%" },
        pressed ? { opacity: 0.7 } : undefined,
      ]}
    >
      <AppText style={textStyle} numberOfLines={numberOfLines}>
        {displayValue}
      </AppText>
    </Pressable>
  );
};

export default ClickablePhoneNumber;
