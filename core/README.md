# frontend-core

Cross-app **pure TypeScript** shared by Fishtownco frontends (tenant admin, POS,
driver, customer, super-admin) and, where needed, the backend.

- No React, React Native, or UI
- No app HTTP clients (`ky`, axios), React Query, Zustand, or next-intl
- Enums and constants-only values belong in `src/constants` (import `@/constants`)
- No React, React Native, or UI
- No app HTTP clients (`ky`, axios), React Query, Zustand, or next-intl
- Enums and constants-only values belong in `src/constants` (import `@/constants`)
- Apps import a domain: `@/core/cash-drawers`, `@/core/daypart-menus`, `@/core/order-flags`, `@/core/catalog`, `@/core/i18n`, `@/core/customer-orders`, `@/core/rider-orders`, `@/core/rider-shifts`

For the rules that span packages rather than this one — the shared-submodule mount
map, cross-submodule import resolution, pin ordering, and what copying logic out
of an app obliges you to do — see [`BOUNDARIES.md`](./BOUNDARIES.md).

## Domains

| Folder | Role |
| --- | --- |
| `cart/` | Guest cart: one `CartState` per restaurant (`carts.ts`), checkout selection (`selection.ts`), line building and pricing inputs (`cart-line.ts`, `cart-pricing.ts`) |
| `cash-drawers/` | Branch cash entries, summaries, drawer days |
| `catalog/` | Public catalog vocabulary: slugs, city/area/restaurant/menu schemas, endpoint definitions, `CatalogTransport` |
| `customer-orders/` | What a **diner** sees: order-detail money parsing, customization lines, cancel eligibility, revision diffs, socket debounce |
| `daypart-menus/` | Locked morning→dinner windows, live slug, overlap, branch GET/PUT |
| `i18n/` | Which member of a localized record a locale reads, and its `Intl` tag |
| `order-flags/` | Order-flag eligibility, track, submit |
| `orders/` | What a **merchant** sees: accept/reject, live column filters, restaurant-facing totals |
| `pricing/` | Shared input → expected-total fixture table for `calculatePricing` |
| `rider-orders/` | What a **rider** sees: assignment actions, order details, line-item mapping, proof images |
| `rider-shifts/` | What a **rider** books: next shift, available slots, book, next-shift payload helpers |

`customer-orders/` and `orders/` are two audiences, not one domain split in half,
and they must not be merged. `orders/` is merchant/POS — `processOrderAction`,
`needsMarketplaceAcceptReject`, `restaurantFacingOrderTotal`,
`buildSellLiveColumnFilters` — reached only from `src/shared`, written for
`bun test`, and excluded from the marketplace app's coverage denominator.
`customer-orders/` is the diner's side, written for Vitest, and inside that
denominator. They would also collide by filename (`history.ts` against an order
status history, `process.ts` against cancellation). Put customer-facing order
logic in `customer-orders/`; a merchant decision belongs in `orders/` (`mw-4-3`).
`rider-orders/` is the third audience (driver app): assignment actions, details,
line-item mapping, and proof-image picking — do not merge it into either of the
other two.

`customer-orders/` is **utility-shaped**: pure modules plus two payload-type files
(`types.ts` for order detail, `list-types.ts` for the orders list) and a barrel,
with no `http.ts` / `api.ts` / `constants.ts`. Its `OrderStatus` union is
deliberately NOT `ORDER_STATUS` from `@/constants` — see the note at the top of
`list-types.ts` before you "deduplicate" it.

Every module in it is a **verbatim copy** of `mobile-tenant-app`'s
`features/orders/`, so it is diffable against the original and the `mw-4-13`
retrofit stays mechanical. Two Biome rules would rewrite those bodies, and both
are suppressed **inside the files themselves** — nothing is configured in any
app:

- `style/useConsistentTypeDefinitions` — 27 hits across six files, suppressed by
  a `// biome-ignore-all` at the top of `types.ts`, `list-types.ts`,
  `order-modified.ts`, `order-socket-invalidation.ts`,
  `order-modal-line-items.ts` and `revision-diff-model.ts`. It rewrites
  `type X = {}` to `interface X {}`, which is not assignability-equivalent — an
  interface gets no implicit index signature.
- `performance/useTopLevelRegex` — one hit, suppressed by an inline
  `// biome-ignore` at `order-list-item-display.ts`'s `\bdeal\b` test.

Biome marks both as **unsafe** fixes. Every other rule still applies here.

The suppressions are in-file rather than in a consuming app's `biome.json`
because a config block does not travel and this package does. Six apps mount
`core`, and two of them lint it wholesale: `frontend-tenant-admin`'s
`files.includes` is `["!graphify-out"]` and `frontend-super-admin-main`'s
`files` is `{}` — neither excludes any `src/core` path (measured 2026-08-30).
Whichever of them bumps its `core` pin first would inherit all 28 errors from a
folder it never touched. With the suppressions in the files, **an app that pins
this domain needs to do nothing at all.**

Four domains deliberately depart from the layout below — `catalog/`, `pricing/`,
`i18n/` and the `customer-orders/` shape described above. All four exemptions are
intentional; do not "complete" any of them.

`catalog/` is **transport-shaped**: it declares `CatalogTransport` and deliberately
has no `http.ts` / `api.ts`, because each app supplies its own implementation
(fixtures, then RSC fetch) until the HTTP swap in `mw-5-1`.

The city/area half of `catalog/` is resolved from a constant that ships with the
website (`mw-0-12`), not fetched — there is no list-areas endpoint and there will
not be one, so do not "fix" its absence in `endpoints.ts`.

`pricing/` is **data-shaped**: `pricing-fixtures.ts` plus a barrel, with no
`http.ts`, `api.ts`, `constants.ts` or `types.ts`. It owns no transport and no
calculation. The pricing engine itself is `calculatePricing` in `@/constants`, the
package all 5 backends pin, and it stays there so the server and both clients agree
by construction; what lives here is the table that proves they still do. The table
module imports **types only** and no test framework, so web's Vitest and mobile's
`bun test` can both execute it unchanged — adding an import from a runner would
break the half of the guarantee that is hardest to notice losing.

`i18n/` is **leaf-shaped**: `locale.ts` plus a barrel, with no `types.ts`,
`constants.ts`, `http.ts` or `api.ts`. It owns two pure functions and nothing else.
Its defining property is that it imports **nothing at all** — not even a type —
because `mobile-shared-module` re-exports it from `shared/utils/i18n.ts`, so any
import added here is an import added to every screen in three shipped apps. That
is the whole reason the domain exists (`mw-4-1`), and a test in
`i18n/__tests__/locale.test.ts` fails if the file grows one.

Each domain is a kebab-case folder with its own barrel. There is no root
`src/core/index.ts` — import the domain, not the submodule root.

## Domain layout

Required for an API-backed domain:

```text
src/core/<domain>/
  index.ts       # public barrel — only export what apps should import
  types.ts       # request/response/domain types (or schemas.ts if Zod-first)
  constants.ts   # domain-only values + API path object (see endpoints.ts)
  http.ts        # injected HTTP contract; optional create*Http factory
  api.ts         # typed list/get/create/delete helpers (take the http client)
```

Add extra **pure** files only when they stay framework-agnostic, for example:

- `payloads.ts` — request body builders
- `keypad.ts` / `amounts.ts` — input and money helpers
- `reasons.ts` / `visibility.ts` — domain rules
- `endpoints.ts` — path builders if `constants.ts` would get crowded
- `schemas.ts` — Zod request/response schemas

Do **not** put React components, hooks, query keys, permission gates, or i18n
copy here. Those stay in `src/features/<feature>/`.

## How to add a domain

Steps 2, 3 and 6 assume an **API-backed** domain. A domain that owns no transport
skips them — see the `catalog/` and `pricing/` exemptions above — but steps 1, 4,
5, 7 and the JSDoc rule apply to every domain without exception.

1. Create `src/core/<domain>/` using kebab-case (`cash-drawers`, not `cashDrawers`).
2. Add `http.ts` with an injected client type. Core must not import `@/shared/lib/api`.
3. Add `constants.ts` (or `endpoints.ts`) for relative API paths (no leading slash
   unless the existing client already expects one).
4. Put shared enums in `@/constants`. Do not copy `PAYMENT_METHODS`, categories,
   or other catalog values into core.
5. Add `types.ts` (and/or Zod `schemas.ts`). Type **every** request and response
   field. Create returns the created resource; `204` deletes return `void`.
6. Add `api.ts` helpers that take `(http, args)` and return `Promise<ConcreteType>`.
   Do not use `unknown` as a default response generic.
7. Export only the public surface from `index.ts`.
8. In the **app**, wrap the HTTP client (see `src/features/cash/lib/http.ts`) and
   keep React Query, permissions, and UI in the feature.

### App wiring (not in core)

```ts
import { createCashDrawersHttp, listCashEntries } from "@/core/cash-drawers"
import { restaurantAdminApi } from "@/shared/lib/api"

const http = createCashDrawersHttp(restaurantAdminApi)
await listCashEntries(http, { branchId, page: 0, limit: 20, businessFrom, businessTo })
```

Resolve the app client **per request** (or via live bindings) so tests can mock
`restaurantAdminApi`.

## JSDoc

Every exported function must have a JSDoc block (summary, `@param`, `@returns`,
`@throws` when it can throw, `@example` for non-obvious helpers).
