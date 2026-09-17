import type { CategoryTreeNode } from "./types"

/**
 * Flattens a paginated category tree into unique rows for a rail.
 * @param categories - Root nodes, each possibly with `subcategories`
 * @returns Depth-first unique categories
 */
export function flattenCategories<T extends CategoryTreeNode>(
  categories: T[]
): T[] {
  const map = new Map<string, T>()

  function visit(items: T[]) {
    for (const item of items) {
      if (!map.has(item.id)) map.set(item.id, item)
      if (item.subcategories?.length) visit(item.subcategories as T[])
    }
  }

  visit(categories)
  return [...map.values()]
}

function collectCategoryBranchIds<T extends CategoryTreeNode>(
  category: T,
  ids = new Set<string>()
): Set<string> {
  ids.add(category.id)

  for (const child of category.subcategories ?? []) {
    collectCategoryBranchIds(child, ids)
  }

  return ids
}

function findCategoryById<T extends CategoryTreeNode>(
  categories: T[],
  categoryId: string
): T | null {
  for (const category of categories) {
    if (category.id === categoryId) return category

    const nestedCategory = findCategoryById(
      (category.subcategories ?? []) as T[],
      categoryId
    )
    if (nestedCategory) return nestedCategory
  }

  return null
}

/**
 * Collects a category and all descendant ids for product filtering.
 * @param categories - Root tree used to resolve `categoryId`
 * @param categoryId - Selected rail category
 * @returns Id set; `[categoryId]` when the node is missing
 */
export function categoryFilterIds<T extends CategoryTreeNode>(
  categories: T[],
  categoryId: string
): Set<string> {
  const category = findCategoryById(categories, categoryId)
  return category ? collectCategoryBranchIds(category) : new Set([categoryId])
}
