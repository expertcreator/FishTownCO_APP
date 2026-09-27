import { router } from "expo-router";
import { FloatingActionButton } from "@/ui/components";
import { useTranslation } from "@/ui/translations";

type AddSafetyFabProps = {
  /**
   * When true, shows the “Add Safety Item” label on the FAB.
   * Defaults to icon-only (prototype Safety tab).
   */
  showLabel?: boolean;
  /** Optional override for the press handler (defaults to `/safety/add`). */
  onPress?: () => void;
};

/**
 * App-wide Add Safety floating action button.
 * Navigates to the Add Safety Item form; reuse on any screen that needs it.
 * @param props - FAB props
 * @param props.showLabel - Whether to show the visible label
 * @param props.onPress - Optional custom press handler
 * @returns Add Safety FAB element
 */
export function AddSafetyFab({
  showLabel = false,
  onPress,
}: AddSafetyFabProps) {
  const { t } = useTranslation();
  const label = t("safety.add-item");

  return (
    <FloatingActionButton
      label={showLabel ? label : undefined}
      accessibilityLabel={label}
      icon="add"
      onPress={onPress ?? (() => router.push("/safety/add"))}
    />
  );
}
