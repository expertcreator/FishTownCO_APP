import { Linking } from "react-native";

function getPhoneDigits(phoneNumber: string): string | null {
  const trimmed = phoneNumber.trim();
  if (!trimmed) {
    return null;
  }

  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 3) {
    return null;
  }

  return digits;
}

export function getWhatsAppAppUri(phoneNumber: string): string | null {
  const digits = getPhoneDigits(phoneNumber);
  if (!digits) {
    return null;
  }
  return `whatsapp://send?phone=${digits}`;
}

export function getWhatsAppWebUri(phoneNumber: string): string | null {
  const digits = getPhoneDigits(phoneNumber);
  if (!digits) {
    return null;
  }
  return `https://wa.me/${digits}`;
}

export type OpenWhatsAppResult = "opened" | "not_installed" | "invalid";

async function tryOpenUrl(uri: string): Promise<boolean> {
  try {
    await Linking.openURL(uri);
    return true;
  } catch {
    return false;
  }
}

/**
 * Opens WhatsApp chat for a phone number.
 * Prefers the WhatsApp app scheme, then falls back to wa.me.
 */
export async function openWhatsAppChat(
  phoneNumber: string
): Promise<OpenWhatsAppResult> {
  const appUri = getWhatsAppAppUri(phoneNumber);
  const webUri = getWhatsAppWebUri(phoneNumber);
  if (!(appUri && webUri)) {
    return "invalid";
  }

  try {
    const canOpenApp = await Linking.canOpenURL(appUri);
    if (canOpenApp && (await tryOpenUrl(appUri))) {
      return "opened";
    }
  } catch {
    // Fall through to direct open / wa.me fallback.
  }

  // canOpenURL can be unreliable; still attempt the app scheme first.
  if (await tryOpenUrl(appUri)) {
    return "opened";
  }

  if (await tryOpenUrl(webUri)) {
    return "opened";
  }

  return "not_installed";
}
