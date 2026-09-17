// KeyboardAwareContainer.style.ts
import { StyleSheet } from "react-native";
import { colors } from "@/shared/constants";

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollViewContent: {
    flexGrow: 1, // important for FlashList / scrollable content
    padding: 20,
  },
});
