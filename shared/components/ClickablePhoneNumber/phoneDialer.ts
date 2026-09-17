import { Linking } from "react-native";

export function getPhoneDialUri(phoneNumber: string): string | null {
  const trimmed = phoneNumber.trim();
  if (!trimmed) {
    return null;
  }

  const hasLeadingPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 3) {
    return null;
  }

  return `tel:${hasLeadingPlus ? `+${digits}` : digits}`;
}

export async function openPhoneDialer(phoneNumber: string): Promise<boolean> {
  const dialUri = getPhoneDialUri(phoneNumber);
  if (!dialUri) {
    return false;
  }

  try {
    await Linking.openURL(dialUri);
    return true;
  } catch {
    return false;
  }
}
