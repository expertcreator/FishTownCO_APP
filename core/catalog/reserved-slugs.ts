/**
 * Reserved slugs are **not owned here**. `RESERVED_SLUGS` and `isReservedSlug`
 * live in `@/constants`, the package the 5 backends pin, because the rule is
 * enforced on both sides: `generateUniqueTenantSlug` in `backend-shared-module`
 * treats a reserved base as taken, so a business named "Search" is created as
 * `search-<suffix>` and can never occupy a static route.
 *
 * A frontend-owned copy would be a second source of truth for a value the
 * backend already enforces against — exactly the duplication AGENTS.md Rule 1
 * forbids. This module stays as the `@/core/catalog` entry point so callers
 * keep importing slug rules from the catalog domain, and re-exports rather
 * than redeclares.
 *
 * The list covers every static top-level route that shadows `[city]` plus every
 * supported locale code, so adding a locale to `@/constants` cannot silently
 * open a `/{city}` collision.
 */
export { isReservedSlug, RESERVED_SLUGS } from "@/constants"
