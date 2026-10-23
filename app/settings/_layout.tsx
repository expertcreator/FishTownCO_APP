import { Stack } from "expo-router";

/**
 * Settings stack layout.
 * @returns Settings stack
 */
export default function SettingsLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
