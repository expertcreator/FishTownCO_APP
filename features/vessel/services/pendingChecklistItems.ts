import {
  BUILD_CHECKLIST_ITEMS,
  type ChecklistItem,
} from "@/features/vessel/data/demoChecklist";

/**
 * Checklist entries that still need a placeholder record.
 * An id or matching title that already exists is skipped.
 * @param selectedIds - Ticked checklist ids
 * @param existing - Checklist ids and titles already saved on safety or wallet
 * @returns Entries to create
 */
export function pendingChecklistItems(
  selectedIds: string[],
  existing: { checklistIds: string[]; titles: string[] }
): ChecklistItem[] {
  const existingIds = new Set(
    existing.checklistIds.map((id) => id.trim()).filter(Boolean)
  );
  const existingTitles = new Set(
    existing.titles.map((title) => title.trim().toLowerCase()).filter(Boolean)
  );
  const seen = new Set<string>();
  const pending: ChecklistItem[] = [];

  for (const rawId of selectedIds) {
    const id = rawId.trim();
    if (!id || seen.has(id) || existingIds.has(id)) continue;
    const item = BUILD_CHECKLIST_ITEMS.find((entry) => entry.id === id);
    if (!item) continue;
    if (existingTitles.has(item.title.trim().toLowerCase())) continue;
    seen.add(id);
    pending.push(item);
  }

  return pending;
}
