import { Stack } from "expo-router";

/**
 * Auth route group layout.
 * @returns Auth stack
 */
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
