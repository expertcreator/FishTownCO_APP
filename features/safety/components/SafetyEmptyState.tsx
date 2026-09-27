import { router } from "expo-router";
import { EmptyState } from "@/ui/components";
import { useTranslation } from "@/ui/translations";

type SafetyEmptyStateProps = {
  /**
   * `inventory` — no safety items at all (shows Add CTA).
   * `filter` — items exist but none match the active filter.
   */
  variant?: "inventory" | "filter";
  /** Optional override for the Add CTA press handler. */
  onAddPress?: () => void;
};

/**
 * Safety empty-state card matching the inventory prototype.
 * Reuse wherever a safety-empty or filter-empty message is needed.
 * @param props - Empty state props
 * @param props.variant - Inventory vs filter-empty copy
 * @param props.onAddPress - Optional Add Safety handler
 * @returns Safety empty state element
 */
export function SafetyEmptyState({
  variant = "inventory",
  onAddPress,
}: SafetyEmptyStateProps) {
  const { t } = useTranslation();
  const isInventory = variant === "inventory";

  return (
    <EmptyState
      icon="boat-outline"
      title={
        isInventory
          ? t("safety.empty-title")
          : t("safety.empty-filter-title")
      }
      body={
        isInventory ? t("safety.empty-body") : t("safety.empty-filter-body")
      }
      actionLabel={isInventory ? t("safety.add-item") : undefined}
      actionIcon="add"
      onActionPress={
        isInventory
          ? onAddPress ?? (() => router.push("/safety/add"))
          : undefined
      }
    />
  );
}
