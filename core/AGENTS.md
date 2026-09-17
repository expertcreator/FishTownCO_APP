# Core Agent Rules

Token-light guide for `src/core` (this submodule). Parent app: read `../AGENTS.md` first.

## What belongs here

Pure TypeScript shared by Fishtownco apps: types, Zod schemas, API helpers, domain logic.

**In:** functions, types, schemas, path builders, injected HTTP contracts.

**Out:** React, hooks, ky/axios, React Query, Zustand, next-intl, screens, query keys, permission checks. Constants-only catalogs stay in `src/constants` (`@/constants`).

Cross-package rules — which shared submodule a piece may land in, how a
`shared/` → `@/core` import resolves, the `core`-before-app pin order, and the
copy-not-move ticket obligation — are in `BOUNDARIES.md` next to this file. Read
it before choosing a package.

## Domain folder

```text
src/core/<kebab-domain>/
  index.ts      # barrel
  types.ts      # or schemas.ts
  constants.ts  # or endpoints.ts for paths
  http.ts       # injected client (+ optional create*Http)
  api.ts        # typed helpers: (http, args) => Promise<T>
```

Extra pure files are OK (`payloads.ts`, `amounts.ts`, …). No root `src/core/index.ts`. Apps import `@/core/<domain>`.

Existing: `cash-drawers`, `catalog`, `customer-orders`, `daypart-menus`, `i18n`, `order-flags`, `orders`, `pricing`, `rider-orders`, `rider-shifts`. Copy `cash-drawers` for a new API domain.

`customer-orders` and `orders` are **two audiences, never merge them**.
`customer-orders` is what a diner sees (order-detail money parsing, customization
lines, cancel eligibility, revision diffs, socket debounce); `orders` is
merchant/POS (accept/reject, live filters, restaurant-facing totals) and is
excluded from the marketplace app's coverage denominator, so logic landing there
by mistake silently forfeits the 95% gate. `customer-orders` is utility-shaped:
pure modules plus `types.ts` (order detail) and `list-types.ts` (orders list),
no `http.ts` / `api.ts` / `constants.ts`. Its `OrderStatus` union is 12 members
and is NOT `@/constants`' 8-member `ORDER_STATUS`; the two disagree on purpose
(`mw-4-3`).

`catalog` is transport-shaped (`schemas` / `endpoints` / `transport` / `reserved-slugs`)
and deliberately has **no `http.ts` / `api.ts`** — the app injects an implementation of
`CatalogTransport` until the HTTP swap in `mw-5-1`. Its city/area half comes from a
constant shipped with the website (`mw-0-12`), not from an endpoint — `endpoints.ts` has
no list-areas read on purpose.

`i18n` is leaf-shaped (`locale.ts` + barrel) and deliberately has **no `types.ts` /
`constants.ts` / `http.ts` / `api.ts`**. It imports **nothing**, not even a type:
mobile re-exports it from `shared/utils/i18n.ts`, so an import here is an import in
every screen of three shipped apps. Its own test fails if the file grows one.

`pricing` still has **no `http.ts` / `api.ts`** — it owns no transport, and
`calculatePricing` stays in `@/constants` (5-backend pin) and is never reimplemented.
What it does own since `mw-4-2` is the layer between that engine and a screen:
`delivery-rule` (the tenant charge rule + the fee it produces), `branch-pricing` (which
fee and tax rate win), `minimum-order`, and `endpoints` (the one public read, performed
by the app's `CatalogTransport`). Their provenance differs and it matters:
`delivery-rule`'s three fee helpers are verbatim from mobile's
`features/home/utils/`, `branch-pricing`'s two functions are verbatim from its
`features/cart/screens/ViewCartDetailScreen.tsx` **except for one sanctioned deviation**
(`useApiFee` also requires both coordinate pins — see that module's docblock),
`minimum-order` is a distillation of two `useMemo`s, and `endpoints` is new. Do not
"improve" a fallback chain or a `Number.isFinite` guard in the copied parts, and do not
add a second deviation without a spec change-log entry. `pricing-fixtures` is unchanged: the
shared table proving web and mobile agree with the engine to the paisa. That table
imports **types only** and no test framework, because mobile's `bun test` and web's
Vitest both run the same file — a runner import would silently kill that.

## Adding a domain

1. New kebab-case folder.
2. `http.ts` — do not import `@/shared/lib/api`.
3. Paths in `constants.ts` / `endpoints.ts`.
4. Reuse `@/constants` for shared enums. Do not duplicate them.
5. Fully type request and response bodies. No `T = unknown` on create/list.
6. Barrel only the public API from `index.ts`.
7. App feature: HTTP adapter, React Query, permissions, UI.

## HTTP

Inject the client. Optional `createXHttp(client)` factory for ky-shaped apps.

```ts
export function listItems(http: DomainHttp, args: ListArgs): Promise<ListResponse>
```

App adapter lives under `src/features/<feature>/lib/http.ts`, not in core.

## Docs

JSDoc on every export: summary, `@param`, `@returns`, `@throws` if needed, `@example` for non-obvious helpers. No placeholder docs.

## Tests (mandatory)

Every new or edited core export must have tests in `src/core/<domain>/__tests__/`, one file per module (`items.ts` → `__tests__/items.test.ts`). Do not add React or hook tests here.

## Flow

1. `rg` the domain folder.
2. Edit only that domain + the app adapter that already wraps it.
3. Run `bun test src/core/<domain>/__tests__` (or vitest where the domain already uses it).
